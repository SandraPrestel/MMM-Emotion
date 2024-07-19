Module.register("MMM-Emotion", {

    emotions : ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'],
    icons: {'angry': '<i class="fa-regular fa-face-angry"></i>', 
        'disgust': '<i class="fa-regular fa-face-grimace"></i>', 
        'fear': '<i class="fa-regular fa-face-flushed"></i>', 
        'happy': '<i class="fa-regular fa-face-laugh-beam"></i>', 
        'neutral': '<i class="fa-regular fa-face-meh"></i>', 
        'sad': '<i class="fa-regular fa-face-frown-open"></i>', 
        'surprise': '<i class="fa-regular fa-face-surprise"></i>',
        'no': '<i class="fa-solid fa-xmark"></i>'},
    currentEmotion : "Loading...",
    historyData : {
        'today': {'angry':0, 'disgust':0, 'fear':0, 'happy':0, 'neutral':0, 'sad':0, 'surprise':0}, 
        'yesterday': {'angry':0, 'disgust':0, 'fear':0, 'happy':0, 'neutral':0, 'sad':0, 'surprise':0}, 
        'before_yesterday': {'angry':0, 'disgust':0, 'fear':0, 'happy':0, 'neutral':0, 'sad':0, 'surprise':0}
    },
    messages : {},
    qr_code : "",
    breathingVisible : true, // the module is visible on starting MM

    // default config values
    defaults: {
        // switch between emotion recognition models, 'DeepFace' or'Kaggle'
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        interval: 10*60,
        // how many detections should be used to determine the current emotion
        averageOver: 5, 
        // what to show as reaction to your emotion
        show: ['current', 'message', 'image', 'song', 'history','breath'],
        messageFile: 'custom_messages.json',
        songFile: 'custom_songs.json',
        useAImessages: true     // otherwise, the custom messages in messageFile are used
    },

    saveHistory: function(history){
        this.historyData['today']['angry'] = JSON.parse(history.today).angry;
        this.historyData['today']['disgust'] = JSON.parse(history.today).disgust;
        this.historyData['today']['fear'] = JSON.parse(history.today).fear;
        this.historyData['today']['happy'] = JSON.parse(history.today).happy;
        this.historyData['today']['neutral'] = JSON.parse(history.today).neutral;
        this.historyData['today']['sad'] = JSON.parse(history.today).sad;
        this.historyData['today']['surprise'] = JSON.parse(history.today).surprise;

        this.historyData['yesterday']['angry'] = JSON.parse(history.yesterday).angry;
        this.historyData['yesterday']['disgust'] = JSON.parse(history.yesterday).disgust;
        this.historyData['yesterday']['fear'] = JSON.parse(history.yesterday).fear;
        this.historyData['yesterday']['happy'] = JSON.parse(history.yesterday).happy;
        this.historyData['yesterday']['neutral'] = JSON.parse(history.yesterday).neutral;
        this.historyData['yesterday']['sad'] = JSON.parse(history.yesterday).sad;
        this.historyData['yesterday']['surprise'] = JSON.parse(history.yesterday).surprise;

        this.historyData['before_yesterday']['angry'] = JSON.parse(history.before_yesterday).angry;
        this.historyData['before_yesterday']['disgust'] = JSON.parse(history.before_yesterday).disgust;
        this.historyData['before_yesterday']['fear'] = JSON.parse(history.before_yesterday).fear;
        this.historyData['before_yesterday']['happy'] = JSON.parse(history.before_yesterday).happy;
        this.historyData['before_yesterday']['neutral'] = JSON.parse(history.before_yesterday).neutral;
        this.historyData['before_yesterday']['sad'] = JSON.parse(history.before_yesterday).sad;
        this.historyData['before_yesterday']['surprise'] = JSON.parse(history.before_yesterday).surprise;

        Log.log("Today: "+ this.historyData['today'])
        Log.log("Today Happy: "+ this.historyData['today']['happy'])
    },

    socketNotificationReceived: function(notification, payload){

        if(notification === 'emotion') {
            // only change the display if the emotion has changed
            if (payload.emotion.message !== this.currentEmotion){
                this.currentEmotion = payload.emotion.message

                this.saveHistory(payload.emotion.history)

                // if the QR needs to be loaded, updateDom() needs to be postponed
                if (this.config.show.includes('song')){
                    this.sendSocketNotification('GET_QR', this.currentEmotion);
                } else {
                    this.updateDom();
                }
            }
        } else if (notification === 'GOT_MESSAGES'){
            this.messages = payload.messages;

            Log.log("Got messages: " + payload.messages);
            //TODO: Testing, ob UpdateDom notwendig ist, wenn Messages nach Emotionen ankommen (unwahrscheinlich)

        } else if (notification === 'GOT_QR'){
            this.qr_code = payload;
            this.updateDom();
        }
    },

    start: function() {
        // initial call
        this.displayMessage = "Detecting Emotion ..."
        this.currentEmotion = ""

        this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);

        // get messages for emotions
        if (this.config.show.includes('message')){
            this.sendSocketNotification('GET_MESSAGES', this.config);
        } 
    },

    // Show current emotion as text and icon
    moduleEmotion: function(){
        var currentDiv = document.createElement("div");
        currentDiv.className = 'currentEmotionModule';

        var iconDiv = document.createElement("div");
        iconDiv.className = 'iconDiv';
        var icon = '';
        if (this.emotions.includes(this.currentEmotion)){
            icon = this.icons[this.currentEmotion];
        } else {
            icon = this.icons['no'];
        }
        iconDiv.innerHTML = icon;
        currentDiv.appendChild(iconDiv);

        var emotionTextDiv = document.createElement("div");
        emotionTextDiv.className = 'textDiv';

        if (this.emotions.includes(this.currentEmotion)){
            emotionTextDiv.innerHTML = 'I feel ' + this.currentEmotion;
        } else {
            emotionTextDiv.innerHTML = this.currentEmotion;
        }
        currentDiv.appendChild(emotionTextDiv);

        return currentDiv;
    },

    moduleMessage: function(){
        var messageDiv = document.createElement("div");
        messageDiv.className = 'messageModule';

        if (this.emotions.includes(this.currentEmotion)){
            messageDiv.innerHTML = this.messages[this.currentEmotion];
        } else {
            emotionTextDiv.innerHTML = "";
        }
        
        return messageDiv;
    },

    moduleImage: function(){
        var imageDiv = document.createElement("img");
		imageDiv.className = "imageModule";
        imageDiv.style.height = "200px";    //TODO: move to CSS

        var imgPath = ""
        if (this.emotions.includes(this.currentEmotion)){
            imgPath = "/images/" + this.currentEmotion + ".jpg";
        } else {
            imgPath = "/images/" + "none" + ".jpg";
        }

        imageDiv.src = "modules/" + this.name + imgPath;

		return imageDiv
    },

    moduleSong: function(){
        var songDiv = document.createElement("div");
        songDiv.className = "songModule";

        // Header
        var songHeaderDiv = document.createElement("div");
        songHeaderDiv.className = "textDiv";
        songHeaderDiv.innerHTML = "Recommended Music";
        songDiv.appendChild(songHeaderDiv);

        // QR Code
        var qrDiv = document.createElement("img");
        qrDiv.className = "qrCode";
        qrDiv.style.height = "80px";    //TODO: move to CSS

        if (this.emotions.includes(this.currentEmotion)){
            qrDiv.src = this.qr_code;
        } else {
            qrDiv.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
        songDiv.appendChild(qrDiv);

        return songDiv;
    },

    moduleHistory: function(){
        var chart = document.createElement("div");
        chart.className = "chart";
		chart.style.width = "500px";		//TODO: move to CSS
		chart.style.height = "500px";	//TODO: move to CSS

        var ctx = document.createElement("canvas");
		chart.appendChild(ctx);

        //TODO: Anzeigeeinstellungen (CSS)
        chartObject = new Chart(ctx, {
			type: 'radar',
			data: {
				labels: ['Anger', 
                    'Disgust', 
                    'Fear', 
                    'Happy', 
                    'Neutral', 
                    'Sad', 
                    'Surprise'],
				datasets: [{
				    label: 'Two days ago',
				    data: [this.historyData['before_yesterday']['angry'], 
                        this.historyData['before_yesterday']['disgust'],
                        this.historyData['before_yesterday']['fear'],
                        this.historyData['before_yesterday']['happy'],
                        this.historyData['before_yesterday']['neutral'],
                        this.historyData['before_yesterday']['sad'],
                        this.historyData['before_yesterday']['surprise']],
                    fill: true,
				    backgroundColor: ['rgba(100, 170, 103, 0.4)'],
                    borderColor: 'rgb(100, 170, 103)',
                    pointBackgroundColor: 'rgb(100, 170, 103)'
				},
                {
				    label: 'Yesterday',
				    data: [this.historyData['yesterday']['angry'], 
                        this.historyData['yesterday']['disgust'],
                        this.historyData['yesterday']['fear'],
                        this.historyData['yesterday']['happy'],
                        this.historyData['yesterday']['neutral'],
                        this.historyData['yesterday']['sad'],
                        this.historyData['yesterday']['surprise']],
                    fill: true,
				    backgroundColor: ['rgba(54, 162, 235, 0.4)'],
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)'
				},
                {
				    label: 'Today',
				    data: [this.historyData['today']['angry'], 
                        this.historyData['today']['disgust'],
                        this.historyData['today']['fear'],
                        this.historyData['today']['happy'],
                        this.historyData['today']['neutral'],
                        this.historyData['today']['sad'],
                        this.historyData['today']['surprise']],
                    fill: true,
				    backgroundColor: ['rgba(255, 99, 132, 0.4)'],
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)'
				}
            ]},
            options: {
                scales: {
                    r: {
                        ticks: {display: false}
                    }
                }
            }
		  });

		  return chart;
    },

    // Turn on and off the module MMM-Breathwork based on current emotion
    triggerBreathwork: function() {
        var relevantEmotions = ['angry', 'fear'];
        breathingVisible_new = (relevantEmotions.includes(this.currentEmotion)) ? true : false;

        // only send notification if visibility should change
        if(breathingVisible_new != this.breathingVisible){
            this.breathingVisible = breathingVisible_new;
            this.sendNotification("REMOTE_ACTION",  {action: "TOGGLE", module: "MMM-Breathwork"})
        }
    },

    // Build the module display
    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.className = "module";

        var title = document.createElement("header");
        title.className = "title";
        title.innerHTML = "My Emotions";
        wrapper.appendChild(title);

        if (this.config.show.includes('current')){
            wrapper.appendChild(this.moduleEmotion());
        }

        if (this.config.show.includes('message')){
            wrapper.appendChild(this.moduleMessage());
        }

        if (this.config.show.includes('image')){
            wrapper.appendChild(this.moduleImage())
        }

        if (this.config.show.includes('song')){
            wrapper.appendChild(this.moduleSong());
        }

        if (this.config.show.includes('history')){
            wrapper.appendChild(this.moduleHistory());
        }

        if (this.config.show.includes('breath')){
            this.triggerBreathwork();
        }

        return wrapper;
    },
}
);
