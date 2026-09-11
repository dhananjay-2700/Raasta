from typing import Dict, Any, Optional
from ml.schemas import CitizenInformation
from ml.eligibility_schemas import EligibilityResponse
from ml.evidence_schemas import ProvenanceReport
from ml.nba_schemas import ApplicationState, NextBestAction

def get_next_best_action(
    citizen_information: CitizenInformation,
    scheme: Dict[str, Any],
    eligibility_result: EligibilityResponse,
    provenance_report: ProvenanceReport,
    application_state: Optional[ApplicationState] = None
) -> NextBestAction:
    """
    Deterministically computes the Next Best Action for the citizen based on priority rules.
    """
    if application_state is None:
        application_state = ApplicationState()

    # Priority 0: Ineligible
    # Hard stop. If ineligible, do not recommend anything else.
    if eligibility_result.status == "ineligible":
        return NextBestAction(
            action_type="no_action",
            title="This scheme may not be suitable",
            description="The available information does not satisfy the scheme's eligibility requirements.",
            priority="low",
            reason="One or more eligibility rules failed.",
            required_item=None
        )

    # Priority 1: Missing information required for eligibility
    if len(eligibility_result.missing_information) > 0:
        first_missing = eligibility_result.missing_information[0]
        field_name = first_missing.field
        return NextBestAction(
            action_type="request_information",
            title=f"Provide your {field_name.replace('_', ' ')}",
            description=f"Your {field_name.replace('_', ' ')} is required to verify eligibility.",
            priority="high",
            reason="The eligibility rule requires this information.",
            required_item=field_name
        )

    # Priority 2: Required document missing
    # Extract documents from the scheme JSON and compare against application state
    required_docs = scheme.get("required_documents", [])
    for doc_item in required_docs:
        doc_name = doc_item.get("name") if isinstance(doc_item, dict) else doc_item
        if doc_name not in application_state.uploaded_documents:
            return NextBestAction(
                action_type="upload_document",
                title=f"Upload your {doc_name}",
                description=f"A {doc_name} is required for this application.",
                priority="high",
                reason="The selected scheme requires this document.",
                required_item=doc_name
            )

    # Priority 3: Official verification required
    if len(eligibility_result.verification_required) > 0:
        first_verif = eligibility_result.verification_required[0]
        return NextBestAction(
            action_type="verify_information",
            title="Verify your beneficiary information",
            description="Official verification is required to proceed with this application.",
            priority="high",
            reason="An eligibility rule requires verification against an official government database.",
            required_item=first_verif.field
        )

    # Priority 4: Application review
    if not application_state.reviewed:
        return NextBestAction(
            action_type="review_application",
            title="Review your application",
            description="Please review all provided information and attached documents.",
            priority="medium",
            reason="Application must be reviewed before consent and submission.",
            required_item=None
        )

    # Priority 5: Consent
    if not application_state.consent_given:
        return NextBestAction(
            action_type="give_consent",
            title="Give consent to submit your application",
            description="Please provide your consent to submit the application to the government portal.",
            priority="medium",
            reason="Consent is legally required for submission.",
            required_item=None
        )

    # Priority 6: Submission
    if not application_state.submitted:
        return NextBestAction(
            action_type="submit_application",
            title="Submit your application",
            description="Your application is ready to be submitted.",
            priority="high",
            reason="All requirements are met and consent is provided.",
            required_item=None
        )

    # Priority 7: Tracking
    return NextBestAction(
        action_type="track_application",
        title="Track your application",
        description="Your application has been submitted successfully.",
        priority="low",
        reason="Application is currently in processing.",
        required_item=application_state.application_id
    )
