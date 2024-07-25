Module.register("MMM-Emotion", {
///	SETUP
    // Variables and initial values
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
    aiImagePath : "",
    aiLimitReached : false,

    // Default module config
    defaults: {
        // switch between emotion recognition models, 'DeepFace' or'Kaggle'
        emotionRecognitionModel: 'DeepFace',
        // detection interval in seconds
        interval: 10*60,
        // how many detections should be used to determine the current emotion
        averageOver: 5, 
        // which elements to display
        show: ['current', 'message', 'image', 'song', 'history','breath'],
        messageFile: 'custom_messages.json',
        songFile: 'custom_songs.json',
        useAIimages: true,
        apiKey: ''  // see readme
    },

    // Styling
	getStyles: function() {
		return ["MMM-Emotion.css"];
	},

    // Translations
	getTranslations: function() {
		return {
				en: "translations/en.json",
				de: "translations/de.json"
		}
	},

    getScripts: function () {
        return ["modules/" + this.name + "/node_modules/chart.js/dist/Chart.min.js"];
    },

/// STARTING AND RUNNING
	// Initialisation
    start: function() {
        // initial call
        this.displayMessage = this.translate("LOADING");
        this.currentEmotion = ""

        this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);

        // get messages for emotions
        if (this.config.show.includes('message')){
            this.sendSocketNotification('GET_MESSAGES', this.config);
        } 
    },

    // Override socket notification handler
    socketNotificationReceived: function(notification, payload){
        if(notification === 'emotion') {
            // Only change the display if the return message has changed
            if (payload.emotion.message !== this.currentEmotion){
                this.currentEmotion = payload.emotion.message
                this.saveHistory(payload.emotion.history)

                // If the QR or image needs to be loaded, those methods need be called and updateDom() is postponed
                // However, only do this if an emotion has been recognized
                if (this.config.show.includes('song')&&this.emotions.includes(this.currentEmotion)){
                    this.sendSocketNotification('GET_QR', this.currentEmotion);
                } else {
                    if (this.config.useAIimages && !this.aiLimitReached && this.emotions.includes(this.currentEmotion)){
                        this.sendSocketNotification('GET_AIIMG', this.currentEmotion);
                    } else {
                        this.updateDom();
                    }
                }
            }

        } else if (notification === 'GOT_MESSAGES'){
            this.messages = payload.messages;
            Log.log("Got messages: " + payload.messages);

        } else if (notification === 'GOT_QR'){
            this.qr_code = payload;

            // If the AI image needs to be loaded as well, postpone the display update
            if (this.config.useAIimages){
                this.sendSocketNotification('GET_AIIMG', this.currentEmotion);
            } else {
                this.updateDom();
            }

        } else if (notification === 'GOT_AIIMG') {
            // The quota of AI images is very low, so when it is reached, use the local images instead
            if (payload["status"]==403){
                this.aiImagePath = "";
                this.aiLimitReached = true;
                Log.info('Credit for AI image generation exceeded!');
            
            // handle other errors
            } else if (payload["status"]!="COMPLETED"){
                this.aiImagePath = "";
                Log.info('Error calling AI image generation: '+payload["status"]);

            } else {
                var data = payload["data"];
                this.aiImagePath = data[0]["asset_url"];
                Log.info("AI Image URL: " + this.aiImagePath);
              }
            this.updateDom();
        }
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

    // Override DOM generator - Generating the display
    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.className = "module";

        var title = document.createElement("header");
        title.className = "title";
        title.innerHTML = this.translate("EMOTIONS_TITLE");
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
    
/// DISPLAY MODULES
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
            emotionTextDiv.innerHTML = this.translate("IFEEL") + this.translate(this.currentEmotion);
        } else {
            emotionTextDiv.innerHTML = "\uf1b9"+this.translate(this.currentEmotion);    //TODO: Remove
        }
        currentDiv.appendChild(emotionTextDiv);

        return currentDiv;
    },

    // Short message relating to emotion as loaded from the file
    moduleMessage: function(){
        var messageDiv = document.createElement("div");
        messageDiv.className = 'messageModule';

        if (this.emotions.includes(this.currentEmotion)){
            messageDiv.innerHTML = this.messages[config.language][this.currentEmotion];
        } else {
            messageDiv.innerHTML = "";
        }
        
        return messageDiv;
    },

    // Image realting to emotion, can optionally be created by AI
    moduleImage: function(){
        var imageDiv = document.createElement("img");
		imageDiv.className = "imageModule";
        imageDiv.style.height = "200px";    //TODO: move to CSS

        var imgPath = ""
        if (this.emotions.includes(this.currentEmotion)){
            if (this.config.useAIimages && !this.aiLimitReached){
                imgPath = this.aiImagePath;
            } else {
                imgPath = "modules/" + this.name + "/images/" + this.currentEmotion + ".jpg";
            }
        } else {
            imgPath = "modules/" + this.name + "/images/" + "none" + ".jpg";
        }

        imageDiv.src = imgPath;

		return imageDiv
    },

    // QR code representing URL to a song or playlist related to emotion
    moduleSong: function(){
        var songDiv = document.createElement("div");
        songDiv.className = "songModule";

        // Header
        var songHeaderDiv = document.createElement("div");
        songHeaderDiv.className = "textDiv";
        
        // QR Code
        var qrDiv = document.createElement("img");
        qrDiv.className = "qrCode";
        qrDiv.style.height = "80px";    //TODO: move to CSS

        if (this.emotions.includes(this.currentEmotion)){
            songHeaderDiv.innerHTML = this.translate("RECOMMENDED");
            qrDiv.src = this.qr_code;
        } else {
            songHeaderDiv.innerHTML = this.translate("NORECOMMENDATION");
            qrDiv.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }

        songDiv.appendChild(songHeaderDiv);
        songDiv.appendChild(qrDiv);

        return songDiv;
    },

    // Overview of the emotions from the last few days
    moduleHistory: function(){
        var chart = document.createElement("div");
        chart.className = "chart";
		chart.style.width = "500px";		//TODO: move to CSS
		chart.style.height = "500px";	//TODO: move to CSS

        var ctx = document.createElement("canvas");
		chart.appendChild(ctx);

        var chartData = {
            labels: ["\uf1b9", 
                this.translate("LABELDISGUST"), 
                this.translate("LABELFEAR"), 
                this.translate("LABELHAPPY"), 
                this.translate("LABELNEUTRAL"), 
                this.translate("LABELSAD"), 
                this.translate("LABELSURPRISE")],
            datasets: [{
                label: this.translate("BEFOREYESTERDAY"),
                data: [this.historyData['before_yesterday']['angry'], 
                    this.historyData['before_yesterday']['disgust'],
                    this.historyData['before_yesterday']['fear'],
                    this.historyData['before_yesterday']['happy'],
                    this.historyData['before_yesterday']['neutral'],
                    this.historyData['before_yesterday']['sad'],
                    this.historyData['before_yesterday']['surprise']],
                fill: true,
                backgroundColor: ['rgba(100, 170, 103, 0.5)'],
                borderColor: 'rgb(100, 170, 103)',
                pointBackgroundColor: 'rgb(100, 170, 103)'
            },
            {
                label: this.translate("YESTERDAY"),
                data: [this.historyData['yesterday']['angry'], 
                    this.historyData['yesterday']['disgust'],
                    this.historyData['yesterday']['fear'],
                    this.historyData['yesterday']['happy'],
                    this.historyData['yesterday']['neutral'],
                    this.historyData['yesterday']['sad'],
                    this.historyData['yesterday']['surprise']],
                fill: true,
                backgroundColor: ['rgba(54, 162, 235, 0.5)'],
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)'
            },
            {
                label: this.translate("TODAY"),
                data: [this.historyData['today']['angry'], 
                    this.historyData['today']['disgust'],
                    this.historyData['today']['fear'],
                    this.historyData['today']['happy'],
                    this.historyData['today']['neutral'],
                    this.historyData['today']['sad'],
                    this.historyData['today']['surprise']],
                fill: true,
                backgroundColor: ['rgba(255, 99, 132, 0.5)'],
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)'
            }
        ]};

        Chart.defaults.defaultFontFamily = "'Font Awesome 6 Free','Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'";

        chartObject = new Chart(ctx, {
			type: 'radar',
			data: chartData,
            options: {
                scale: {
                    pointLabels: {
                        fontFamily: "'Font Awesome 6 Free'"
                    },
                    ticks: {
                        display: false
                    },
                    angleLines: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.4)'
                    },
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

    
}
);
