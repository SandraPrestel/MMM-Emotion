'use strict';
const NodeHelper = require('node_helper');
const { PythonShell } = require('python-shell');
const onExit = require('signal-exit');
const fs = require("fs");
const QRCode = require('qrcode')
const os = require('os')

var pythonStarted = false

module.exports = NodeHelper.create({
    pyshell: null,
    py_process: null,

    python_start: function(){
        const self = this;

        console.log("Starting Python Shell on "+ this.config.pythonPath);
        
        // Start Python shell to run the script in
        self.pyshell = new PythonShell('modules/' + this.name + '/main.py', { 
            mode: 'json', 
            args: [JSON.stringify(this.config)],
            pythonPath: this.config.pythonPath
        });

        self.py_process = self.pyshell.childProcess;
        
        // Whenever the script returns a recognized emotion, send it on to our module
        self.pyshell.on('message', function(message){
          if (message.hasOwnProperty('status')){
            console.log("[" + self.name + "] " + message.status);
          }

          if (message.hasOwnProperty('result')) {
              self.sendSocketNotification('emotion', {
                emotion: message.result.emotion
              }
            );

          } else if (message.hasOwnProperty('error')) {
            console.log("[" + self.name + "] " + message.error.err_msg)
              self.sendSocketNotification('emotion', {
                error: message.error.err_msg
              }
            );
          }
        });

        // Shutdown the python shell
        self.pyshell.end(function(err) {
            if (err) throw err;
            console.log("[" + self.name + "] " + 'finished running...');
        });
        
        onExit(function (_code, _signal) {
          self.destroy();
        });
    },

    stop: function () {
      console.log("Shutting down MMM-Emotion: calling Python termination")
      this.destroy();
    },
  
    destroy: function () {
      console.log('[' + this.name + '] ' + 'Terminate python...');
      this.py_process.kill('SIGINT');
      console.log('[' + this.name + '] ' + 'Kill Message sent');
    },

    loadMessages: function () {
      var filepath = __dirname + '/' + this.config.messageFile;
      var file_content = JSON.parse(fs.readFileSync(filepath, "utf8"));

      this.sendSocketNotification('GOT_MESSAGES', {
        messages: file_content
      });
    },

    loadQR: function(emotion) {
      var filepath = __dirname + '/' + this.config.songFile;
      var file_content = JSON.parse(fs.readFileSync(filepath, "utf8"));
      var target = file_content[emotion];

      console.log("Get QR for emotion " + emotion + " on URL " + target);

      QRCode.toDataURL(`${target}`)
                .then(url => { this.sendSocketNotification('GOT_QR', url) })
                .catch(err => { console.error(err) })

    
    },

    loadAiImg: function(emotion) {
      console.log("Get Image for emotion " + emotion);
      this.asyncGetImage(emotion);
    },

    asyncGetImage: async function(emotion){
      const resp = await fetch(
        `https://api.limewire.com/api/image/generation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Version': 'v1',
            Accept: 'application/json',
            Authorization: 'Bearer '+this.config.apiKey
          },
          body: JSON.stringify({
            prompt: emotion,
            quality: 'LOW',
            aspect_ratio: '1:1'
          })
        }
      );
    
      const data = await resp.json();
      console.log("Image data: " + JSON.stringify(data));

      this.sendSocketNotification('GOT_AIIMG', data)
    },


    // Receive notifications from MMM-Emotion.js
    socketNotificationReceived: function(notification, payload) {
      // The config is sent on module startup
        if(notification === 'CONFIG') {
            this.config = payload

            // if python hasn't started yet, start the python shell
            if(!pythonStarted) {
                pythonStarted = true;
                this.python_start();
            };

        } else if(notification === 'GET_MESSAGES'){
            this.loadMessages();

        } else if(notification === 'GET_QR'){
            this.loadQR(payload);

        } else if(notification === 'GET_AIIMG'){
            this.loadAiImg(payload);
        }
    }

});
