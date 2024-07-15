Module.register("MMM-Emotion", {

    currentEmotion : "",
    displayMessage : "keine Emotion erkannt",

    // default config values
    defaults: {
        // switch between emotion recognition models, 'DeepFace' or'Kaggle'
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        interval: 1*60
    },

    socketNotificationReceived: function(notification, payload){
        // only change the display if the emotion has changed
        if (payload.emotion !== this.currentEmotion){
            this.currentEmotion = payload.emotion

            //TODO: Different reactions based on the emotions
            this.displayMessage = this.currentEmotion

            this.updateDom()
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
        
        wrapper.innerHTML = this.displayMessage;

        return wrapper;
    },
}
);
