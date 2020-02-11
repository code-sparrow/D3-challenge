// SVG wrapper dimensions are determined by the current width and
// height of the browser window.
var svgWidth = 960;
var svgHeight = 575;

var chartMargin = {
    top: 30,
    bottom: 95,
    right: 30,
    left: 95
};

var chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;
var chartWidth = svgWidth - chartMargin.left - chartMargin.right;

// Append SVG element
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth)
    .call(responsivefy);

// Append a group to the SVG area and shift ('translate') it to the right and down to adhere
// to the margins set in the "chartMargin" object.
var chartGroup = svg.append("g")
    .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

// Initial axes
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare"

// function used for updating x-scale var upon click on axis label
function scaleX(healthData, chosenXAxis) {
    var xMin = d3.min(healthData, d => d[chosenXAxis]* 0.9);
    var xMax = d3.max(healthData, d => d[chosenXAxis] * 1.1);
    var xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, chartWidth]);
    return xScale;
};

// function used for updating y-scale var upon click on axis label
function scaleY(healthData, chosenYAxis) {
    var yMin = d3.min(healthData, d => d[chosenYAxis]* 0.75);
    var yMax = d3.max(healthData, d => d[chosenYAxis] * 1.1);
    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([chartHeight, 0]);
    return yScale;
};

// function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);

    return xAxis;
}

// function used for updating xAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
        .duration(1000)
        .call(leftAxis);

    return yAxis;
}


// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {

    circlesGroup.transition()
        .duration(750)
        .attr("r", 4)
        .transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]))
        .attr("r", 11);

    return circlesGroup;
};

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

    var toolTip = d3.tip()
        //.data(healthData)
        .attr("class", "tooltip")
        .offset([80, -60])
        .html(function(d) {
            return (`<b>${d.state}</b><br><br>${chosenXAxis}: ${d[chosenXAxis]}<br><br>${chosenYAxis}: ${d[chosenYAxis]}`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function(data) {
        toolTip.show(data);
    })
      // onmouseout event
        .on("mouseout", function(data, index) {
            toolTip.hide(data);
        });

    return circlesGroup;
}

// Load data from data.csv
d3.csv("assets/data/data.csv").then(function(healthData, err) {
    if (err) throw err;


    // parse data
    healthData.forEach(function(data) {
        data.poverty = +data.poverty;
        data.age = +data.age;
        data.income = +data.income;
        data.healthcare = +data.healthcare;
        data.obesity = +data.obesity;
        data.smokes = +data.smokes;
    });
    console.log(healthData);

    // scaled X and Y axes, scaleX and scaleY functions defined above
    var xScale = scaleX(healthData, chosenXAxis);
    var yScale = scaleY(healthData, chosenYAxis);

    // create initial axes and append
    var bottomAxis = d3.axisBottom(xScale);
    var leftAxis = d3.axisLeft(yScale);
    //var xAxis = d3.axisBottom(xScale);
    //var yAxis = d3.axisLeft(yScale);

    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(bottomAxis);
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);

    // append initial circles for scatter plot
    //(took out .append("g"))
    var circlesGroup = chartGroup.selectAll("circle")
        .data(healthData)
        .enter()
        .append("circle")
        .attr("id","circles")
        .attr("cx", d => xScale(d[chosenXAxis]))
        .attr("cy", d => yScale(d[chosenYAxis]))
        .attr("r", 11)
        .attr("fill", "#6CA2CC")
        .attr("stroke-width", 1.2)
        .attr("stroke", "steelblue")
        .style("opacity", "0.8");

    // append initial text on top of circles with state abbreviations
    var textGroup = chartGroup.append("g")
        .selectAll('text')
        .data(healthData)
        .enter()
        .append('text')
        .attr("id","circle-text")
        .attr("x", d => xScale(d[chosenXAxis]))
        .attr("y", d => yScale(d[chosenYAxis]))
        .attr("text-anchor", "middle")
        .attr('font-size', 9)
        .attr('fill', "white")
        .attr("dy", "0.35em")
        .attr("font-weight", "bold")
        .text(d => d.abbr);

    // append group for multiple x-axis labels
    var xLabelGroup = chartGroup.append("g")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + chartMargin.top})`);

    var povertyLabel = xLabelGroup.append("text")
        .attr("x", 0)
        .attr("y", 15)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("In Poverty (%)");

    var ageLabel = xLabelGroup.append("text")
        .attr("x", 0)
        .attr("y", 35)
        .attr("value", "age")
        .classed("inactive", true)
        .text("Age (Median)");

    var incomeLabel = xLabelGroup.append("text")
        .attr("x", 0)
        .attr("y", 55)
        .attr("value", "income")
        .classed("inactive", true)
        .text("Household Income (Median)");

    var yLabelGroup = chartGroup.append("g");

    var healthcareLabel = yLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (chartHeight / 2))
        .attr("y", 0 - chartMargin.left)
        .attr("dy", "1.2em")
        .attr("value", "healthcare")
        .classed("active", true)
        .text("Lacks Healthcare (%)");

    var smokesLabel = yLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (chartHeight / 2))
        .attr("y", 0 - chartMargin.left)
        .attr("dy", "2.4em")
        .attr("value", "smokes")
        .classed("inactive", true)
        .text("Smokes (%)");

    var obesityLabel = yLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (chartHeight / 2))
        .attr("y", 0 - chartMargin.left)
        .attr("value", "obesity")
        .classed("inactive", true)
        .attr("dy", "3.6em")
        .text("Obese (%)");

    // updateToolTip function above csv import
    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // x axis labels event listener
    xLabelGroup.selectAll("text")
        .on("click", function() {
            

            //remove regression line and text if exists
            chartGroup.selectAll("#regLine").remove();
            chartGroup.selectAll("#RText").remove();
            d3.selectAll(".checkbox").property("checked", false);
            
            // get value of selection
            var value = d3.select(this).attr("value");
            
            if (value !== chosenXAxis) {

                // replaces chosenXAxis with value
                chosenXAxis = value;

                // updates x scale for new data
                xScale = scaleX(healthData, chosenXAxis);

                xAxis = renderXAxis(xScale, xAxis);

                // updates circles and text with new x values
                circlesGroup = renderCircles(circlesGroup, xScale, chosenXAxis, yScale, chosenYAxis);
                chartGroup.selectAll("#circle-text").remove();
                var textGroup = chartGroup
                    .append("g")
                    .selectAll('text')
                    .data(healthData)
                    .enter()
                    .append('text')
                    .attr("id","circle-text")
                    .attr("x", d => xScale(d[chosenXAxis]))
                    .attr("y", d => yScale(d[chosenYAxis]))
                    .attr("text-anchor", "middle")
                    .attr('font-size', 9)
                    .attr('fill', "white")
                    .attr("dy", "0.35em")
                    .attr("font-weight", "bold")
                    .text(d => d.abbr);

                // updates tooltips with new info
                circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                if (chosenXAxis === "age") {
                    ageLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                } else if (chosenXAxis === "income") {
                    incomeLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    ageLabel
                        .classed("active", false)
                        .classed("inactive", true);
                } else {
                    povertyLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                    incomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
                };
            };
        });

    // y axis labels event listener
    yLabelGroup.selectAll("text")
        .on("click", function() {

            //remove regression line and text if exists
            chartGroup.selectAll("#regLine").remove();
            chartGroup.selectAll("#RText").remove();
            d3.selectAll(".checkbox").property("checked", false);

            // get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenYAxis) {

                // replaces chosenYAxis with value
                chosenYAxis = value;

                // updates y scale for new data
                yScale = scaleY(healthData, chosenYAxis);

                yAxis = renderYAxis(yScale, yAxis);

                // updates circles and text with new y values
                circlesGroup = renderCircles(circlesGroup, xScale, chosenXAxis, yScale, chosenYAxis);
                chartGroup.selectAll("#circle-text").remove();
                var textGroup = chartGroup
                    .append("g")
                    .selectAll('text')
                    .data(healthData)
                    .enter()
                    .append('text')
                    .attr("id","circle-text")
                    .attr("x", d => xScale(d[chosenXAxis]))
                    .attr("y", d => yScale(d[chosenYAxis]))
                    .attr("text-anchor", "middle")
                    .attr('font-size', 9)
                    .attr('fill', "white")
                    .attr("dy", "0.35em")
                    .attr("font-weight", "bold")
                    .text(d => d.abbr);

                // updates tooltips with new info
                circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                if (chosenYAxis === "smokes") {
                    smokesLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                } else if (chosenYAxis === "obesity") {
                    obesityLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true);
                } else {
                    healthcareLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    obesityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                    smokesLabel
                    .classed("active", false)
                    .classed("inactive", true);
                };
            };
        });


    //--------------------------------------------------------------------------
    // event listener for linear regression checkbox
    d3.selectAll(".checkbox")
        .on("change", function () {  
            if (this.checked) {
                linearReg(healthData, chosenXAxis, chosenYAxis);
            } else {
                chartGroup.selectAll("#regLine").remove();
                chartGroup.selectAll("#RText").remove();
            }
        });
    
    // linear regression on "data"
    function linearReg(data, chosenXAxis, chosenYAxis) {
        x_mean = d3.mean(data, d => d[chosenXAxis]);
        y_mean = d3.mean(data, d => d[chosenYAxis]);
        console.log(data.length);

        // calculate coefficients
        var term1 = 0;
        var term2 = 0;
        var xr = 0;
        var yr = 0;
        for (i = 0; i < data.length; i++) {
            xr = data[i][chosenXAxis] - x_mean;
            yr = data[i][chosenYAxis] - y_mean;
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
            yhat.push(b0 + (data[i][chosenXAxis] * b1));
        }

        // calculate R squared coeff
        var top = 0;
        var bot = 0;
        for (i = 0; i < data.length; i++) {
            bot += (data[i][chosenYAxis] - y_mean)**2;
            top += (yhat[i] - y_mean)**2;
        }
    
        var R2 = top / bot;
        console.log (R2);
    
    
        // make data array from linear regression (to plot)
        var dArray = [];
        for (i = 0; i < data.length; i++) {
            dArray.push({
                "yhat": yhat[i],
                "y": data[i][chosenYAxis],
                "x": data[i][chosenXAxis]
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