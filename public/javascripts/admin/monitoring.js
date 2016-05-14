// String.prototype.startsWith polyfill for older browsers
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}




var socket = io.connect('');

socket.on('connect', function(socket){
  console.log("socket connected");
});

socket.on('cpu-usage', function(res) {

	Object.keys(res).forEach(function(key){
		render(res[key], key)
	})
})



var render = function(data, instanceName) {

	var $graph = getOrCreateGraphWrapper(instanceName);

	var w = 400
	var h = 300
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

};

// returns a graph wrapper to append an svg to
// this function also appends the graph wrapper to the according instance-group
// wrapper (based on the instance-name)
var getOrCreateGraphWrapper = function(instanceName) {

	// this local function appends a on-the-fly-created graph wrapper to
	// an instance-group wrapper (which might be created on-the-fly as well if not existents)
	var appendToGroup = function(groupName, label) {

		// the graph doesn't exist yet, so we have to render title, wrapper, svg from the ground up
		var $graph = $('<div class="graph" data-instance="' + instanceName + '">');
		$graph.append('<span>' + instanceName + '</span>')

		// check if the instance-group wrapper already exists
		if ($('#monitoring-wrapper').children('.' + groupName).length > 0) {
			$('#monitoring-wrapper .' + groupName).append($graph)
			return $graph;
		}

		// group wrapper does not exist yet
		// therefore we create a new one and append it to the monitoring wrapper
		var groupWrapper = $('<div class="' + groupName + '">')
			.append("<h3>" + label + "</h3>")
			.append($graph)

		$('#monitoring-wrapper').append(groupWrapper);

		return $graph
	}

	// if the graph of a gce instance already exists, remove it and
	var $graph = $('#monitoring-wrapper .graph[data-instance="' + instanceName + '"]')


	if ($graph.length > 0) {
		// a graph has already been rendered before, so we will re-render only the svg
		$graph.children('svg').remove()
		return $graph
	}

	// graph hasn't been rendered before

	if (instanceName.startsWith('geoffrey'))
		return appendToGroup('geoffrey', 'Geoffrey-Nodes: main nodes delivering the web interface')
	else if (instanceName.startsWith('carlton'))
		return appendToGroup('carlton', 'Carlton-Nodes: Terms management nodes')
	else if (instanceName.startsWith('will'))
		return appendToGroup('will', 'Will-Nodes: Twitter fetcher nodes listening to the streams')
	else if (instanceName.startsWith('jazz'))
		return appendToGroup('jazz', 'Jazz-Nodes: Worker nodes for the sentiment analysis')
}
