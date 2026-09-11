import logging
import time
from ml.pipeline_schemas import PipelineRequest, PipelineResponse
from ml.nba_schemas import NextBestAction, ApplicationState
from ml.extraction import extract_citizen_information
from ml.retrieval import scheme_retriever
from ml.eligibility import evaluate_eligibility
from ml.provenance import build_provenance
from ml.nba import get_next_best_action

logger = logging.getLogger(__name__)

class RAASTAPipeline:
    def __init__(self, extraction_provider=None):
        self.extraction_provider = extraction_provider

    def run(self, request: PipelineRequest) -> PipelineResponse:
        start_time = time.time()
        diagnostics = {}
        
        try:
            # 1. Validate request
            query = request.query
            if not query or not query.strip():
                return PipelineResponse(
                    status="invalid_request",
                    query=query,
                    error_message="Query cannot be empty."
                )
                
            # 2. Extract citizen information
            t0 = time.time()
            citizen_info = extract_citizen_information(query, provider=self.extraction_provider)
            diagnostics['extraction_time_ms'] = round((time.time() - t0) * 1000, 2)
        
            # 3. Validate extraction & handle casual greetings
            if citizen_info.intent in ["greeting", "capabilities_inquiry"]:
                msg = citizen_info.summary or "Hello! I am RAASTA, your citizen service assistant. How can I help you today?"
                nba = NextBestAction(
                    action_type="request_information",
                    title="How can I help you today?",
                    description=msg,
                    priority="high",
                    reason="Citizen provided a casual greeting or general question.",
                    required_item=None
                )
                diagnostics["total_time_ms"] = round((time.time() - start_time) * 1000, 2)
                return PipelineResponse(
                    status="greeting",
                    query=query,
                    extraction=citizen_info,
                    retrieval={"results": []},
                    next_best_action=nba,
                    diagnostics=diagnostics
                )
            
            # 4. Enrich retrieval representation
            # (Implicitly handled by passing CitizenInformation to retrieval, which builds a structured query)
        
            # 5. Retrieve candidate schemes
            t0 = time.time()
            retrieval_res = scheme_retriever.retrieve(citizen_info)
            diagnostics["retrieval_time_ms"] = round((time.time() - t0) * 1000, 2)
            diagnostics["candidates_found"] = len(retrieval_res.results)
        
            # 6. Detect insufficient information
            # Combine retrieval failure with extraction failure
            if retrieval_res.status in ["no_relevant_scheme", "insufficient_information"]:
                nba = NextBestAction(
                    action_type="request_information",
                    title="Tell us more about what you need",
                    description="We need more information to find the right government service for you.",
                    priority="high",
                    reason="The provided query did not contain enough specifics to match an official scheme.",
                    required_item=None
                )
                return PipelineResponse(
                    status=retrieval_res.status,
                    query=query,
                    extraction=citizen_info,
                    retrieval={"results": [r.model_dump() for r in retrieval_res.results]},
                    next_best_action=nba,
                    diagnostics=diagnostics
                )
            
            # 7. Rank/select best scheme
            # We enforce a strict threshold here. If the top score is too low, reject it.
            top_scheme_result = retrieval_res.results[0]
            if top_scheme_result.score < 0.1: # Threshold to prevent hallucinations
                 nba = NextBestAction(
                    action_type="request_information",
                    title="Tell us more about what you need",
                    description="We couldn't confidently match a scheme. Please provide more details.",
                    priority="high",
                    reason="Top retrieved scheme score was below the confidence threshold.",
                    required_item=None
                )
                 return PipelineResponse(
                    status="no_relevant_scheme",
                    query=query,
                    extraction=citizen_info,
                    retrieval={"results": [r.model_dump() for r in retrieval_res.results]},
                    next_best_action=nba,
                    diagnostics=diagnostics
                )
            
            selected_scheme_meta = {
                "scheme_id": top_scheme_result.scheme_id,
                "scheme_name": top_scheme_result.scheme_name
            }
            diagnostics["selected_scheme_id"] = top_scheme_result.scheme_id
            diagnostics["selected_scheme_score"] = top_scheme_result.score
        
            full_scheme_data = next((s for s in scheme_retriever.schemes_data if s["scheme_id"] == top_scheme_result.scheme_id), None)
            if not full_scheme_data:
                raise ValueError(f"Full scheme data not found for {top_scheme_result.scheme_id}")
            
            # 8. Evaluate deterministic eligibility
            t0 = time.time()
            el_res = evaluate_eligibility(citizen_info, full_scheme_data)
            diagnostics["eligibility_time_ms"] = round((time.time() - t0) * 1000, 2)
        
            # 9. Build official evidence & 10. Build provenance
            t0 = time.time()
            prov_res = build_provenance(citizen_info, full_scheme_data, el_res)
            diagnostics["provenance_time_ms"] = round((time.time() - t0) * 1000, 2)
        
            # 11. Determine journey state
            app_state = request.application_state or ApplicationState()
        
            # 12. Determine ONE next best action
            t0 = time.time()
            nba = get_next_best_action(citizen_info, full_scheme_data, el_res, prov_res, app_state)
            diagnostics["nba_time_ms"] = round((time.time() - t0) * 1000, 2)
        
            # 13. Return structured response
            diagnostics["total_time_ms"] = round((time.time() - start_time) * 1000, 2)
        
            return PipelineResponse(
                status="success",
                query=query,
                extraction=citizen_info,
                retrieval={"results": [r.model_dump() for r in retrieval_res.results]},
                selected_scheme=selected_scheme_meta,
                eligibility=el_res,
                provenance=prov_res,
                next_best_action=nba,
                diagnostics=diagnostics
            )
        
        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            diagnostics["failure_stage"] = "exception_caught"
            diagnostics["total_time_ms"] = round((time.time() - start_time) * 1000, 2)
            return PipelineResponse(
                status="error",
                query=request.query if request else "",
                error_message=str(e),
                diagnostics=diagnostics
            )
