import sys, traceback, json
from ml.extraction import GemmaExtractionProvider

try:
    provider = GemmaExtractionProvider()
    res = provider.generate_extraction("i am a farmer")
    print(f"generate_extraction returned: {repr(res)}")
    print(f"type: {type(res)}")
    data = json.loads(res)
    print(f"loads returned: {repr(data)}")
    print(f"type of data: {type(data)}")
    
    # Let's test CitizenInformation(**data)
    from ml.schemas import CitizenInformation
    ci = CitizenInformation(**data)
    print("Success")
except Exception as e:
    traceback.print_exc()
