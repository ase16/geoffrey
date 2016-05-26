'use strict'

const monitoring = require('./monitoring.js');
let io = require('socket.io');

// a map to store open socket connections
const openSockets = new Map()
openSockets.set('geoffrey', [])
openSockets.set('carlton', [])
openSockets.set('will', [])
openSockets.set('jazz', [])

// a map to store cpu metrics for different node types
const cpuMetrics = new Map()
cpuMetrics.set('geoffrey', {})
cpuMetrics.set('carlton', {})
cpuMetrics.set('will', {})
cpuMetrics.set('jazz', {})


const handleConnections = function() {

  io.sockets.on('connection', function(socket) {

    const query = socket.handshake.query

    if ( ! query.hasOwnProperty('nodeType')) {
      console.log('connection for socket [' + socket.id + '] declined because of missing handshake query attribute "nodeType"');
      socket.disconnect()
      return
    }

    if ( ! isValidNodeType(query.nodeType)) {
      console.log('connection for socket [' + socket.id + '] declined because of invalid nodeType');
      socket.disconnect()
      return
    }

    // success, we have a valid socket connection
    console.log('socket [' + socket.id + '] registered for metrics about [' + query.nodeType + '] nodes')

    // add it to the Map
    openSockets.get(query.nodeType).push(socket)


    // and now send the first burst of data to the client to render the diagram
    socket.emit('cpu-usage', cpuMetrics.get(query.nodeType))


    socket.on('disconnect', function() {
        let i = openSockets.get(query.nodeType).indexOf(socket);
        openSockets.get(query.nodeType).splice(i, 1);
        console.log('socket [' + socket.id + '] has disconnected!');
     });
  })
};

const isValidNodeType = (t) => {
  return t === 'geoffrey' || t === 'carlton' || t === 'will' || t === 'jazz'
}

const sendCpuMetricsRecursively = function() {
  openSockets.forEach((sockets, key) => {
      sockets.forEach((s) => {
        s.emit('cpu-usage', cpuMetrics.get(key))
      })
  })

  // repeat this funciton over and over every 30 s
  setTimeout(sendCpuMetricsRecursively, 30 * 1000)
}

const updateCpuMetricsRecursively = function() {

  function oneHourAgo() {
    var d = new Date();
    return d.setHours(d.getHours() - 1);
  }

  const startTime = oneHourAgo()
  const endTime = new Date()

  monitoring.getCpuUsageTimeseries(startTime, endTime, function(err, newMetrics) {
    if (err) console.log(err)
    else {

      cpuMetrics.forEach((oldMetrics, key) => {
        // filter all "geoffrey" or "carlton" or .... nodes
        const filtered = monitoring.filter(newMetrics, key)
        // compute average cpu load
        const withAverage = monitoring.addAvg(filtered, startTime)
        // update the map entry
        cpuMetrics.set(key, withAverage)
      })
    }

    // repeat this function over and over every 60 s
    setTimeout(updateCpuMetricsRecursively, 60 * 1000)
  })
};

const sockethandler = {

  // this should only be called at startup
  init: function(server) {

    console.log("start listening for socket connections")

    io = io.listen(server);

    // waiting for incoming client socket connection requests
    handleConnections()
  },

  startFetchingCpuMetrics: updateCpuMetricsRecursively,

  startUpdatingClients: sendCpuMetricsRecursively
}

module.exports = sockethandler
