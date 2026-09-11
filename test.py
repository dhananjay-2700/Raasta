import sys, traceback
from ml.extraction import extract_citizen_information

try:
    print(extract_citizen_information("i am a farmer"))
except Exception as e:
    traceback.print_exc()
