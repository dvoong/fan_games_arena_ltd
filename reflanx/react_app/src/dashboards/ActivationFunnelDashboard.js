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

class ActivationFunnelDashboard {

    constructor(containerId, data) {
	console.log("ActivationFunnelDashboard.constructor()")
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
				nNewUsers: row[this.data.headers.indexOf("nNewUsers")],
				percentSubmittedQuiz: row[
				    this.data.headers.indexOf("nSubmittedQuiz")
				] / row[
				    this.data.headers.indexOf("nNewUsers")
				]
			    }
			}
		    )
		}
	    }
	)

	this.activationFunnelchart = new ActivationFunnelChart(this, this.groupedData)
	this.installsChart = new InstallsChart(this, this.groupedData)
	
	this.colours = {
	    "client": {
		"Android": "indianred",
		"iOS": "aquamarine",
	    }
	}
    }

    draw() {
	console.log("ActivationFunnelDashboard.draw()");
	this.activationFunnelchart.draw();
	this.installsChart.draw();
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

class ActivationFunnelChart {
    constructor(dashboard, dataGroup){
	this.dashboard = dashboard
	this.dataGroup = dataGroup
	this.container = this.dashboard.container.append("div")
	    .attr("class", "container")
	this.container.append("h2")
	    .attr("class", "chart-title")
	    .html("%New users that submitted a quiz")
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
 	console.log("ActivationFunnelChart.draw()");
	console.log(this.dataGroup);
 	let startDate = d3.min(this.dataGroup.map(g=>d3.min(g.values, d=>d.date)));
 	let endDate = d3.max(this.dataGroup.map(g=>d3.max(g.values, d=>d.date)));
 	let minPercentSubmittedQuiz = d3.min(
 	    this.dataGroup.map(g=>d3.min(g.values, d=>d.percentSubmittedQuiz))
	);
 	let maxPercentSubmittedQuiz = d3.max(
 	    this.dataGroup.map(g=>d3.max(g.values, d=>d.percentSubmittedQuiz))
 	);
 	this.xScale.domain([startDate, endDate]);
 	this.yScale.domain([maxPercentSubmittedQuiz, minPercentSubmittedQuiz]);

 	let dataGroups = this.plotArea.element.selectAll(".data-group")
 	    .data(this.dataGroup, d=>d.name)
 	    .join("g")
 	    .attr("class", "data-group");

        this.valueline = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.percentSubmittedQuiz))
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
	    .attr("cy", d=>this.yScale(d.percentSubmittedQuiz))
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
	let percentSubmittedQuiz = d.percentSubmittedQuiz.toLocaleString();
	let circle = d3.select(circles[i]);
	circle.attr('opacity', 1)
	this.dashboard.showTooltip(`${date}: ${percentSubmittedQuiz}`);
    }

    toColour(d, i) {
	let group = d.name;
	let groupby = this.dashboard.groupby;
	return this.dashboard.colours[groupby][group];
    }
    
}

class InstallsChart {
    constructor(dashboard, dataGroup){
	this.dashboard = dashboard
	this.dataGroup = dataGroup
	this.container = this.dashboard.container.append("div")
	    .attr("class", "container")
	this.container.append("h2")
	    .attr("class", "chart-title")
	    .html("%New users that submitted a quiz")
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
 	console.log("InstallsChart.draw()");
	console.log(this.dataGroup);
 	let startDate = d3.min(this.dataGroup.map(g=>d3.min(g.values, d=>d.date)));
 	let endDate = d3.max(this.dataGroup.map(g=>d3.max(g.values, d=>d.date)));
 	let minInstalls = d3.min(
 	    this.dataGroup.map(g=>d3.min(g.values, d=>d.nNewUsers))
	);
 	let maxInstalls = d3.max(
 	    this.dataGroup.map(g=>d3.max(g.values, d=>d.nNewUsers))
 	);
 	this.xScale.domain([startDate, endDate]);
 	this.yScale.domain([maxInstalls, minInstalls]);

 	let dataGroups = this.plotArea.element.selectAll(".data-group")
 	    .data(this.dataGroup, d=>d.name)
 	    .join("g")
 	    .attr("class", "data-group");

        this.valueline = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.nNewUsers))
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
	    .attr("cy", d=>this.yScale(d.nNewUsers))
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
	let nNewUsers = d.nNewUsers.toLocaleString();
	let circle = d3.select(circles[i]);
	circle.attr('opacity', 1)
	this.dashboard.showTooltip(`${date}: ${nNewUsers}`);
    }

    toColour(d, i) {
	let group = d.name;
	let groupby = this.dashboard.groupby;
	return this.dashboard.colours[groupby][group];
    }
    
}

export default ActivationFunnelDashboard;
