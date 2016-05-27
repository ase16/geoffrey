(function() {
	"use strict";

	// We first define our html building blocks that are used in our vms management screen
	var vmsHTML = '<div class="vms"></div>';
/*
	var resizeVMFormHTML = '<form class="resizeVM"></form>';
	var resizeVMInputHTML = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input resizeVM" name="newSizeOfInstanceGroup" type="text" id="resizeVM" /><label class="mdl-textfield__label" for="resizeVM">Enter integer to resize worker group</label>';
	var resizeVMButtonHTML = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored resizeVM" name="new" type="submit">Resize worker group</button>';
*/
	var vmsListHTML = '<ul class="vms"></ul>';
	var vmsListItemHTML = '<li class="vm"></li>';

	var displayVMFormHTML = '<form class="displayVM"></form>';
	var displayVMSpanHTML = '<span class="displayVM"></span>';
	var displayVMStateSpanHTML = '<span class="displayVMState"></span>';

	// Now we define the functions and event handlers that are used in our vms management screen
	function initVMs() {
		// With the html building blocks, we set up the initial term structure
		$('#vms').append(
			$(vmsHTML).append(
				/*$(resizeVMFormHTML).append(
					resizeVMInputHTML,
					resizeVMButtonHTML
				),*/
				vmsListHTML
			)
		);

		// Add event handler for the resize button
		/*$('form.resizeVM').on('submit', resizeVMs);*/
	}

	function drawVMs(vms, callback) {

		var isResizing = false;
		var $newList = $(vmsListHTML);
		if (vms !== undefined) {
			// First collect the terms in a new list
			for(var i = 0; i < vms.length; i++) {
				var vm = vms[i];
				var vmOptimisticUI = '';
				var vmInstanceStatus = (vm.hasOwnProperty('instanceStatus') ? vm.instanceStatus : vm.currentAction);
				// console.log('VM status is = ', vmInstanceStatus);
				if (vmInstanceStatus !== 'RUNNING') {
					isResizing = true;
					// console.log('Still resizing = ', isResizing);
					vmOptimisticUI = 'vmOptimisticUI';
				}
				$newList.append(
					$(vmsListItemHTML).append(
						$(displayVMFormHTML).append(
							$(displayVMSpanHTML).text(vm.name),
							$(displayVMStateSpanHTML).addClass(vmOptimisticUI).text("[" + vmInstanceStatus + "]")
						)
					)
				);
			}
		}

		// Replace the optimistic list with the new one
		$('ul.vms').replaceWith($newList);

		return callback(null, isResizing);
	}

	function readVMs(callback) {
		var req = {
			url: '/admin/vms',
			data: {
				instanceGroupZone: instanceGroupZone,
				instanceGroupName: instanceGroupName
			},
			type: 'get',
			dataType: 'json',
			cache: false,
			success: function(res) {
				console.log('GET /admin/vms response from server is = ', res);
				if ( res.hasOwnProperty('err') ) {
				}
				else if( res.hasOwnProperty('vms') ) {
					drawVMs(res.vms, callback);
				}
				else {
					drawVMs(undefined, callback);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log('ERROR', errorThrown);
			}
		};

		$.ajax(req);
	}
/*
	function resizeVMs(event) {
		event.preventDefault();
		var formData = $(this).serializeObject();	// Get newly submitted term
		$('#resizeVM').val('');						// Manually clear input field

		var currentSize = $('ul.vms li').length;
		var newSize = formData.newSizeOfInstanceGroup;

		if (newSize < 0 || newSize > 6) {
			alert("Choose an integer between 0 and 6");
			return;
		}

		// Optimistic UI
		var $currentList = $('ul.vms');
		var sizeDifference = newSize - currentSize;
		if (sizeDifference > 0) {
			for(var i = 0; i < sizeDifference; i++) {
				$currentList.append(
					$(vmsListItemHTML).append(
						$(displayVMFormHTML).append(
							$(displayVMSpanHTML).text(instanceGroupName),
							$(displayVMStateSpanHTML).addClass('vmOptimisticUI').text("[PROVISIONING]")
						)
					)
				);
			}
		}
		else if (sizeDifference < 0) {
			$currentList.find('li').slice(0, Math.abs(sizeDifference)).find('.displayVMState').addClass('vmOptimisticUI').text("[STOPPING]");
		}

		var req = {
			url: '/admin/vms',
			type: 'post',
			data: formData,
			dataType: 'json',
			cache: false,
			success: function( res ) {
				if ( res.hasOwnProperty('err') ) {
					$currentList.remove('li.vmOptimisticUI');		// In case the server responds with an error, revert Optimistic UI
				}
				else if( res ) {
					console.log('Server responds with = ', res);
					console.log('Setting timeout for monitorResizingOfVMs');
					setTimeout(monitorResizingOfVMs, 2000);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log( "Error: " + errorThrown );
			}
		};

		$.ajax(req);
	}
*/
	function readVMsCallback(err, isRsizing) {
		if (!err) {
			if (isRsizing) {
				console.log("monitorResizingOfVMs, currently instance group is resizing, refresh in 2 secs");
				setTimeout(monitorResizingOfVMs, 2000);
			}
			else {
				console.log("monitorResizingOfVMs, currently instance group is not resizing, therefore make next refresh only in 10 secs");
				setTimeout(monitorResizingOfVMs, 10000);
			}
		}
		else {
			console.log("Monitor ==> err of readVMs = ", err);
		}
	}

	function monitorResizingOfVMs() {
		readVMs(readVMsCallback);
	}

	$(document).ready(function() {
		initVMs();
		readVMs(readVMsCallback);
	});
}());