import urllib.request
import json
import traceback

queries = [
    "My daughter got admission to college but I cannot afford the fees. My income is 4 lakh.",
    "My father is 73 and needs treatment.",
    "I am a farmer and need financial assistance.",
    "I am a woman and we don't have an LPG connection.",
    "I need help from the government."
]

print("--- TESTING /api/raasta/analyze ---")
for q in queries:
    req = urllib.request.Request('http://127.0.0.1:8000/api/raasta/analyze', data=json.dumps({'query': q}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as f:
            res = json.loads(f.read().decode('utf-8'))
            scheme_id = res.get("selected_scheme", {}).get("scheme_id") if res.get("selected_scheme") else "None"
            nba = res.get("next_best_action", {}).get("action_type") if res.get("next_best_action") else "None"
            print(f"QUERY: {q}")
            print(f"STATUS: {res.get('status')}")
            print(f"SCHEME: {scheme_id}")
            print(f"NBA: {nba}")
            print("-" * 40)
    except Exception as e:
        print(f"QUERY: {q}\nERROR: {e}\n")

print("--- TESTING /api/intent ---")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/intent', data=json.dumps({'query': "daughter fees"}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as f:
        res = json.loads(f.read().decode('utf-8'))
        print(f"/api/intent OK, matched_service: {res.get('matched_service_id')}")
except Exception as e:
    print(f"ERROR: {e}")

print("--- TESTING /api/submit ---")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/submit', data=json.dumps({'service_id': "1", "data": {}}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as f:
        res = json.loads(f.read().decode('utf-8'))
        print(f"/api/submit OK, status: {res.get('status')}")
except Exception as e:
    print(f"ERROR: {e}")
