Module.register("MMM-Emotion", {

    currentEmotion : "",
    displayMessage : "keine Emotion erkannt",

    // default config values
    defaults: {
        // switch between emotion recognition models, 'DeepFace' or'Kaggle'
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        interval: 1*60,
        // how many detections should be used to determine the current emotion
        averageOver: 5, 
        // what to show as reaction to your emotion
        show: ['status', 'message', 'image', 'song'] 
    },

    socketNotificationReceived: function(notification, payload){

        if(notification === 'emotion') {
            // only change the display if the emotion has changed
            if (payload.emotion.message !== this.currentEmotion){
                this.currentEmotion = payload.emotion.message

                //TODO: Different reactions based on the emotions
                this.displayMessage = this.currentEmotion

                //TODO: Display history

                this.updateDom()
            }
        }
        
    },

    start: function() {
        // initial call
        this.displayMessage = "Detecting Emotion ..."
        this.currentEmotion = ""

        this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
    },

    // Build the module display
    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.className = "module";

        var title = document.createElement("header");
        title.className = "title";
        title.innerHTML = "My Emotions";
        wrapper.appendChild(title);

        var message = document.createElement("message");
        message.innerHTML = this.displayMessage;
        wrapper.appendChild(message);

        return wrapper;
    },
}
);
