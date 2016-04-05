// load the analyzed data
$.post('/viz/tweets', {'term' : 'clinton'}, function(data) { visualize(data)})

var visualize = function(data) {
	console.log(data);

	var w = 800
	var h = 400
	var margin = { top: 20, bottom: 20, left: 50, right: 5}
	var marginTop = 5

	var yScale = d3.scale.linear()
		 .domain([-1, 1])
		 .range([margin.top, h - margin.top - margin.bottom]);

	 // get max and min dates - this assumes data is sorted
	 var minDate = new Date(data[data.length-1].tweet.created_at),
	     maxDate = new Date(data[0].tweet.created_at);

	var xScale = d3.time.scale()
			.domain([minDate, maxDate])
			.range([margin.left, w -margin.right]);

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left");

	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient('bottom')
	    // .ticks(d3.time.days, 1)
	    // .tickFormat(d3.time.format('%a %d'))
	    // .tickSize(0)
	    .tickPadding(8);

	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient('left')
	    .tickPadding(8);

	var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

	//Create SVG element
	var svg = d3.select("body")
				.append("svg")
				.attr("width", w)
				.attr("height", h)

	svg.selectAll("circle")
		 .data(data)
		 .enter()
		 .append("circle")
		 .attr("cx", function(d) {
			 return xScale(new Date(d.tweet.created_at))
		 })
		 .attr("cy", function(d) {
			  return yScale(d.comparative)
		 })
		 .attr("r", function(d) {
				return 5;
		 })
		 .on("mouseover", function(d) {
        div.transition()
        	.duration(200)
          .style("opacity", .9);

					div.html(d.tweet.created_at + "<br/>"  + d.words)
          	.style("left", (d3.event.pageX + 10) + "px")
          	.style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

	// svg.selectAll("text")
	//    .data(data)
	//    .enter()
	//    .append("text")
	//    .text(function(d) {
	// 		 	return Math.round(d.comparative * 100) / 100
	//    })
	//    .attr("x", function(d, i) {
	//    		return xScale(new Date(d.tweet.created_at))
	//    })
	//    .attr("y", function(d) {
	//    		return yScale(d.comparative);
	//    })
	//    .attr("font-family", "sans-serif")
	//    .attr("font-size", "13px")
	//    .attr("fill", "black")

	 svg.append('g')
	     .attr('class', 'x axis')
	     .attr('transform', 'translate(0, ' + (h - margin.top - margin.bottom) + ')')
	     .call(xAxis);

	 svg.append('g')
	   .attr('class', 'y axis')
		 .attr('transform', 'translate(' +  margin.left + ',0)')
	   .call(yAxis);

}
