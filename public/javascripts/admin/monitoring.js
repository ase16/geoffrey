var socket = io.connect('');

socket.on('connect', function(socket){
  console.log("socket connected");
});

socket.on('cpu-usage', function(msg) {
  console.log(msg)

	render(msg)
  //$('#log-wrapper').append('<li class="mdl-list__item"><span class="mdl-list__item-primary-content">' + msg + '</span></li>');
});



var render = function(data) {

	var $graph = $('<div class="graph">');

	$graph.append('<span>Node: Geoffrey</span>')

	$('#monitoring-wrapper').append($graph)

	var w = 500
	var h = 400
	var margin = { top: 0, bottom: 30, left: 20, right: 0}

	var doubleValue = function (d) { return d.value.doubleValue }
	var minCPU = d3.min(data, doubleValue)
	var maxCPU = d3.max(data, doubleValue)

	var yScale = d3.scale.linear()
		 .domain([maxCPU + 3, 0])
		 .range([margin.top, h - margin.top - margin.bottom]);

	 // get max and min dates - this assumes data is sorted
	var minDate = new Date(data[0].interval.startTime)
	var maxDate = new Date(data[data.length-1].interval.endTime);

	var xScale = d3.time.scale()
			.domain([maxDate, minDate])
			.range([margin.left, w - margin.right]);


	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left")
			.tickFormat(d3.format("d"))
			.innerTickSize(-w)
    	.outerTickSize(0)

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient('bottom')
	    .ticks(d3.time.minutes, 15)
	    // .tickFormat(d3.time.format('%a %d'))
	    // .tickSize(0)
	    .tickPadding(8)
			.tickFormat(d3.time.format("%H:%M"))


	//Create SVG element
	var svg = d3.select($graph[0])
				.append("svg")
				.attr("width", w)
				.attr("height", h)

	var line = d3.svg.line()
	    .x(function(d) { console.log(d.interval.startTime);
				return xScale(new Date(d.interval.startTime));
			})
	    .y(function(d) { console.log(d.value.doubleValue)
				return yScale(d.value.doubleValue); });

	// the line diagram
	svg.append("path")
			.datum(data)
			.attr("class", "line")
			.attr('transform', 'translate(10,0)')
			.attr("d", line(data));

	// x axis
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, ' + (h - margin.top - margin.bottom) + ')')
      .call(xAxis);

	svg.append("g")
      .attr("class", "y axis")
			.attr('transform', 'translate(' +  margin.left + ',0)')
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("CPU (%)");

};








// function render() {
//   // var margin = {top: 20, right: 20, bottom: 30, left: 50},
//   //   width = 960 - margin.left - margin.right,
//   //   height = 500 - margin.top - margin.bottom;
//
//   var formatDate = d3.time.format("%d-%b-%y");
//
//   var x = d3.time.scale()
//       .range([0, width]);
//
//   var y = d3.scale.linear()
//       .range([height, 0]);
//
//   var xAxis = d3.svg.axis()
//       .scale(x)
//       .orient("bottom");
//
//   var yAxis = d3.svg.axis()
//       .scale(y)
//       .orient("left");
//
//   var line = d3.svg.line()
//       .x(function(d) { return x(d.date); })
//       .y(function(d) { return y(d.close); });
//
//   var svg = d3.select("body").append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//   d3.tsv("data.tsv", type, function(error, data) {
//     if (error) throw error;
//
//     x.domain(d3.extent(data, function(d) { return d.date; }));
//     y.domain(d3.extent(data, function(d) { return d.close; }));
//
//     svg.append("g")
//         .attr("class", "x axis")
//         .attr("transform", "translate(0," + height + ")")
//         .call(xAxis);
//
//     svg.append("g")
//         .attr("class", "y axis")
//         .call(yAxis)
//       .append("text")
//         .attr("transform", "rotate(-90)")
//         .attr("y", 6)
//         .attr("dy", ".71em")
//         .style("text-anchor", "end")
//         .text("Price ($)");
//
//     svg.append("path")
//         .datum(data)
//         .attr("class", "line")
//         .attr("d", line);
//   });
//
//   function type(d) {
//     d.date = formatDate.parse(d.date);
//     d.close = +d.close;
//     return d;
//   }
// }
