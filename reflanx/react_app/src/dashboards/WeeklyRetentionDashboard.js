import * as d3 from "d3";

class Canvas {
    constructor(container, padding=null, width=null, height=null){
	this.container = container;
	this.padding = padding ? padding : {top: 15, left: 50, right: 30, bottom: 50}
	this.width = width ? width : parseInt(container.style("width"));
	this.height = height ? height : 300;
	this.element = this.container.append("svg")
	    .attr("class", "canvas")
	    .attr("height", this.height)
	    .attr("width", this.width);
    }
}

class PlotArea {
    constructor(canvas) {
	this.canvas = canvas;
	this.element = this.canvas.element.append("g")
	    .attr("class", "plot-area")
	    .attr(
		"transform",
		`translate(${this.canvas.padding.left}, ${this.canvas.padding.top})`
	    );
	this.width = this.canvas.width - this.canvas.padding.left - this.canvas.padding.right;
	this.height = this.canvas.height - this.canvas.padding.top - this.canvas.padding.bottom;
    }
}

class WeeklyRetentionDashboard {

    constructor(containerId, data) {
	console.log("RetentionDashboard.constructor()")
	this.containerId = containerId;
	this.data = data;
	this.container = d3.select(`#${containerId}`)
	    .style("padding-top", "5em")
	    // .style("margin-top", "100px")
	this.colours = {
	    "client": {
		"Android": "indianred",
		"iOS": "aquamarine",
	    }
	}
	this.groupby = "client";

	let dayxs = [1, 2, 3, 4];
	let clients = ["Android", "iOS"]

	let groupedData = dayxs.map(
	    x=>{
		return {
		    name: `w${x}Retention`,
		    groups: clients.map(
			client => {
			    return {
				name: client,
				values: this.data.values.filter(
				    row => {
					return row[this.data.headers.indexOf('client')] === client
				    }
				).map(
				    row => {
					return {
					    date: row[this.data.headers.indexOf('date')],
					    retention: row[
						this.data.headers.indexOf(`w${x}ActiveUsers`)
					    ] / row[
						this.data.headers.indexOf(`cohortSize`)
					    ]
					}
				    }
				)
			    }
			}
		    )
		}
	    }
	)

	console.log("groupedData");
	console.log(groupedData);

	this.charts = groupedData.map(
	    g => {
		return new RetentionChart(this, g)
	    }
	)

    }

    draw() {
	console.log("RetentionDashboard.draw()");
	this.charts.map(c=>c.draw());
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

class RetentionChart {
    constructor(dashboard, dataGroup){
	this.dashboard = dashboard
	this.dataGroup = dataGroup
	this.container = this.dashboard.container.append("div")
	    .attr("class", "container")
	this.container.append("h2")
	    .attr("class", "chart-title")
	    .html(dataGroup.name)
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
	console.log("RetentionChart.draw()");

	let startDate = d3.min(this.dataGroup.groups.map(g=>d3.min(g.values, d=>d.date)));
	let endDate = d3.max(this.dataGroup.groups.map(g=>d3.max(g.values, d=>d.date)));
	let minRetention = d3.min(
	    this.dataGroup.groups.map(g=>d3.min(g.values, d=>d.retention))
	);
	let maxRetention = d3.max(
	    this.dataGroup.groups.map(g=>d3.max(g.values, d=>d.retention))
	);

	this.xScale.domain([startDate, endDate]);
	this.yScale.domain([maxRetention, minRetention]);

	let dataGroups = this.plotArea.element.selectAll(".data-group")
	    .data(this.dataGroup.groups, d=>d.name)
	    .join("g")
	    .attr("class", "data-group");

        this.valueline = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.retention))
            .curve(d3.curveMonotoneX);

	dataGroups.selectAll("path")
	    .data(d=>[d])
	    .join("path")
	    .attr("class", "line")
	    .style("stroke", this.toColour)
	    .transition()
	    .attr('d', d => this.valueline(d.values))
	
	dataGroups.selectAll("circle")
	    .data(d=>d.values.map(v=>({name: d.name, ...v})))
	    .join("circle")
	    .attr("cx", d=>this.xScale(d.date))
	    .attr("cy", d=>this.yScale(d.retention))
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
	    .data(this.dataGroup.groups)
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
	let retention = d.retention.toLocaleString();
	let circle = d3.select(circles[i]);
	circle.attr('opacity', 1)
	this.dashboard.showTooltip(`${date}: ${retention}`);
    }

    toColour(d, i) {
	let group = d.name;
	let groupby = this.dashboard.groupby;
	return this.dashboard.colours[groupby][group];
    }
    
}

export default WeeklyRetentionDashboard;
