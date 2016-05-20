
var renderSingleNode = function(data, instanceName, isAverageData) {

	// if the graph of a gce instance already exists, remove it and
	var $graph = $('#nodes-wrapper .graph[data-instance="' + instanceName + '"]')


	if ($graph.length > 0) {
		// a graph has already been rendered before, so we will re-render only the svg
		$graph.children('svg').remove()

	} else {
		$graph = $('<div class="graph small" data-instance="' + instanceName + '">');
		$graph.append('<span>' + instanceName + '</span>')
	}

	var w = 220
	var h = 150
	var margin = { top: 10, bottom: 30, left: 15, right: 5}

	var yScale = d3.scale.linear()
		 .domain([100, 0])
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
			.tickValues([25, 50, 75])
			.innerTickSize(- w)
    	//.outerTickSize(9)

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient('bottom')
	    .ticks(d3.time.minutes, 15)
	    .tickPadding(8)
			.tickFormat(d3.time.format("%H:%M"))


	//Create SVG element
	var svg = d3.select($graph[0])
				.append("svg")
				.attr("width", w)
				.attr("height", h)

	// x axis
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, ' + (h - margin.top - margin.bottom) + ')')
      .call(xAxis);

	// y axis with label
	svg.append("g")
      .attr("class", "y axis")
			.attr('transform', 'translate(' +  margin.left + ',0)')
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
			.attr("x", -6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("CPU (%)");

	// function that gets passed to render
	var line = d3.svg.line()
			.x(function(d) {
				return xScale(new Date(d.interval.startTime));
			})
			.y(function(d) {
				return yScale(d.value.doubleValue); });

	// the line diagram
	svg.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("d", line(data));


	// this triggers the browser to render
	$('#nodes-wrapper').append($graph);
};


var renderAvg = function(data, instanceName) {

	// if the graph of a gce instance already exists, remove it and
	var $graph = $('#avg-wrapper .graph')


	if ($graph.length > 0) {
		// a graph has already been rendered before, so we will re-render only the svg
		$graph.children('svg').remove()

	} else {
		$graph = $('<div class="graph">');
		$graph.append('<span>Average CPU Usage</span>')
	}

	var w = 400
	var h = 300
	var margin = { top: 10, bottom: 30, left: 25, right: 0}

	var yScale = d3.scale.linear()
		 .domain([100, 0])
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
	    .x(function(d) {
				return xScale(new Date(d.interval.startTime));
			})
	    .y(function(d) {
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

	// this triggers the browser to render
	$('#avg-wrapper').append($graph);

};
