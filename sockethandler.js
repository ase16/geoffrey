'use strict'

const monitoring = require('./monitoring.js');
let io = require('socket.io');
const openSockets = [];


const sockethandler = {

  // this should only be called at startup
	init: function(server, callback) {

      io = io.listen(server);

      // waiting for incoming client socket connection requests
      waitForConnections();

      console.log('socket.io is ready');

      // send cpu usage metrics of the instance "geoffrey" to the client every 30s
      setInterval(sendCpuUsageMetrics, 30 * 1000)


      callback()
  }
};

const waitForConnections = function() {

  io.sockets.on('connection', function(s) {

    console.log("socket connection established");
    openSockets.push(s)

    sendCpuUsageMetrics() // send an initial data load to render

    s.on('disconnect', function() {
        console.log(s.id, 'got disconnected!');

        let i = openSockets.indexOf(s);
        openSockets.splice(i, 1);
     });
  })
};

const sendCpuUsageMetrics = function() {

  if (openSockets.length ==  0 ) return;

  console.log("sending cpu usage metrics to front-end")
  function getStartTime() {
    var d = new Date();
    return d.setHours(d.getHours() - 1);
  }

  function getEndTime() {
    return new Date();
  }

  monitoring.getCpuUsageTimeseries(getStartTime(), getEndTime(), function(err, res) {
    if (err) console.log(err)
    else {
      openSockets.forEach( (s) => s.emit('cpu-usage', res))
    }
  })
};



module.exports = sockethandler;
