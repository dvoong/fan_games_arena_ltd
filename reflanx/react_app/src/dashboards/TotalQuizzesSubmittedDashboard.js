import * as d3 from "d3";
import Canvas from "../Canvas"
import PlotArea from "../PlotArea"

class TotalQuizzesSubmittedDashboard {

    constructor(containerId, data) {
	console.log("TotalQuizzesSubmittedDashboard.constructor()")
	this.containerId = containerId;
	this.data = data;
	this.container = d3.select(`#${containerId}`)
	    .style("padding-top", "5em")
	this.clients = Object.keys(
	    this.data.values.reduce(
		(accumulator, row) => {
		    accumulator[row[this.data.headers.indexOf('client')]] = 1
		    return accumulator
		},
		{}
	    )
	);
	this.groupby = "client"
	console.log(this.data);
	
	this.groupedData = this.clients.map(
	    c=> {
		return {
		    name: c,
		    values: this.data.values.filter(
			row=>row[this.data.headers.indexOf("client")] === c
		    ).map(
			row=>{
			    return {
				date: row[this.data.headers.indexOf("date")],
				value: row[this.data.headers.indexOf(
				    "meanNQuizzesSubmittedByNewUsers"
				)],
			    }
			}
		    )
		}
	    }
	)

	this.chart = new MeanNQuizzesSubmittedByNewUsers(this, this.groupedData)
	
	this.colours = {
	    "client": {
		"Android": "indianred",
		"iOS": "aquamarine",
	    }
	}
    }

    draw() {
	console.log("TotalQuizzesSubmittedDashboard.draw()");
	this.chart.draw();
    }

    hideTooltip() {
    	this.tooltip
    	    .transition()
    	    .style("opacity", 0);
    }

    showTooltip(data) {
    	if(this.tooltip === undefined){
    	    this.tooltip = this.container.append("div")
    		.attr("class", "tooltip")
    		.style("opacity", 0)
    	}
    	this.tooltip
    	    .html(data)
            .style("left", (d3.event.pageX) + "px")		
            .style("top", (d3.event.pageY - 28) + "px")
    	    .transition()
    	    .style("opacity", 0.9);
	
    }
    
}

class MeanNQuizzesSubmittedByNewUsers {
    constructor(dashboard, dataGroup){
	this.dashboard = dashboard
	this.dataGroup = dataGroup
	this.container = this.dashboard.container.append("div")
	    .attr("class", "container")
	this.container.append("h2")
	    .attr("class", "chart-title")
	    .html("Average number of quizzes submitted by new users on first day")
	this.canvas = new Canvas(this.container)
	this.plotArea = new PlotArea(this.canvas)
	this.xAxis = this.plotArea.element.append("g")
	    .attr("class", "x-axis")
	    .attr("transform", `translate(0, ${this.plotArea.height})`)
	this.yAxis = this.plotArea.element.append("g")
	    .attr("class", "y-axis")
	this.xScale = d3.scaleTime()
	    .range([0, this.plotArea.width]);
	this.yScale = d3.scaleLinear()
	    .range([0, this.plotArea.height]);

	this.toColour = this.toColour.bind(this);
	
    }

    draw() {
 	console.log("MeanNQuizzesSubmittedByNewUsers.draw()");
 	let startDate = d3.min(this.dataGroup.map(g=>d3.min(g.values, d=>d.date)));
 	let endDate = d3.max(this.dataGroup.map(g=>d3.max(g.values, d=>d.date)));
 	let minValue = d3.min(this.dataGroup.map(g=>d3.min(g.values, d=>d.value)));
 	let maxValue = d3.max(this.dataGroup.map(g=>d3.max(g.values, d=>d.value)));
 	this.xScale.domain([startDate, endDate]);
 	this.yScale.domain([maxValue, minValue]);

 	let dataGroups = this.plotArea.element.selectAll(".data-group")
 	    .data(this.dataGroup, d=>d.name)
 	    .join("g")
 	    .attr("class", "data-group");

        this.valueline = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);

	dataGroups.selectAll("path")
	    .data(d=>[d])
	    .join("path")
	    .attr("class", "line")
	    .style("stroke", this.toColour)
	    .transition()
	    .attr('d', d => this.valueline(d.values))

	dataGroups.selectAll("circle")
	    .data(d=>d.values.map(v=>({...v, name: d.name})))
	    .join("circle")
	    .attr("cx", d=>this.xScale(d.date))
	    .attr("cy", d=>this.yScale(d.value))
	    .attr("r", 5)
	    .attr("fill", this.toColour)
	    .attr("opacity", 1)
	    .on("mouseover", (d, i, circles)=>this.showTooltip(d, i, circles))
	    .on("mouseout", (d, i, circles)=>this.hideTooltip(d, i, circles))

	let legend = this.plotArea.element
	    .append("g")
	    .attr("class", "legend")
	    .attr("transform", `translate(${this.plotArea.width}, 0)`);

	let legendItems = legend.selectAll(".legend-item")
	    .data(this.dataGroup)
	    .join("g")

	legendItems.append("rect")
	    .attr("y", (d, i)=>(i-1)*15)
	    .attr("height", 15)
	    .attr("width", 15)
	    .attr("fill", this.toColour)
	
	legendItems
	    .append("text")
	    .html(d=>d.name)
	    .attr("y", (d, i)=>i*15)
	    .attr("dx", "-0.5em")
	    .attr("text-anchor", "end")
	
 	this.xAxis.call(d3.axisBottom(this.xScale));
 	this.yAxis.call(d3.axisLeft(this.yScale));
     }

    hideTooltip(d, i, circles) {
	let circle = d3.select(circles[i]);
	circle.attr("opacity", 1);
	return this.dashboard.hideTooltip();
    }
    
    showTooltip(d, i, circles) {
	let date = d.date.toDateString();
	let value = d.value.toLocaleString();
	let circle = d3.select(circles[i]);
	circle.attr('opacity', 1)
	this.dashboard.showTooltip(`${date}: ${value}`);
    }

    toColour(d, i) {
	let group = d.name;
	let groupby = this.dashboard.groupby;
	return this.dashboard.colours[groupby][group];
    }
    
}

export default TotalQuizzesSubmittedDashboard;
