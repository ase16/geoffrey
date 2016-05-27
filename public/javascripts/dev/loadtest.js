(function() {
	"use strict";

	var REQUEST_INTERVAL = 0.5;

	var loadtest;
	var loadtestStartButton = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored loadtestStartButton" name="loadtestStart">Start Loadtest</button>';
	var loadtestStopButton = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored loadtestStopButton" name="loadtestStart">Stop Loadtest</button>';

	function startLoadtest() {
		$('button.loadtestStartButton').hide();
		$('button.loadtestStopButton').show();
		loadtest = setInterval(loadtestRequest, REQUEST_INTERVAL * 1000);
	}

	function loadtestRequest() {
		$.ajax({
			url: loadtestPath,
			type: 'get',
			dataType: 'json',
			cache: false,
			success: function( res ) {
				console.log('LOADTEST = ', res);
			},
			error: function( xhr, status, errorThrown ) {
				console.log('AJAX ERROR: xhr = ', xhr);
				console.log('AJAX ERROR: status = ', status);
				console.log('AJAX ERROR: errorThrown = ', errorThrown);
			}
		});
	}

	function stopLoadtest() {
		$('button.loadtestStopButton').hide();
		$('button.loadtestStartButton').show();
		clearInterval(loadtest);
	}

	$(document).ready(function() {
		$('#loadtest').append(loadtestStartButton);
		$('#loadtest').append(loadtestStopButton);
		$('button.loadtestStartButton').on('click', startLoadtest);
		$('button.loadtestStopButton').on('click', stopLoadtest);
	});
}());