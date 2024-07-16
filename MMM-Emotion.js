Module.register("MMM-Emotion", {

    currentEmotion : "",
    displayMessage : "keine Emotion erkannt",
    historyData : {
        'today': {'angry':1, 'disgust':1, 'fear':1, 'happy':1, 'neutral':1, 'sad':1, 'surprise':1}, 
        'yesterday': {'angry':1, 'disgust':1, 'fear':1, 'happy':1, 'neutral':1, 'sad':1, 'surprise':1}, 
        'before_yesterday': {'angry':1, 'disgust':1, 'fear':1, 'happy':1, 'neutral':1, 'sad':1, 'surprise':1}
    },

    // default config values
    defaults: {
        // switch between emotion recognition models, 'DeepFace' or'Kaggle'
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        interval: 1*60,
        // how many detections should be used to determine the current emotion
        averageOver: 5, 
        // what to show as reaction to your emotion
        show: ['status', 'message', 'image', 'song', 'history'] 
    },

    saveHistory: function(history){
        this.historyData['today'] = JSON.parse(history.today);
        this.historyData['yesterday'] = JSON.parse(history.today);
        this.historyData['before_yesterday'] = JSON.parse(history.today);

        Log.log("Today: "+ this.historyData['today'])
        Log.log("Today Happy: "+ this.historyData['today']['happy'])
    },

    HistoryChart: function(){
        var chart = document.createElement("div");
        chart.className = "chart";
		chart.style.width = "300px";		//TODO: move to CSS
		chart.style.height = "300px";	//TODO: move to CSS

        var ctx = document.createElement("canvas");
		chart.appendChild(ctx);

        chartObject = new Chart(ctx, {
			type: 'radar',
			data: {
				labels: [
				  'Happy',
				  'Sad'
				],
				datasets: [{
				    label: 'Today',
				    data: [this.historyData['today']['happy'], this.historyData['today']['sad']],
				    backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff'
				}]
			}
		  });

		  return chart;
    },

    socketNotificationReceived: function(notification, payload){

        if(notification === 'emotion') {
            // only change the display if the emotion has changed
            if (payload.emotion.message !== this.currentEmotion){
                this.currentEmotion = payload.emotion.message

                //TODO: Different reactions based on the emotions
                this.displayMessage = this.currentEmotion

                // Display history
                this.saveHistory(payload.emotion.history)

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

        wrapper.appendChild(this.HistoryChart());

        return wrapper;
    },
}
);
