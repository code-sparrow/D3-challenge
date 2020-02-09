// Define SVG area dimensions
var svgWidth = 960;
var svgHeight = 575;

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

//--------------------------------------------------------------------------
    // event listener for linear regression checkboc
    d3.selectAll(".checkbox")
        .on("change", function () {  
            if (this.checked) {
                linearReg(data);
            } else {
                chartGroup.selectAll("#regLine").remove();
                chartGroup.selectAll("#RText").remove();
            }
        });
    
    // linear regression on "data"
    function linearReg(data) {
        x_mean = d3.mean(data, d => +d.poverty);
        y_mean = d3.mean(data, d => +d.healthcare);
        console.log(data.length);

        // calculate coefficients
        var term1 = 0;
        var term2 = 0;
        var xr = 0;
        var yr = 0;
        for (i = 0; i < data.length; i++) {
            xr = +data[i].poverty - x_mean;
            yr = +data[i].healthcare - y_mean;
            term1 += xr * yr;
            term2 += xr * xr;
    
        }
        var b1 = term1 / term2;
        var b0 = y_mean - (b1 * x_mean);
        console.log(b1, b0)

        // perform regression 
        yhat = [];

        // fit line using coeffs
        for (i = 0; i < data.length; i++) {
            yhat.push(b0 + (+data[i].poverty * b1));
        }

        // calculate R squared coeff
        var top = 0;
        var bot = 0;
        for (i = 0; i < data.length; i++) {
            bot += (+data[i].healthcare - y_mean)**2;
            top += (yhat[i] - y_mean)**2;
        }
    
        var R2 = top / bot;
        console.log (R2);
    
    
        // make data array from linear regression (to plot)
        var dArray = [];
        for (i = 0; i < data.length; i++) {
            dArray.push({
                "yhat": yhat[i],
                "y": +data[i].healthcare,
                "x": +data[i].poverty
            })};
    
        // configure regression line to draw on chartGroup/plot
        var line1 = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.yhat));
    
        // append SVG path / linear regression line
        chartGroup
            .data([dArray])
            .append("path")
            .attr("d", line1)
            .attr("id","regLine")
            .classed("line orange", true);

        // append R squared value
        chartGroup.append("text")
            .attr("x", 20)
            .attr("y", 20)
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "rgb(184, 118, 57)")
            .attr("id","RText")
            .text(`R² = ${d3.format(".3f")(R2)}`);
    };

//--------------------------------------------------------------------------

}).catch(function(error) {
    console.log(error);
});
