var date = new Date()
var term;

var DateInputFields = (function($) {


	var init = function() {
		var dateSelected = $('<span class="date-selected">')
		var next = $('<span class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored">').html('<i class="material-icons">add</i>').on('click',nextDay)
		var prev = $('<span class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored">').html('<i class="material-icons">remove</i>').on('click', prevDay)

		$('#date-wrapper').hide()
			.append(prev)
			.append(dateSelected)
			.append(next)

		renderDate()
	}

	var renderDate = function() {
		$('.date-selected').text(date.toDateString())
	}

	var nextDay = function() {
		date.setDate(date.getDate() + 1)
		renderDate()
		if (term != "" && term != undefined) getData()
	}

	var prevDay = function() {
		date.setDate(date.getDate() - 1)
		renderDate()
		if (term != "" && term != undefined) getData()
	}

	var showDate = function() {
		$('#date-wrapper').show()
	}

	return {
		init: init,
		show: showDate
	}
}(jQuery))

DateInputFields.init()

function getTerms() {
	var req = {
		url: '/carlton/company/terms',
		type: 'get',
		dataType: 'json',
		cache: false,
		success: function(res) {

			if ( res.hasOwnProperty('err') ) {
				console.log(res.err)
				return;
			}

			res.terms.forEach(function(t) {

				var elem = $('<div>').addClass('mdl-tabs__tab').text(t).click(function() {
					term = t
					DateInputFields.show()
					$('.mdl-tabs__tab').removeClass('is-active')
					$(this).addClass('is-active')
					getData(t);
				})

				$('#terms-wrapper').append(elem);
			})

		},
		error: function( xhr, status, errorThrown ) {
			console.log('AJAX ERROR: xhr = ', xhr);
			console.log('AJAX ERROR: status = ', status);
			console.log('AJAX ERROR: errorThrown = ', errorThrown);
		}
	};

	$.ajax(req);
}

getTerms()

var getData = function() {
	console.log("get data for term", term);

	$('#viz-wrapper').children().remove();
	$('#viz-wrapper').append('<span>loading data...</span>');

	var input = { 'term' : term, 'startDay': date, 'endDay':	date }

		// data not yet loaded
		$.post('/company/viz/load-data', input,
			// callback function
			function(data) {
				if (data.hasOwnProperty('err')) {
					alert("an error occurred")
					console.log(data.err)
					return;
				}
				console.log(data);
				render(data, term);
			}
		)
};


var render = function(data, term) {

	$('#viz-wrapper').children().remove();

	if (data.length == 0) {
		$('#viz-wrapper').append('<span>No data exists for this day and term</span>');
		return;
	}


	var w = 800
	var h = 300
	var margin = { top: 10, bottom: 30, left: 20, right: 20}


	 // get max and min dates - this assumes data is sorted
	var minDate = new Date(data[0].date)
	var maxDate = new Date(data[data.length-1].date);

	var xLineScale = d3.time.scale.utc()
			.domain([minDate, maxDate])
			.range([margin.left, w - margin.right]);

	var yLineScale = d3.scale.linear()
		 .domain([1, -1])
		 .range([margin.top, h - margin.top - margin.bottom]);


	var maxTweets = d3.max(data, function(d) { return d.numTweets})

	console.log("maxt", maxTweets)

	var yRectScale = d3.scale.linear()
	  .domain([0, maxTweets])
    .range([margin.top - 10, h - margin.top - margin.bottom - 10]);


	// var xLineScale = d3.time.scale.utc()
	// 		.domain([minDate, maxDate])
	// 		.range([margin.left, w - margin.right]);

	var yAxis = d3.svg.axis()
	    .scale(yLineScale)
	    .orient("left")
			.tickFormat(d3.format("d"))
			.tickSize((w - margin.left - margin.right) * -1	)
    	.outerTickSize(0)

	var xAxis = d3.svg.axis()
	    .scale(xLineScale)
	    .orient('bottom')
	    .ticks(d3.time.hours, 3)
	    // .tickFormat(d3.time.format('%a %d'))
	    // .tickSize(0)
	    .tickPadding(8)
			.tickFormat(d3.time.format("%H"))


	//Create SVG element
	var svg = d3.select('#viz-wrapper')
				.append("svg")
				.attr("width", w)
				.attr("height", h);



	// the bar chart
	svg.selectAll("rect")
		 .data(data)
		 .enter()
		 .append("rect")
		 .attr("x", function(d, i) {
				return (i * ((w - margin.left - margin.right) / data.length)) + margin.left;
		 })
		 .attr('data', function(d, i) { return i + ' ' + new Date(d.date) + ' ' + d.numTweets + ' ' + d.aggrSentiment})
		 .attr("y", function(d) {
				return (h - yRectScale(d.numTweets)) - margin.top - margin.bottom;
		 })
		 .attr("width", (w - margin.left - margin.right) / data.length)
		 .attr("height", function(d) {
				return yRectScale(d.numTweets)
		 });


		 // bar chart labels
		 svg.selectAll("text.label")
	 		 .data(data)
	 		 .enter()
	 		 .append("text")
	 		 .text(function(d) {
				  if (d.numTweets == 0) return ""
	 			  return d.numTweets;
	 		 })
	 		 .attr("font-family", "sans-serif")
	 		 .attr("font-size", "12px")
	 		 .attr("fill", "white")
			 .attr("transform", "rotate(90)")
			 .attr("transform", function(d,i) {
				 var x = ((i * ((w - margin.left - margin.right) / data.length)) + margin.left) + 13
				 var y = ((h - yRectScale(d.numTweets)) - margin.top - margin.bottom) + 10
				 return "translate(" + x + "," + y +  ") rotate(90)"
			 })


	// function passed as arg a few loc's below
	var line = d3.svg.line()
	    .x(function(d) {
				return xLineScale(new Date(d.date));
			})
	    .y(function(d) {
				return yLineScale(d.aggrSentiment); });

	// the line diagram
	svg.append("path")
			.datum(data)
			.attr("class", "line")
			.attr('transform', 'translate(0,0)')
			.attr("d", line(data));




	// x axis
	svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + (h - margin.top - margin.bottom) + ')')
			.call(xAxis);

	// y axis
	svg.append("g")
			.attr("class", "y axis")
			.attr('transform', 'translate(' +  margin.left + ',0)')
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Sentiment");

};
