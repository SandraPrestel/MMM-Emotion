Module.register("MMM-Emotion", {

    currentEmotion : "",
    displayMessage : "keine Emotion erkannt",

    // default config values
    defaults: {
        // makes switching between different tested models easier - remove in final iteration
        recognitionModel: 1,
        // detection interval in seconds
        interval: 60
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
        this.displayMessage = "Module started..."
        this.currentEmotion = ""
    },

    // Build the module display
    getDom: function () {
        var wrapper = document.createElement("div");
        
        wrapper.innerHTML = this.currentEmotion;

        return wrapper;
    },
}
);
