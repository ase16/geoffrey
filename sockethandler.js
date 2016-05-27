'use strict'

const monitoring = require('./monitoring.js');
const datastore = require('./datastore.js')
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

// batch size of the will node(s)
let batchSizeStats = []

// tweets/sec fetched by the jazz node(s)
let tweetsPerSecStats = []

const init = function(server) {

    console.log("start listening for socket connections")

    io = io.listen(server);

    // waiting for incoming client socket connection requests
    handleConnections()
}

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

    // and now send the first burst of cpu metrics data to the client to render the diagram
    socket.emit('cpu-usage', cpuMetrics.get(query.nodeType))

    // in case the client request data for the will node, send batch size stats
    if (query.nodeType == "will")
        socket.emit('batch-size-stats', batchSizeStats)

    // in case the client request data for the jazz node, send tweets/sec stats
    if (query.nodeType == "jazz")
        socket.emit('tweets-sec-stats', tweetsPerSecStats)


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

const sendToClientRecursively = function() {
  openSockets.forEach((sockets, key) => {
      sockets.forEach((s) => {
        s.emit('cpu-usage', cpuMetrics.get(key))
      })
  })

  openSockets.get('will').forEach((s) => {
      s.emit('batch-size-stats', batchSizeStats)
  })

  openSockets.get('jazz').forEach((s) => {
      s.emit('tweets-sec-stats', tweetsPerSecStats)
  })

  // repeat this funciton over and over every 30 s
  setTimeout(sendToClientRecursively, 30 * 1000)
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
        // add up empty empty minute-slots between the start and end date
        const filledUp = monitoring.fillEmptySlots(filtered, startTime, endTime, 5)
        // compute average cpu load
        const withAverage = monitoring.addAvg(filledUp, startTime)
        // update the map entry
        cpuMetrics.set(key, withAverage)
      })
    }

    // repeat this function over and over every 60 s
    setTimeout(updateCpuMetricsRecursively, 60 * 1000)
  })
};

const updateWillStatsRecursively = function() {
  datastore.getWillStats( (err, res) => {
    if (err) console.log(err)
    else {
      batchSizeStats = res;
    }
  })

  // repeat this function over and over every 60 s
  setTimeout(updateWillStatsRecursively, 60 * 1000)
}

const updateJazzStatsRecursively = function() {
    datastore.getJazzStats( (err, res) => {
      if (err) console.log(err)
      else {
        tweetsPerSecStats = res;
      }
    })

    // repeat this function over and over every 60 s
    setTimeout(updateJazzStatsRecursively, 60 * 1000)
}

const sockethandler = {

  init: init,
  startFetchingCpuMetrics: updateCpuMetricsRecursively,
  startFetchingJazzStats: updateJazzStatsRecursively,
  startFetchingWillStats: updateWillStatsRecursively,
  startUpdatingClients: sendToClientRecursively
}

module.exports = sockethandler
