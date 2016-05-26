// trying to build a socket connection to the server
socket = io.connect('', {query: "nodeType=geoffrey"});

socket.on('connect', function() {
  console.log("socket connected");
});

// the socket will automatically try to reconnect
socket.on('disconnect', function() {
  console.log("socket is disconnected")
});


socket.on('cpu-usage', function(res) {
	console.log(res)
  Object.keys(res).forEach(function(key){

		if (key === 'avg') {
			renderAvg(res[key])
		} else {
			renderSingleNode(res[key], key)
		}
  })
})
