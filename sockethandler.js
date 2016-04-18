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

      // send an update to the client every 3s
      setInterval(sendTweetFetcherLogs, 3000)


      callback()
  }
}

const waitForConnections = function() {
  io.sockets.on('connection', function(s) {
    console.log("socket connection established");
    openSockets.push(s)

    s.on('disconnect', function() {
        console.log(s.id, 'Got disconnect!');

        let i = openSockets.indexOf(s);
        openSockets.splice(i, 1);
     });
  })
}

const sendTweetFetcherLogs = function() {
  tweetfetcher.getStats( (statsStr) => {
    openSockets.forEach( (s) => {
      s.emit('fetcher-log', statsStr);
    })
  })
}


module.exports = sockethandler;
