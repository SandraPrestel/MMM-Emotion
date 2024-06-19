import json
import sys
import os
import inspect
import time
import cv2
from picamera2 import Picamera2
from deepface import DeepFace

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
detected_emotion = "no emotion detected"
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

# TODO: remove next lines (only for debugging)
time.sleep(2)
picam2.capture_file("testPython.jpg")
to_node("status", "Testimage saved...")


# TODO: wrap into loop until picamera.stop()

# capture frame
img = picam2.capture_array()

# detect faces in frame
greyImg = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces = face_detector.detectMultiScale(greyImg, 1.1, 5)

# detect emotion in face
noFaces = len(faces)    # make sure to only do this if a face was detected
to_node("status", str(noFaces)+" faces detected...")     # TODO: remove after debugging

if (noFaces == 1):
    rgbImg = rgb_frame = cv2.cvtColor(greyImg, cv2.COLOR_GRAY2RGB)
    
    x, y, w, h = faces[0]
    faceRegion = rgbImg[y:y + h, x:x + w]
    to_node("status", "Image cropped...")     # TODO: remove after debugging

    faceAnalysis = DeepFace.analyze(faceRegion, actions="emotion", enforce_detection=False)
    #detected_emotion = faceAnalysis[0]['dominant_emotion']

    #returnMessage = detected_emotion
    returnMessage = "one Face detected"

elif (noFaces == 0):
    returnMessage = "no Faces detected"

elif (noFaces > 1):
    returnMessage = "multiple Faces detected"

# return the result to the mirror
to_node('result', {'emotion': returnMessage})


picam2.stop()
