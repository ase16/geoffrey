var socket = io.connect('');

socket.on('connect', function(socket){
  console.log("socket connected");
});

socket.on('fetcher-log', function(msg){
  $('#log-wrapper').append('<li class="mdl-list__item"><span class="mdl-list__item-primary-content">' + msg + '</span></li>');
});
