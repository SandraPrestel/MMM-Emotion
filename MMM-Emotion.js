Module.register("MMM-Emotion", {

    currentEmotion : "keine Emotion erkannt",

    // default config values
    defaults: {
    },

    start: function() {
        // initial call

    },

    // Build the module display
    getDom: function () {
        var wrapper = document.createElement("div");
        
        wrapper.innerHTML = this.currentEmotion;

        return wrapper;
    },
}
);
