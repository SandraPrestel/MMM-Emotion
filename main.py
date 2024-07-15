import json
import sys
import os
import inspect
import time
import signal

# video and image packages
import cv2
from picamera2 import Picamera2

# machine learning packages
import numpy as np
import tensorflow as tf
import keras
from keras.models import load_model
import torch

# Emotion Recognition models
from deepface import DeepFace
from transformers import (AutoFeatureExtractor,
                          AutoModelForImageClassification,
                          AutoConfig)


# get module configuration, configure shutdown mechanism and set global variables
CONFIG = json.loads(sys.argv[1])
USED_MODEL = CONFIG['emotionRecognitionModel']
PATH_TO_FILE = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
detected_emotion = "no emotion detected"

def to_node(type, message):
    """Convert message to json and print (node helper will read from stdout)"""
    try:
        print(json.dumps({type: message}))
    except Exception:
        pass
    # stdout has to be flushed manually to prevent delays in the node helper communication
    sys.stdout.flush()

def signalHandler(signal, frame):
    global closeSafe
    closeSafe = True

signal.signal(signal.SIGINT, signalHandler)
closeSafe = False

to_node("status", "Module setup...")
to_node("status", "Selected model " + USED_MODEL + "...")

# setup environment and load models
# Deepface doesn't need additional resources
if (USED_MODEL == 'Kaggle'):
    kaggleModel = load_model(PATH_TO_FILE + '/face_detection/emotion_model8.h5')
    kaggleLabels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']  #TODO: verify these labels

to_node("status", "Environment setup...")


# Setup the face detection
FACE_DETECTOR = cv2.CascadeClassifier(PATH_TO_FILE + "/face_detection/haarcascade_frontalface_default.xml")
to_node("status", "Face Detection model loaded...")


# start the camera
picam2 = Picamera2()
camera_config = picam2.create_preview_configuration(main={"format": 'XRGB8888', "size": (640, 480)})
picam2.configure(camera_config)
picam2.start()

# TODO: remove next lines (only for debugging)
time.sleep(2)
picam2.capture_file("testPython.jpg")
to_node("status", "Testimage saved...")


# do the emotion recognition at the interval and using the model specified in config.js
while True:
    # capture frame and detect faces
    img = picam2.capture_array()
    greyImg = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = FACE_DETECTOR.detectMultiScale(image=greyImg, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))     #TODO: optimize parameters
    to_node("status", "Faces detected...")

    # only detect emotions for one face
    noFaces = len(faces)
    if (noFaces == 1):
        # crop the region for the face in the frame
        rgbImg = rgb_frame = cv2.cvtColor(greyImg, cv2.COLOR_GRAY2RGB)
        x, y, w, h = faces[0]                   
        faceRegion = rgbImg[y:y + h, x:x + w]
        faceRegionGrey = greyImg[y:y + h, x:x + w]

        match USED_MODEL:
            case 'DeepFace':
                faceAnalysis = DeepFace.analyze(faceRegion, actions="emotion", enforce_detection=False)
                detected_emotion = faceAnalysis[0]['dominant_emotion']
                to_node("status", "Detection completed...")

            case 'Kaggle':
                # this model needs a grayscale image with resolution (48,48)
                shape = (48, 48)
                faceReshaped = cv2.resize(faceRegionGrey, shape, interpolation= cv2.INTER_LINEAR)
                faceAsNPArray = np.array(faceReshaped).reshape(-1, 48, 48, 1)
                to_node("status", "Image processed...")

                predictions = kaggleModel.predict(faceAsNPArray, verbose = 0)
                detected_emotion = kaggleLabels[np.argmax(predictions)]
                to_node("status", "Detection completed...")
            
        returnMessage = detected_emotion

    elif (noFaces == 0):
        returnMessage = "no Faces detected"

    elif (noFaces > 1):
        returnMessage = "multiple Faces detected"

    # return the result to the mirror
    to_node('result', {'emotion': returnMessage})

    # close the loop when mirror is shut down
    if closeSafe == True:
        break

    time.sleep(CONFIG['interval'])

picam2.stop()
