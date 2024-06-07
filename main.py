import json
import sys
import os
import inspect
import time
import cv2
from picamera2 import Picamera2

def to_node(type, message):
    # convert to json and print (node helper will read from stdout)
    try:
        print(json.dumps({type: message}))
    except Exception:
        pass
    # stdout has to be flushed manually to prevent delays in the node helper communication
    sys.stdout.flush()


to_node("status", "Backend loaded...")

# variables
detected_emotion = "none"
path_to_file = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

# setup face detector
face_detector = cv2.CascadeClassifier(path_to_file + "/face_detection/haarcascade_frontalface_default.xml")
cv2.startWindowThread()
to_node("status", "CV2 started...")

# start the camera
picam2 = Picamera2()
camera_config = picam2.create_preview_configuration(main={"format": 'XRGB8888', "size": (640, 480)})
picam2.configure(camera_config)
picam2.start()

time.sleep(2)
picam2.capture_file("testPython.jpg")
to_node("status", "Testimage saved...")

# capture frame
img = picam2.capture_array()

# detect faces in frame
grey = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
faces = face_detector.detectMultiScale(grey, 1.1, 5)

# debugging
noFaces = len(faces)
returnMessage = "Detected " + noFaces + " faces"


picam2.stop()

# dummy result
to_node('result', {'emotion': returnMessage})    #TODO: Replace by detected emotion
