// Implementation based on https://github.com/joanaz/MMM-Emotion-Detection and https://github.com/paviro/MMM-Facial-Recognition

'use strict';
const NodeHelper = require('node_helper');
const { PythonShell } = require('python-shell');
const onExit = require('signal-exit');

var pythonStarted = false

module.exports = NodeHelper.create({
    pyshell: null,
    python_start: function(){
        const self = this;

        console.log("Starting Python Shell")
        
        // create a shell to run our python script in
        self.pyshell = new PythonShell('modules/' + this.name + '/main.py', { 
            mode: 'json', 
            args: [JSON.stringify(this.config)],
            pythonPath: '/home/medicalmirror/mmenv/bin/python3'
        });
        
        // whenever the script returns a recognized emotion, send it on to our module
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

        // shutdown the python shell
        self.pyshell.end(function(err) {
            if (err) throw err;
            console.log("[" + self.name + "] " + 'finished running...');
        });
        
        onExit(function (_code, _signal) {
          self.destroy();
        });
    },

    python_stop: function () {
      this.destroy();
    },
  
    destroy: function () {
      console.log('[' + this.name + '] ' + 'Terminate python');
      this.pyshell.childprocess.kill();
    },

    // Subclass socketNotificationReceived
    // handles messages from the module
    socketNotificationReceived: function(notification, payload) {
        if(notification === 'CONFIG') {
            // save config data sent by the message
            this.config = payload

            // if python hasn't started yet, start the python shell
            if(!pythonStarted) {
                pythonStarted = true;
                this.python_start();
            };
        };



    }

});
