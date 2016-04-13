var socket = io.connect('');

socket.on('connect', function(socket){
  console.log("socket connected");
});

socket.on('fetcher-log', function(msg){
  $('#log-wrapper').append('<span>' + msg + '</span>').append("<br>");
});
