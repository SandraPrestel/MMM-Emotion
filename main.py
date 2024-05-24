import json
import sys
import os

def to_node(type, message):
    # convert to json and print (node helper will read from stdout)
    try:
        print(json.dumps({type: message}))
    except Exception:
        pass
    # stdout has to be flushed manually to prevent delays in the node helper communication
    sys.stdout.flush()


to_node("status", "Emotion Recognition started...")

# variables
detected_emotion = "none"

# dummy result
to_node('result', {'emotion': 'Test'})