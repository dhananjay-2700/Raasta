import asyncio
from backend.main import extract_field_endpoint, FieldExtractionRequest

async def run_adversarial_extraction():
    tests = [
        # Test 7
        ("date_of_birth", "14 March 2006", "2006-03-14", True),
        # Test 11
        ("annual_income", "My family earns around four lakh rupees per year.", 400000, True),
        ("district", "I live in Jaipur district.", "Jaipur", True),
        ("college_name", "Rajasthan University.", "Rajasthan University", True),
        ("mobile_number", "9876543210", "9876543210", True),
        # Test 12 (Ambiguous date)
        ("date_of_birth", "2006", None, False),
        # Test 13 (Bad / low confidence answer)
        ("annual_income", "Maybe around something.", None, False),
    ]

    print("=== EXTRACTION & ADVERSARIAL TESTS ===")
    results = {}
    for field, text, expected, should_succeed in tests:
        res = await extract_field_endpoint(FieldExtractionRequest(field=field, text=text))
        print(f"\n[{field}] input: '{text}'")
        print(f"   -> extracted value: '{res.value}', confidence: {res.confidence}, status: '{res.status}'")
        if should_succeed:
            passed = str(res.value).lower() == str(expected).lower() and res.status == "success"
            print(f"   -> MATCH EXPECTED ({expected}): {'PASS' if passed else 'FAIL'}")
            results[f"{field}_{text}"] = passed
        else:
            # Must NOT invent a complete date or autofill bad text
            passed = res.status == "needs_clarification" or (field == "date_of_birth" and len(str(res.value)) != 10)
            print(f"   -> CORRECTLY REFUSED/FLAGGED: {'PASS' if passed else 'FAIL'}")
            results[f"{field}_{text}"] = passed

    print("\nSummary:", results)

if __name__ == "__main__":
    asyncio.run(run_adversarial_extraction())
