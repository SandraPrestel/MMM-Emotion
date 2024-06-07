import json
import sys
import os
import time
from picamera2 import Picamera2

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

# start the camera
picam2 = Picamera2()
camera_config = picam2.create_preview_configuration()
picam2.configure(camera_config)
picam2.start()

time.sleep(2)
picam2.capture_file("testPython.jpg")

picam2.stop()

# dummy result
to_node('result', {'emotion': 'File Saved'})
