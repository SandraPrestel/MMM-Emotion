import json
import sys
import os
import inspect
import time
import signal
from collections import Counter
import csv
from datetime import date, timedelta, datetime

# video and image packages
import cv2
from picamera2 import Picamera2

# machine learning packages
import numpy as np
from keras.models import load_model
import pandas as pd

# Emotion Recognition models
from deepface import DeepFace


# get module configuration, configure shutdown mechanism and set global variables
CONFIG = json.loads(sys.argv[1])
USED_MODEL = CONFIG['emotionRecognitionModel']
PATH_TO_FILE = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

# track emotions of last 5 minutes in a FIFO list
detected_emotions = []  
currentEmotion = ""

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

def most_frequent(List):
    occurence_count = Counter(List)
    return occurence_count.most_common(1)[0][0]

def update_history(emotion):
    today = str(date.today())
    currentTime = str(datetime.now().time())

    #add emotion to CSV with date and time
    filename = PATH_TO_FILE + '/history_data.csv'
    newRow = [[today, currentTime, emotion]]

    to_node("status", "Adding to History"+str(newRow))

    with open(filename, 'a') as csvfile:
        csvwriter = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
        csvwriter.writerows(newRow)

def recent_history():
    # get count of emotions of today and previous two days
    today = str(date.today())
    yesterday = str(date.today()- timedelta(days=1))
    before_yesterday = str(date.today()- timedelta(days=2))

    filename = PATH_TO_FILE + '/history_data.csv'

    df = pd.read_csv(filename)
    df_today = df.loc[df['Day'] == today]
    df_yesterday = df.loc[df['Day'] == yesterday] 
    df_before_yesterday = df.loc[df['Day'] == before_yesterday] 

    df_emotions_today = df_today.value_counts('Emotion')
    df_emotions_yesterday = df_yesterday.value_counts('Emotion')
    df_emotions_before_yesterday = df_before_yesterday.value_counts('Emotion')

    # return in JSON form
    history = {"today": df_emotions_today.to_json(), 
               "yesterday": df_emotions_yesterday.to_json(),
               "before_yesterday": df_emotions_before_yesterday.to_json()}
    
    return history

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

## next lines only for debugging
#time.sleep(2)
#picam2.capture_file("testPython.jpg")
#to_node("status", "Testimage saved...")

# do the emotion recognition at the interval and using the model specified in config.js
while True:

    if closeSafe == True:
        break

    # capture frame and detect faces
    img = picam2.capture_array()
    greyImg = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = FACE_DETECTOR.detectMultiScale(image=greyImg, scaleFactor=1.2, minNeighbors=5, minSize=(30,30))
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
                currentEmotion = faceAnalysis[0]['dominant_emotion']
                detected_emotions.insert(0, currentEmotion)   # add to front of list
                to_node("status", "Detection completed...")

            case 'Kaggle':
                # this model needs a grayscale image with resolution (48,48)
                shape = (48, 48)
                faceReshaped = cv2.resize(faceRegionGrey, shape, interpolation= cv2.INTER_LINEAR)
                faceAsNPArray = np.array(faceReshaped).reshape(-1, 48, 48, 1)
                to_node("status", "Image processed...")

                predictions = kaggleModel.predict(faceAsNPArray, verbose = 0)
                currentEmotion = kaggleLabels[np.argmax(predictions)]
                detected_emotions.insert(0, currentEmotion)  # add to front of list
                to_node("status", "Detection completed...")
        
        # make sure that the list is max. as long as configured
        if len(detected_emotions) > CONFIG['averageOver']:
            detected_emotions.pop()     # remove last item = oldest entry

        to_node("status", "List of emotions: "+str(detected_emotions))

        update_history(currentEmotion)

        returnMessage = most_frequent(detected_emotions)

    elif (noFaces == 0):
        returnMessage = "no Faces detected"

    elif (noFaces > 1):
        returnMessage = "multiple Faces detected"

    history = recent_history()

    result = {'message': returnMessage, 'history': history}
    to_node("status", "result: "+str(result))

    # return the result to the mirror
    to_node('result', {'emotion': result})

    # wait until interval is passed and check periodically if python should shutdown
    interval_left = CONFIG['interval']
    while interval_left > 0:
        if closeSafe == True:
            break
        interval_left -= 5
        time.sleep(5)

    # close the loop when mirror is shut down
    if closeSafe == True:
        break

picam2.stop()
