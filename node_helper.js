// Implementation based on https://github.com/joanaz/MMM-Emotion-Detection and https://github.com/paviro/MMM-Facial-Recognition

'use strict';
const NodeHelper = require('node_helper');
const { PythonShell } = require('python-shell');
const onExit = require('signal-exit');

var pythonStarted = false

module.exports = NodeHelper.create({
    pyshell: null,
    py_process: null,

    python_start: function(){
        const self = this;

        console.log("Starting Python Shell")
        
        // create a shell to run our python script in
        this.pyshell = new PythonShell('modules/' + this.name + '/main.py', { 
            mode: 'json', 
            args: [JSON.stringify(this.config)],
            pythonPath: '/home/medicalmirror/mmenv/bin/python3'
        });

        this.py_process = this.pyshell.childprocess;
        
        // whenever the script returns a recognized emotion, send it on to our module
        this.pyshell.on('message', function(message){
          if (message.hasOwnProperty('status')){
            console.log("[" + this.name + "] " + message.status);
          }

          if (message.hasOwnProperty('result')) {
            this.sendSocketNotification('emotion', {
                emotion: message.result.emotion
              }
            );
          } else if (message.hasOwnProperty('error')) {
            console.log("[" + this.name + "] " + message.error.err_msg)
            this.sendSocketNotification('emotion', {
                error: message.error.err_msg
              }
            );
          }
        });

        // shutdown the python shell
        this.pyshell.end(function(err) {
            if (err) throw err;
            console.log("[" + this.name + "] " + 'finished running...');
        });
        
        onExit(function (_code, _signal) {
          this.destroy();
        });
    },

    stop: function () {
      console.log("Shutting down MMM-Emotion: calling Python termination")
      this.destroy();
    },
  
    destroy: function () {
      console.log('[' + this.name + '] ' + 'Terminate python');
      err = this.py_process.kill('SIGINT');
      console.log('[' + this.name + '] ' + 'err');
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
