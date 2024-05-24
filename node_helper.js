// Implementation based on https://github.com/joanaz/MMM-Emotion-Detection and https://github.com/paviro/MMM-Facial-Recognition

'use strict';
const NodeHelper = require('node_helper');
const { PythonShell } = require('python-shell');

var pythonStarted = false

module.exports = NodeHelper.create({
    python_start: function(){
        const self = this;

        // create a shell to run our python script in
        const pyshell = new PythonShell('modules/' + this.name + '/main.py', { 
            mode: 'json', 
            args: [JSON.stringify(this.config)]
        });
        
        // whenever the script returns a recognized emotion, send it on to our module
        pyshell.on('message', function(message){
          if (message.hasOwnProperty('status')){
            console.log("[" + self.name + "] " + message.status);
          }

          if (message.hasOwnProperty('result')) {
              //console.log("[" + self.name + "] " + (message.result.emotion));
              self.sendSocketNotification('emotion', {
                emotion: message.result.emotion     //TODO: make sure this is a string
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
        pyshell.end(function(err) {
            if (err) throw err;
            console.log("[" + self.name + "] " + 'finished running...');
          });
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
