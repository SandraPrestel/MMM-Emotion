Module.register("MMM-Emotion", {

    currentEmotion : "",
    displayMessage : "keine Emotion erkannt",

    // default config values
    defaults: {
        // switch between emotion recognition models, values: 'DeepFace', 'Kaggle', 'ViTFace' (currently not functional)
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        // TODO: change after development, currently set to only once per hour to save on resources while testing
        interval: 3600
    },

    socketNotificationReceived: function(notification, payload){
        // only change the display if the emotion has changed
        if (payload.emotion !== this.currentEmotion){
            this.currentEmotion = payload.emotion   //TODO: make sure this is a string

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
