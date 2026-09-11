import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_df_cache = None

def load_kaggle_dataset():
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    try:
        import pandas as pd
        import kagglehub

        # Attempt downloading/getting path via kagglehub
        path = kagglehub.dataset_download("jainamgada45/indian-government-schemes")
        csv_path = os.path.join(path, "updated_data.csv")

        if os.path.exists(csv_path):
            _df_cache = pd.read_csv(csv_path)
            logger.info(f"[KaggleDataset] Loaded {len(_df_cache)} schemes from Kaggle dataset.")
            return _df_cache
    except Exception as e:
        logger.warn(f"[KaggleDataset] Could not load Kaggle dataset via kagglehub: {e}")

    # Fallback to local cache path if available
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

def get_scheme_official_url(scheme_name: str, fallback_url: Optional[str] = None) -> str:
    """
    Looks up official government scheme link from Kaggle dataset (jainamgada45/indian-government-schemes).
    Returns https://www.myscheme.gov.in/schemes/<slug> or direct official portal URL.
    """
    default_fallback = fallback_url or "https://www.myscheme.gov.in/"
    if not scheme_name:
        return default_fallback

    df = load_kaggle_dataset()
    if df is None or df.empty:
        return default_fallback

    clean_name = scheme_name.lower().strip()

    # 1. Exact match on slug
    slug_match = df[df['slug'].str.lower() == clean_name]
    if not slug_match.empty:
        slug = slug_match.iloc[0]['slug']
        return f"https://www.myscheme.gov.in/schemes/{slug}"

    # 2. Substring / contains match on scheme_name
    # Extract core keywords from scheme_name (e.g. "PM-USP", "YASASVI", "KISAN", "Ujjwala", "Vishwakarma", "SVANidhi")
    name_words = re.findall(r'\b[A-Za-z0-9-]+\b', clean_name)
    significant_words = [w for w in name_words if len(w) > 3 and w not in ["scheme", "central", "sector", "national", "pradhan", "mantri"]]

    matches = []
    for idx, row in df.iterrows():
        s_name = str(row.get('scheme_name', '')).lower()
        if clean_name in s_name or s_name in clean_name:
            matches.append((row, 1.0))
        else:
            # Word overlap score
            matched_count = sum(1 for w in significant_words if w in s_name)
            if matched_count > 0:
                score = matched_count / max(1, len(significant_words))
                matches.append((row, score))

    if matches:
        matches.sort(key=lambda x: x[1], reverse=True)
        top_match = matches[0][0]

        # Check if application column contains an explicit HTTP URL
        app_text = str(top_match.get('application', ''))
        urls = re.findall(r'https?://[^\s>]+', app_text)
        if urls:
            clean_url = urls[0].rstrip('.,;)')
            if "gov.in" in clean_url or "nic.in" in clean_url or "org" in clean_url:
                return clean_url

        slug = top_match.get('slug')
        if pd.notna(slug) and slug:
            return f"https://www.myscheme.gov.in/schemes/{slug}"

    return default_fallback
