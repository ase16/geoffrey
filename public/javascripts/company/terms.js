(function() {
	"use strict";

	// We first define our html building blocks that are used in our terms management screen
	var termsHTML = '<div class="terms"></div>';

	var newTermFormHTML = '<form class="newTerm"></form>';
	var newTermInputHTML = '<input class="newTerm" name="term" type="text" placeholder="Place new term here" />';
	var newTermButtonHTML = '<button class="newTerm" name="new" type="submit">Add New Term</button>';

	var termsListHTML = '<ul class="terms"></ul>';
	var termsListItemHTML = '<li class="term"></li>';

	var displayTermFormHTML = '<form class="displayTerm"></form>';
	var displayTermSpanHTML = '<span class="displayTerm"></span>';
	var displayTermInputHTML = '<input name="term" type="hidden" />';
	var displayTermDeleteButtonHTML = '<button class="displayTermDelete" name="delete">Delete</button>';
	var displayTermDisabledDeleteButtonHTML = '<button class="displayTermDelete" name="delete" disable="disable">Delete</button>';

	// ToDo: Use this html building blocks to enable editing of terms
	// var displayTermEditButtonHTML = '<button class="displayTermEdit" name="edit">Edit</button>';
	// var modifyTermFormHTML = '<div class="modifyTerm"></div>';
	// var modifyTermSpanHTML = '<span class="modifyTerm"></span>';
	// var modifyTermInputHTML = '<input name="term" type="hidden" />';
	// var modifyTermSaveButtonHTML = '<button class="modifyTermSave" name="save">Save</button>';
	// var modifyTermCancelButtonHTML = '<button class="modifyTermCancel" name="cancel">Cancel</button>';

	// Now we define the functions and event handlers that are used in our terms management screen
	function initTerms() {
		// With the html building blocks, we set up the initial term structure
		$('#terms').append(
			$(termsHTML).append(
				$(newTermFormHTML).append(
					newTermInputHTML,
					newTermButtonHTML
				),
				termsListHTML
			)
		);

		// Add event handler for the add term button
		$('form.newTerm').on('submit', createTerm);
	}

	function drawTerms(terms) {
		// First collect the terms in a new list
		var $newList = $(termsListHTML);
		for(var i = 0; i < terms.length; i++) {
			var term = terms[i];
			$newList.append(
				$(termsListItemHTML).append(
					$(displayTermFormHTML).append(
						$(displayTermSpanHTML).text(term),
						$(displayTermInputHTML).val(term),
						$(displayTermDeleteButtonHTML)
					)
				)
			);
		}

		// Replace the optimistic list with the new one
		$('ul.terms').replaceWith($newList);

		// Add event handlers
		$('form.displayTerm').on('submit', deleteTerm);
	}

	function readTerms() {
		var req = {
			url: '/company/terms',
			type: 'get',
			dataType: 'json',
			cache: false,
			success: function(res) {
				console.log('The response from the server is = ', res);
				if ( res.hasOwnProperty('err') ) {
				}
				else if( res.hasOwnProperty('terms') ) {
					drawTerms(res.terms);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log('ERROR', errorThrown);
			}
		};

		$.ajax(req);
	}

	function createTerm(event) {
		event.preventDefault();
		var formData = $(this).serializeObject();

		// Optimistic UI
		$('ul.terms').append(
			$(termsListItemHTML).append(
				$(displayTermFormHTML).append(
					$(displayTermSpanHTML).text(formData.term + ' (Optimistic UI)'),
					$(displayTermInputHTML).val(formData.term),
					$(displayTermDisabledDeleteButtonHTML)
				)
			)
		);
		$('form.displayTerm').on('submit', deleteTerm);

		var req = {
			url: '/company/terms',
			type: 'post',
			data: formData,
			dataType: 'json',
			cache: false,
			success: function( res ) {
				console.log('The response from the server is = ', res);
				if ( res.hasOwnProperty('err') ) {
				}
				else if( res.hasOwnProperty('terms') ) {
					drawTerms(res.terms);
				}
			},
			error: function( xhr, status, errorThrown ) {
				console.log( "Error: " + errorThrown );
			}
		};

		$.ajax(req);
	}

	function deleteTerm(event) {
		event.preventDefault();
		var formData = $(this).serializeObject();

		// Optimistic UI
		var $precedingTerm = $(this).parent().prev();
		var $term = $(this).parent().detach();								// --> https://api.jquery.com/detach/

		var req = {
			url: '/company/terms/' + formData.term,
			type: 'delete',
			data: formData,
			dataType: 'json',
			cache: false,
			success: function( res ) {
				console.log('The response from the server is = ', res);
				if ( res.err ) {
					if ($precedingTerm !== undefined) {
						$precedingTerm.after($term);						// --> http://api.jquery.com/after/
					}
					else {
						$('ul.terms').prepend($term);						// --> http://api.jquery.com/prepend/
					}
				}
				else {
					$term.remove();											// --> https://api.jquery.com/remove/
				}
			},
			error: function( xhr, status, errorThrown ) {
				if ($precedingTerm !== undefined) {
					$precedingTerm.after($term);
				}
				else {
					$('ul.terms').prepend($term);
				}
				console.log( "Error: " + errorThrown );
			}
		};

		$.ajax(req);
	}

	$(document).ready(function() {
		initTerms();
		readTerms();
	});
}());