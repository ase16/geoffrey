'use strict'

const tweetfetcher = require('./tweetfetcher.js')
let io = require('socket.io');
const openSockets = [];
let server;

const sockethandler = {

  // this should only be called at startup
	init: function(server, callback) {

      server = server;

      io = io.listen(server);
      waitForConnections();

      console.log('socket.io is ready');
      callback()
  }
}

const waitForConnections = function() {
  io.sockets.on('connection', function(s) {
    console.log("socket connection established");
    openSockets.push(s)
  })

  //TODO remove socket from openSockets on disconnect
}

const sendTweetFetcherLogs = function() {
  openSockets.forEach( (s) => {
    tweetfetcher.getStats( (statsStr) => {
      s.emit('fetcher-log', statsStr);
    })
  })
}

// send an update to the client every 3s
setInterval(sendTweetFetcherLogs, 3000)

module.exports = sockethandler;
