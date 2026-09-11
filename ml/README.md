# RAASTA ML Knowledge Base

This directory contains the foundational Machine Learning knowledge base for the RAASTA project. It is designed to enable the deterministic evaluation, retrieval, and synthesis of government schemes for citizens.

## Files
* `schemes.json`: The core schema database of 10 primary Indian Government schemes covering education, healthcare, agriculture, housing, welfare, and livelihood.

## Data Schema
The JSON structure is meticulously designed to support deterministic rule engines and LLM-based Retrieval-Augmented Generation (RAG).

Each scheme object contains:
* `scheme_id`: A unique, stable identifier.
* `name`, `department`, `category`: High-level official metadata.
* `description`: A plain-language summary of the scheme's purpose.
* `target_problems`: Examples of problems a citizen might describe that the scheme aims to solve.
* `eligibility`: A deterministic rule-set where each rule defines a `field` (e.g. `annual_income`), an `operator` (e.g. `<=`), and a `value`. This allows an eligibility engine to mechanically compute pass/fail/missing criteria against extracted citizen attributes.
* `required_documents`: The specific official documents required to verify eligibility.
* `application_fields`: The normalized field names (e.g., `fullName`, `aadhaar_number`) required to complete an application.
* `evidence`: Pointers to official government documentation (URLs and titles) used to ground LLM responses in verifiable truth.
* `retrieval`: Pre-computed `keywords` and `example_queries` to assist semantic search algorithms (like BM25 or embedding models).

## Data Quality Philosophy
1. **No Hallucination:** Eligibility criteria are sourced strictly from official government portals (e.g., `gov.in` websites). We do not invent rules.
2. **Verification Required:** When a rule relies on complex, nested government evaluations (such as the SECC 2011 deprivation criteria for PM-JAY or the 14-point declaration for PMUY), the value is marked as `"verification_required"`. This indicates that the rule cannot be resolved with a simple scalar comparison and requires an external registry lookup.
3. **Consistency:** Normalized field names (like `annual_income`, `age`, `owns_pucca_house`) are shared across schemes to simplify the form-filling and extraction prompts.

## Next Steps
This dataset will serve as the foundation for:
* Building vector embeddings for semantic retrieval.
* Creating the prompt chains that extract `application_fields` from user conversations.
* Powering the deterministic eligibility evaluation engine.
