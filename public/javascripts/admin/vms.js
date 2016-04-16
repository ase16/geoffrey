(function() {
	"use strict";

	// We first define our html building blocks that are used in our vms management screen
	var vmsHTML = '<div class="vms"></div>';

	var newVMFormHTML = '<form class="newVM"></form>';
	var newVMInputHTML = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input newVM" name="vm" type="text" id="newVM" /><label class="mdl-textfield__label" for="newVM">Place name of new vm here</label>';
	var newVMButtonHTML = '<button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored newVM" name="new" type="submit">Add New VM</button>';

	var vmsListHTML = '<ul class="vms"></ul>';
	var vmsListItemHTML = '<li class="vm"></li>';

	var displayVMFormHTML = '<form class="displayVM"></form>';
	var displayVMSpanHTML = '<span class="displayVM"></span>';
	var displayVMInputHTML = '<input name="vm" type="hidden" />';
	var displayVMDeleteButtonHTML = '<button class="mdl-button mdl-button--icon deleteVM" name="delete"><i class="material-icons">clear</i></button>';
	// var displayVMDisabledDeleteButtonHTML = '<button class="mdl-button mdl-button--icon deleteVM" name="delete" disable="disable"><i class="material-icons">clear</i></button>';

	// Now we define the functions and event handlers that are used in our vms management screen
	function initVMs() {
		// With the html building blocks, we set up the initial term structure
		$('#vms').append(
			$(vmsHTML).append(
				$(newVMFormHTML).append(
					newVMInputHTML,
					newVMButtonHTML
				),
				vmsListHTML
			)
		);

		// Add event handler for the add term button
		// $('form.newTerm').on('submit', createTerm);
	}

	function drawVMs(vms) {
		// First collect the terms in a new list
		var $newList = $(vmsListHTML);
		for(var i = 0; i < vms.length; i++) {
			var vm = vms[i];
			var vmDisplayContent = vm.name + " [" + vm.status + "]";
			$newList.append(
				$(vmsListItemHTML).append(
					$(displayVMFormHTML).append(
						$(displayVMSpanHTML).text(vmDisplayContent),
						$(displayVMInputHTML).val(vm.name),
						$(displayVMDeleteButtonHTML)
					)
				)
			);
		}

		// Replace the optimistic list with the new one
		$('ul.vms').replaceWith($newList);

		// Add event handlers
		// $('form.displayVM').on('submit', deleteVM);
	}

	function readVMs() {
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
					drawVMs(res.vms);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log('ERROR', errorThrown);
			}
		};

		$.ajax(req);
	}

	$(document).ready(function() {
		initVMs();
		readVMs();
	});
}());