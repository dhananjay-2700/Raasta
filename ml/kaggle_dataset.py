import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_df_cache = None

OFFICIAL_PORTAL_MAP = {
    "PM_USP_CSS": "https://scholarships.gov.in",
    "PM-USP": "https://scholarships.gov.in",
    "SCHOLARSHIP": "https://scholarships.gov.in",
    "PM_YASASVI_TCE": "https://scholarships.gov.in",
    "AB_PM_JAY": "https://pmjay.gov.in",
    "AB_PM_JAY_70_PLUS": "https://pmjay.gov.in",
    "PM_KISAN": "https://pmkisan.gov.in",
    "PMAY_U_2": "https://pmay-urban.gov.in",
    "PMUY_2": "https://www.pmuy.gov.in",
    "UJJWALA": "https://www.pmuy.gov.in",
    "PM_VISHWAKARMA": "https://pmvishwakarma.gov.in",
    "PM_SVANIDHI": "https://pmsvanidhi.mohua.gov.in",
    "NMMSS": "https://scholarships.gov.in"
}

def load_kaggle_dataset():
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    try:
        import pandas as pd
        import kagglehub

        path = kagglehub.dataset_download("jainamgada45/indian-government-schemes")
        csv_path = os.path.join(path, "updated_data.csv")

        if os.path.exists(csv_path):
            _df_cache = pd.read_csv(csv_path)
            logger.info(f"[KaggleDataset] Loaded {len(_df_cache)} schemes from Kaggle dataset.")
            return _df_cache
    except Exception as e:
        logger.warn(f"[KaggleDataset] Could not load Kaggle dataset via kagglehub: {e}")

    user_cache = os.path.expanduser(r"~\.cache\kagglehub\datasets\jainamgada45\indian-government-schemes\versions\1\updated_data.csv")
    if os.path.exists(user_cache):
        try:
            import pandas as pd
            _df_cache = pd.read_csv(user_cache)
            logger.info(f"[KaggleDataset] Loaded {len(_df_cache)} schemes from local user cache.")
            return _df_cache
        except Exception as e:
            logger.warn(f"[KaggleDataset] Failed loading local user cache: {e}")

    return None

def extract_official_url_from_row(row) -> Optional[str]:
    """Extracts official government portal URLs from dataset row fields."""
    fields_to_search = [
        str(row.get('application', '')),
        str(row.get('details', '')),
        str(row.get('eligibility', '')),
        str(row.get('documents', ''))
    ]

    combined_text = " ".join(fields_to_search)
    urls = re.findall(r'https?://[^\s>"\']+', combined_text)

    for url in urls:
        clean_url = url.rstrip('.,;)')
        # Filter for genuine official government / institution domains
        if any(dom in clean_url.lower() for dom in [".gov.in", ".nic.in", ".edu.in", ".ac.in", "scholarships.gov.in", "pmkisan.gov.in", "pmay", "pmjay", "pmuy", "pmvishwakarma", "pmsvanidhi"]):
            if "myscheme.gov.in" not in clean_url.lower():
                return clean_url

    # General HTTP fallback if valid official looking domain
    for url in urls:
        clean_url = url.rstrip('.,;)')
        if "myscheme.gov.in" not in clean_url.lower() and not clean_url.startswith("http://127.0.0.1"):
            return clean_url

    return None

def get_scheme_official_url(scheme_name: str, fallback_url: Optional[str] = None) -> str:
    """
    Looks up direct official government portal link (e.g. scholarships.gov.in, pmkisan.gov.in) from Kaggle dataset.
    """
    # 1. Check direct mapping by scheme name / id
    if scheme_name:
        clean_key = scheme_name.upper().strip()
        for k, v in OFFICIAL_PORTAL_MAP.items():
            if k in clean_key or clean_key in k:
                return v

    # 2. Search Kaggle dataset (3,400 schemes) for matching scheme & extract official site URL
    df = load_kaggle_dataset()
    if df is not None and not df.empty and scheme_name:
        clean_name = scheme_name.lower().strip()
        name_words = re.findall(r'\b[A-Za-z0-9-]+\b', clean_name)
        significant_words = [w for w in name_words if len(w) > 3 and w not in ["scheme", "central", "sector", "national", "pradhan", "mantri"]]

        matches = []
        for idx, row in df.iterrows():
            s_name = str(row.get('scheme_name', '')).lower()
            if clean_name in s_name or s_name in clean_name:
                matches.append((row, 1.0))
            else:
                matched_count = sum(1 for w in significant_words if w in s_name)
                if matched_count > 0:
                    score = matched_count / max(1, len(significant_words))
                    matches.append((row, score))

        if matches:
            matches.sort(key=lambda x: x[1], reverse=True)
            for match_row, score in matches[:5]:
                extracted_url = extract_official_url_from_row(match_row)
                if extracted_url:
                    return extracted_url

    # 3. Fallback checks for common scheme names
    lower_name = (scheme_name or "").lower()
    if "scholarship" in lower_name or "usp" in lower_name or "education" in lower_name or "yasasvi" in lower_name or "merit" in lower_name:
        return "https://scholarships.gov.in"
    elif "kisan" in lower_name or "farmer" in lower_name or "agriculture" in lower_name:
        return "https://pmkisan.gov.in"
    elif "housing" in lower_name or "pmay" in lower_name or "awas" in lower_name:
        return "https://pmay-urban.gov.in"
    elif "ujjwala" in lower_name or "lpg" in lower_name or "gas" in lower_name:
        return "https://www.pmuy.gov.in"
    elif "vishwakarma" in lower_name or "artisan" in lower_name:
        return "https://pmvishwakarma.gov.in"
    elif "svanidhi" in lower_name or "vendor" in lower_name or "hawker" in lower_name:
        return "https://pmsvanidhi.mohua.gov.in"
    elif "ayushman" in lower_name or "pmjay" in lower_name or "health" in lower_name:
        return "https://pmjay.gov.in"

    if fallback_url and "myscheme.gov.in" not in fallback_url:
        return fallback_url

    return "https://scholarships.gov.in"
