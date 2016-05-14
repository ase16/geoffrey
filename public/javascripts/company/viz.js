
// load the analyzed data
// $.ajax({
//     url: '/company/terms',
//     type: 'get',
//     dataType: 'json',
//     cache: false,
//     success: function( res ) {
// 		res.terms.forEach(function(t) {
// 			var elem = $('<div>').text(t).click(function() {
// 				$('#viz-wrapper').children().remove();
// 				$('#viz-wrapper').append('<span>loading...</span>');
// 				getData(t);
// 			});
// 			$('#terms-wrapper').append(elem);
// 		})
//     },
// 	error: function() {
// 		alert("something went wrong")
// 	}
// });

var terms = ['Batman', 'Superman', 'Obama']


terms.forEach(function(t) {
	var elem = $('<div>').text(t).click(function() {
		$('#viz-wrapper').children().remove();
		$('#viz-wrapper').append('<span>loading...</span>');
		getData(t);
	});
	$('#terms-wrapper').append(elem);
})

var getData = function(term) {
	console.log("get data for term", term);

		// data not yet loaded
		$.post('/company/viz/load-data', { 'term' : term },
			// callback function
			function(data) {

				render(data, term);
			}
		);
};


var render = function(data, term) {


	$('#viz-wrapper').children().remove();
	$('#viz-wrapper').append($('<h3>').text('Sentiment analysis for the term ' + term));


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
				.attr("height", h)


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

	// the bar chart
	svg.selectAll("rect")
		 .data(data)
		 .enter()
		 .append("rect")
	//	 .attr('transform', 'translate(20,0)')
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

};

//
// var render = function(data, term) {
// 	console.log("render accepted", data);
//
// 	$('#viz-wrapper').children().remove();
// 	$('#viz-wrapper').append($('<h2>').text('Sentiment analysis for the term ' + term));
//
// 	var w = 800
// 	var h = 400
// 	var margin = { top: 20, bottom: 20, left: 50, right: 5}
// 	var marginTop = 5
//
// 	var yScale = d3.scale.linear()
// 		 .domain([1, -1])
// 		 .range([margin.top, h - margin.top - margin.bottom]);
//
// 	 // get max and min dates - this assumes data is sorted
// 	 var minDate = new Date(data[data.length-1].tweet.created_at),
// 	     maxDate = new Date(data[0].tweet.created_at);
//
// 	var xScale = d3.time.scale()
// 			.domain([minDate, maxDate])
// 			.range([margin.left, w -margin.right]);
//
// 	var xAxis = d3.svg.axis()
// 	    .scale(xScale)
// 	    .orient("bottom");
//
// 	var yAxis = d3.svg.axis()
// 	    .scale(yScale)
// 	    .orient("left");
//
// 	var xAxis = d3.svg.axis()
// 	    .scale(xScale)
// 	    .orient('bottom')
// 	    // .ticks(d3.time.days, 1)
// 	    // .tickFormat(d3.time.format('%a %d'))
// 	    // .tickSize(0)
// 	    .tickPadding(8);
//
// 	var yAxis = d3.svg.axis()
// 	    .scale(yScale)
// 	    .orient('left')
// 	    .tickPadding(8);
//
// 	var div = d3.select("body").append("div")
//     .attr("class", "tooltip")
//     .style("opacity", 0);
//
// 	//Create SVG element
// 	var svg = d3.select("#viz-wrapper")
// 				.append("svg")
// 				.attr("width", w)
// 				.attr("height", h)
//
// 	svg.selectAll("circle")
// 		 .data(data)
// 		 .enter()
// 		 .append("circle")
// 		 .attr("cx", function(d) {
// 			 return xScale(new Date(d.tweet.created_at))
// 		 })
// 		 .attr("cy", function(d) {
// 			  return yScale(d.comparative)
// 		 })
// 		 .attr("r", function(d) {
// 				return 5;
// 		 })
// 		 .on("mouseover", function(d) {
//         div.transition()
//         	.duration(200)
//           .style("opacity", .9);
//
// 					div.html(d.tweet.created_at + "<br/>"  + d.tweet.text)
//           	.style("left", (d3.event.pageX + 10) + "px")
//           	.style("top", (d3.event.pageY - 28) + "px");
//             })
//         .on("mouseout", function(d) {
//             div.transition()
//                 .duration(500)
//                 .style("opacity", 0);
//         });
//
// 	 svg.append('g')
// 	     .attr('class', 'x axis')
// 	     .attr('transform', 'translate(0, ' + (h - margin.top - margin.bottom) + ')')
// 	     .call(xAxis);
//
// 	 svg.append('g')
// 	   .attr('class', 'y axis')
// 		 .attr('transform', 'translate(' +  margin.left + ',0)')
// 	   .call(yAxis);
//
// };
