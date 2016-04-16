(function() {
	"use strict";

	var instanceGroupName = "worker-nodes";

	// We first define our html building blocks that are used in our vms management screen
	var vmsHTML = '<div class="vms"></div>';

	// var newVMFormHTML = '<form class="newVM"></form>';
	// var newVMInputHTML = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input newVM" name="vm" type="text" id="newVM" /><label class="mdl-textfield__label" for="newVM">Place name of new vm here</label>';
	// var newVMButtonHTML = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored newVM" name="new" type="submit">Add New VM</button>';

	var resizeVMFormHTML = '<form class="resizeVM"></form>';
	var resizeVMInputHTML = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input resizeVM" name="newSizeOfInstanceGroup" type="text" id="resizeVM" /><label class="mdl-textfield__label" for="resizeVM">Enter integer to resize worker group</label>';
	var resizeVMButtonHTML = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored resizeVM" name="new" type="submit">Resize worker group</button>';

	var vmsListHTML = '<ul class="vms"></ul>';
	var vmsListItemHTML = '<li class="vm"></li>';

	var displayVMFormHTML = '<form class="displayVM"></form>';
	var displayVMSpanHTML = '<span class="displayVM"></span>';
	var displayVMStateSpanHTML = '<span class="displayVMState"></span>';
	var displayVMInputHTML = '<input name="vm" type="hidden" />';
	// var displayVMDeleteButtonHTML = '<button class="mdl-button mdl-button--icon deleteVM" name="delete"><i class="material-icons">clear</i></button>';
	// var displayVMDisabledDeleteButtonHTML = '<button class="mdl-button mdl-button--icon deleteVM" name="delete" disable="disable"><i class="material-icons">clear</i></button>';

	// Now we define the functions and event handlers that are used in our vms management screen
	function initVMs() {
		// With the html building blocks, we set up the initial term structure
		$('#vms').append(
			$(vmsHTML).append(
				$(resizeVMFormHTML).append(
					resizeVMInputHTML,
					resizeVMButtonHTML
				),
				vmsListHTML
			)
		);

		// Add event handler for the resize button
		$('form.resizeVM').on('submit', resizeVMs);
	}

	function drawVMs(vms, callback) {
		// First collect the terms in a new list
		var $newList = $(vmsListHTML);
		var isResizing = false;
		for(var i = 0; i < vms.length; i++) {
			var vm = vms[i];
			var vmOptimisticUI = '';
			console.log('VM status is = ', vm.status);
			if (vm.status !== 'RUNNING') {
				isResizing = true;
				console.log('Still resizing = ', isResizing);
				vmOptimisticUI = 'vmOptimisticUI';
			}
			$newList.append(
				$(vmsListItemHTML).append(
					$(displayVMFormHTML).append(
						$(displayVMSpanHTML).text(vm.name),
						$(displayVMStateSpanHTML).addClass(vmOptimisticUI).text("[" + vm.status + "]")
					)
				)
			);
		}

		// Replace the optimistic list with the new one
		$('ul.vms').replaceWith($newList);

		if (callback !== undefined) {
			console.log("Callback is defined");
			return callback(null, isResizing);
		}
		else {
			console.log("Callback is undefined");
		}
	}

	function readVMs(callback) {
		var req = {
			url: '/admin/vms',
			type: 'get',
			dataType: 'json',
			cache: false,
			success: function(res) {
				console.log('The response from the server is = ', res);
				if ( res.hasOwnProperty('err') ) {
				}
				else if( res.hasOwnProperty('vms') ) {
					drawVMs(res.vms, callback);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log('ERROR', errorThrown);
			}
		};

		$.ajax(req);
	}

	function resizeVMs(event) {
		event.preventDefault();
		var formData = $(this).serializeObject();	// Get newly submitted term
		$('#resizeVM').val('');						// Manually clear input field

		var currentSize = $('ul.vms li').length;
		var newSize = formData.newSizeOfInstanceGroup;

		if (newSize < 0 || newSize > 8) {
			alert("Choose an integer between 0 and 8");
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

	function monitorResizingOfVMs() {
		console.log("Monitor ==> readVMs");
		readVMs(function(err, isRsizing) {
			if (!err) {
				console.log("Monitor ==> isRsizing of readVMs", isRsizing);
				if (isRsizing) {
					console.log("Monitor ==> Call myself again");
					setTimeout(monitorResizingOfVMs, 1000);
				}
				else {
					console.log("Monitor ==> Finished resizing");
				}
			}
			else {
				console.log("Monitor ==> err of readVMs = ", err);
			}
		});
	}

	$(document).ready(function() {
		initVMs();
		readVMs();
	});
}());