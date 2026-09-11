import re
from typing import Tuple, Any, Optional

INDIAN_STATES = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "delhi", "jammu and kashmir", "ladakh", "puducherry", "chandigarh",
    "andaman and nicobar", "dadra and nagar haveli and daman and diu"
}


class DeterministicFactValidator:
    """
    Deterministic safety validator protecting the citizen journey from LLM hallucinations,
    type errors, or invalid state mutations.
    """

    @classmethod
    def validate_fact(cls, field: str, raw_value: Any) -> Tuple[bool, Optional[Any], Optional[str]]:
        """
        Validates and normalizes a proposed fact.
        Returns: (is_valid: bool, normalized_value: Any, rejection_reason: Optional[str])
        """
        if raw_value is None:
            return False, None, "Value is None"

        field_clean = field.lower().strip()

        # 1. Annual Income
        if field_clean == "annual_income":
            if isinstance(raw_value, (int, float)):
                num = float(raw_value)
                if 0 < num < 100:  # e.g., 4 or 4.5 meaning lakh
                    return True, int(num * 100000), None
                elif num > 0:
                    return True, int(num), None
                return False, None, "Income must be positive"

            val_str = str(raw_value).lower().strip()
            word_to_num = {
                "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
                "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
            }
            for w, n in word_to_num.items():
                val_str = re.sub(rf'\b{w}\b', str(n), val_str)

            digits = re.search(r'(\d+(?:\.\d+)?)', val_str)
            if digits:
                num = float(digits.group(1))
                if "lakh" in val_str or "lac" in val_str:
                    return True, int(num * 100000), None
                elif "thousand" in val_str:
                    return True, int(num * 1000), None
                elif num < 100:
                    return True, int(num * 100000), None
                else:
                    return True, int(num), None
            return False, None, f"'{raw_value}' is not a valid numeric income"

        # 2. Percentage / Marks
        elif field_clean in ["class_12_percentile", "previous_class_marks_percentage"]:
            if isinstance(raw_value, (int, float)):
                val = float(raw_value)
                if 0 <= val <= 100:
                    return True, int(val) if val.is_integer() else val, None
                return False, None, "Percentage must be between 0 and 100"

            val_str = str(raw_value).lower().strip()
            digits = re.search(r'(\d{1,3}(?:\.\d+)?)\s*(?:%|percent)?', val_str)
            if digits:
                val = float(digits.group(1))
                if 0 <= val <= 100:
                    return True, int(val) if val.is_integer() else val, None
            return False, None, f"'{raw_value}' is not a valid percentage (0-100)"

        # 3. Age
        elif field_clean == "age":
            if isinstance(raw_value, (int, float)):
                val = int(raw_value)
                if 1 <= val <= 120:
                    return True, val, None
                return False, None, "Age must be between 1 and 120"

            val_str = str(raw_value).lower().strip()
            digits = re.search(r'\b(\d{1,3})\b', val_str)
            if digits:
                val = int(digits.group(1))
                if 1 <= val <= 120:
                    return True, val, None
            return False, None, f"'{raw_value}' is not a valid age (1-120)"

        # 4. State
        elif field_clean == "state":
            val_str = str(raw_value).lower().strip().rstrip('.')
            for st in INDIAN_STATES:
                if st in val_str or st == val_str:
                    return True, st.title(), None
            return False, None, f"'{raw_value}' is not a recognized Indian state"

        # 5. District
        elif field_clean == "district":
            val_str = str(raw_value).strip().rstrip('.')
            clean_dist = re.sub(r'\s+district$', '', val_str, flags=re.IGNORECASE).strip()
            if len(clean_dist) >= 2 and clean_dist.replace(' ', '').isalpha():
                return True, clean_dist.title(), None
            return False, None, f"'{raw_value}' is not a valid district name"

        # 6. Date of Birth
        elif field_clean in ["date_of_birth", "dob"]:
            val_str = str(raw_value).strip()
            # ISO format: YYYY-MM-DD
            if re.match(r'^\d{4}-\d{2}-\d{2}$', val_str):
                return True, val_str, None
            # Spoken format: "14 March 2006"
            if re.search(r'\d{1,2}\s+[a-zA-Z]+\s+\d{4}', val_str):
                return True, val_str, None
            return False, None, f"'{raw_value}' is not a complete date of birth"

        # 7. Booleans
        elif field_clean in [
            "is_regular_course", "receiving_other_scholarship", "is_farmer",
            "has_existing_lpg_connection", "owns_pucca_house"
        ]:
            if isinstance(raw_value, bool):
                return True, raw_value, None
            val_str = str(raw_value).lower().strip()
            if any(w in val_str for w in ["true", "yes", "y", "regular", "full time", "own", "have", "we do"]):
                return True, True, None
            if any(w in val_str for w in ["false", "no", "n", "dont", "don't", "never", "no other"]):
                return True, False, None
            return False, None, f"'{raw_value}' cannot be resolved to boolean True/False"

        # 8. General string entities (full_name, college_name, address)
        val_str = str(raw_value).strip().rstrip('.')
        if len(val_str) > 0 and len(val_str) < 250:
            return True, val_str.title() if field_clean in ["full_name", "college_name"] else val_str, None

        return False, None, "Invalid entity format"
