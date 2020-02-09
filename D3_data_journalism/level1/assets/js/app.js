// Define SVG area dimensions
var svgWidth = 960;
var svgHeight = 660;

// Define the chart's margins as an object
var chartMargin = {
    top: 30,
    right: 30,
    bottom: 60,
    left: 60
};

// Define dimensions of the chart area
var chartWidth = svgWidth - chartMargin.left - chartMargin.right;
var chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;

// Select body, append SVG area to it, and set the dimensions
var svg = d3
    .select("#scatter")
    .append("svg")
        .attr("height", svgHeight)
        .attr("width", svgWidth)
        .call(responsivefy); //from responsivefy.js

// Append a group to the SVG area and shift ('translate') it to the right and down to adhere
// to the margins set in the "chartMargin" object.
var chartGroup = svg.append("g")
    .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

// Load data from data.csv
d3.csv("assets/data/data.csv").then(function(data) {

  // Print dataset to console
    console.log(data);

    // Get min and max values for each of the x and y scales
    // offset a bit to not clip off any data points
    var xMin = d3.min(data, d => +d.poverty * 0.9);
    var xMax = d3.max(data, d => +d.poverty * 1.1);
    var yMin = d3.min(data, d => +d.healthcare * 0.6);
    var yMax = d3.max(data, d => +d.healthcare * 1.1);

    //var xDomain = d3.extent(data, d => +d.poverty);
    //var yDomain = d3.extent(data, d => +d.healthcare);

    
    // create linear x and y scales based on x/y-min/max and chart-width/height
    var xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, chartWidth]);
    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([chartHeight, 0]);

    // create axes
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    // set x to the bottom of the chart
    chartGroup.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(xAxis);

    // append xAxis text/label
    chartGroup.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + chartMargin.top + 20})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text("In Poverty (%)");

    // set y to the left, no translation needed
    // This syntax allows us to call the axis function
    // and pass in the selector without breaking the chaining
    chartGroup.append("g")
        .call(yAxis);

    // append yAxis text/label
    chartGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (chartHeight / 2))
        .attr("y", 0 - chartMargin.left)
        .attr("dy", "1.5em")
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text("Lacks Healthcare (%)");

    // append circles for scatter plot
    chartGroup.append("g")
        .selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(+d.poverty))
        .attr("cy", d => yScale(+d.healthcare))
        .attr("r", 11)
        .attr("fill", "#6CA2CC")
        .attr("stroke-width", 1.2)
        .attr("stroke", "steelblue")
        .style("opacity", "0.8");

    // append text on top of circles with state abbreviations
    chartGroup.append('g')
        .selectAll('text')
        .data(data)
        .enter().append('text')
        .attr("x", d => xScale(+d.poverty))
        .attr("y", d => yScale(+d.healthcare))
        .attr("text-anchor", "middle")
        .attr('font-size', 9)
        .attr('fill', "white")
        .attr("dy", "0.35em")
        .attr("font-weight", "bold")
        .text(d => d.abbr);

}).catch(function(error) {
    console.log(error);
});
