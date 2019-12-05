import * as d3 from "d3";

class DauDashboard {

    constructor(containerId) {
        this.containerId = containerId;
        this.dauChart = new DauChart(
	    this,
            "dau-chart-container",
            "dau-chart-canvas",
            "dau-chart-plot-area",
        );
	this.clientChart = new ClientChart(
	    this,
	    "client-chart-container",
	    "client-chart-canvas",
	    "client-chart-plot-area"
	);
	this.tenureTypeChart = new TenureTypeChart(
	    this,
	    "tenureType-chart-container",
	    "tenureType-chart-canvas",
	    "tenureType-chart-plot-area"
	);
        this.initialiseComponents = this.initialiseComponents.bind(this);
	this.groupBy = null;
	// this.filter = [{name: 'client', values: []}, {name: 'tenureType', values: []}];
	// this.filter = [{name: 'client', values: ['Android']}];
	// this.filter = [{name: 'client', values: []}];
	this.filter = []
    }

    set data(data) {
        this._data = data;
	
	this.filteredData = {...data};
	this.filteredData.values = this.data.values.filter(
	    row=>{
		let conditionTests = this.filter.map(
		    f=>{
			let valueIndex = this.data.headers.indexOf(f.name)
			return f.values.includes(row[valueIndex]) || f.values.length === 0;
		    }
		);
		return !conditionTests.includes(false) || conditionTests.length == 0;
	    },
	);

	// set groupedData
	let groupIndices = this.groupBy.map(
	    g => this.data.headers.indexOf(g)
	);

	let dauIndex = this.data.headers.indexOf('dau');
	function x(accumulator, row) {
	    let key = groupIndices.map(i=>row[i]);
	    if(!(key in accumulator)){
		accumulator[key] = [key, 0];
	    }
	    accumulator[key][1] = accumulator[key][1] +  row[dauIndex];
	    return accumulator;
	}

	let groupedData = this.filteredData.values.reduce(x, {});
	groupedData = Object.values(groupedData);
	    
	function reduceFunc(accumulator, value) {
	    let key = value[0].slice(1);
	    if(!(key in accumulator)){
		accumulator[key] = {key: key, values: []};
	    }
	    accumulator[key].values.push([value[0][0], value[1]])
	    return accumulator;
	}
	groupedData = groupedData.reduce(reduceFunc, {});
	groupedData = Object.values(groupedData);
	this.groupedData = groupedData;

	// set clientData
	let groupby = "client";
	let clientIndex = this.data.headers.indexOf(groupby);
	let clientData = this.data.values.reduce(
	    (accumulator, row) => {
		let client = row[clientIndex];
		let dau = row[dauIndex];
		if(!(client in accumulator)) {
		    accumulator[client] = 0;
		}
		accumulator[client] = accumulator[client] + dau;
		return accumulator
	    },
	    {}
	);
	
	this.clientData = Object.keys(clientData).map(
	    k=>({client: k, totalDau: clientData[k]})
	);

	this.clients = Object.keys(clientData);

	// set tenureTypeData
	groupby = "tenureType";
	let tenureTypeIndex = this.data.headers.indexOf(groupby);
	let tenureTypeData = this.data.values.reduce(
	    (accumulator, row) => {
		let tenureType = row[tenureTypeIndex];
		let dau = row[dauIndex];
		if(!(tenureType in accumulator)) {
		    accumulator[tenureType] = 0;
		}
		accumulator[tenureType] = accumulator[tenureType] + dau;
		return accumulator
	    },
	    {}
	);
	
	this.tenureTypeData = Object.keys(tenureTypeData).map(
	    k=>({tenureType: k, totalDau: tenureTypeData[k]})
	);

	this.tenureTypes = Object.keys(tenureTypeData);

    }

    get data() {
        return this._data;
    }

    draw() {
        this.dauChart.draw(this.groupedData);
	this.clientChart.draw(this.clientData);
	this.tenureTypeChart.draw(this.tenureTypeData);
    }

    initialiseComponents() {
        let selector = `#${this.containerId}`;
        this.container = d3.select(selector);
        this.dauChart.initialiseComponents(this.container);
	this.clientChart.initialiseComponents(this.container);
	this.tenureTypeChart.initialiseComponents(this.container);
    }

    setData(data) {
        this.data = data;
        return true;
    }

}

class Chart {
    constructor(dauDashboard, containerId, canvasId, plotAreaId) {
	this.dauDashboard = dauDashboard;
        this.canvasId = canvasId;
        this.containerId = containerId;
        this.plotAreaId = plotAreaId;
	this.xScale = d3.scaleLinear();
	this.yScale = d3.scaleLinear();
    }

    initialiseComponents(dashboardContainer) {
        this.container = dashboardContainer.select(`#${this.containerId}`);
        this.canvas = this.container.select(`#${this.canvasId}`);
        this.canvasWidth = parseInt(this.container.style('width'), 10);
        this.canvasHeight = 300;
        this.canvas.attr("width", this.canvasWidth)
            .attr("height", this.canvasHeight);
        
        this.plotArea = this.canvas.select(`#${this.plotAreaId}`);
        this.margins = {
            left: 50,
            right: 30,
            bottom: 50,
            top: 15
        };
        
        this.plotAreaWidth = this.canvasWidth - this.margins.left - this.margins.right;
        this.plotAreaHeight = this.canvasHeight - this.margins.top - this.margins.bottom;
        this.plotArea.attr(
            'transform',
            `translate(${this.margins.left}, ${this.margins.top})`
        );

        this.xScale
            .range([0, this.plotAreaWidth]);

        this.yScale
            .range([this.plotAreaHeight, 0]);

        this.xAxis = this.plotArea.append('g')
            .attr('transform', `translate(0, ${this.plotAreaHeight})`);
        
        this.yAxis = this.plotArea.append('g');
	
    }
}

class ClientChart extends Chart {

    constructor(...args) {
	super(...args);
	this.xScale = d3.scaleLinear();
	this.yScale = d3.scaleBand();
    }

    draw(data) {
	let that = this;
	
        if(this.canvas === undefined || this.container === undefined){
            console.log("ClientChart.error, no canvas or container");
            return;
        }

	let xMin = 0
	let xMax = d3.max(data, d=>d.totalDau)
	this.xScale.domain([xMin, xMax]);
	this.yScale.domain(data.map(d=>d.client));
	let selection = this.plotArea.selectAll(".bar")
	    .data(data);
	selection.exit().remove();
	selection.enter().append("rect")
	    .attr("class", d=>`bar bar-${this.dauDashboard.clients.indexOf(d.client)}`)
	    .attr("x", 0)
	    .attr("y", d=>this.yScale(d.client))
	    .attr("width", d=>this.xScale(d.totalDau))
	    .attr("height", this.yScale.bandwidth())
	    .on(
		"click",
		d=>{
		    let filterIndex = that.dauDashboard.filter.findIndex(d=>d.name == 'client');
		    if(filterIndex != -1) {
			let filterValueIndex = that.dauDashboard.filter[filterIndex].values.indexOf(d.client);
			if(filterValueIndex != -1){
			    that.dauDashboard.filter[filterIndex].values = that.dauDashboard.filter[
				filterIndex
			    ].values.filter(x=>x != d.client)
			} else {
			    that.dauDashboard.filter[filterIndex].values.push(d.client);
			}
		    } else {
			that.dauDashboard.filter.push(
			    {name: 'client', values: [d.client]}
			)
		    }
		    that.dauDashboard.data = that.dauDashboard.data;
		    that.dauDashboard.draw();
		}
	    )
	

	this.xAxis.call(d3.axisBottom(this.xScale));
	this.yAxis.call(d3.axisLeft(this.yScale));
    }
}

class DauChart extends Chart {

    constructor(...args) {
	super(...args)
	this.xScale = d3.scaleTime();
	this.yScale = d3.scaleLinear();
    }

    draw(groupedData) {
	
        if(this.canvas === undefined || this.container === undefined){
            console.log("DauChart.error, no canvas or container");
            return;
        }
	const dateIndex = 0
	const dauIndex = 1

	let startDate = d3.min(groupedData.map(dg=>d3.min(dg.values,d=>d[0])));
	let endDate = d3.max(groupedData.map(dg=>d3.max(dg.values,d=>d[0])));
	this.xScale.domain([startDate, endDate]);
	this.xAxis
	    .transition()
	    .call(d3.axisBottom(this.xScale));
	this.yScale.domain(
	    [
		d3.min(groupedData.map(dg=>d3.min(dg.values, d=>d[1]))),
		d3.max(groupedData.map(dg=>d3.max(dg.values, d=>d[1]))),
            ]
        );
	this.yAxis
	    .transition()
	    .call(d3.axisLeft(this.yScale));

        // this.valueline = d3.line()
        //     .x(d => this.xScale(d[0]))
        //     .y(d => this.yScale(d[1]))
        //     .curve(d3.curveMonotoneX);

	// let selection = this.plotArea.selectAll("path.line")
	//     .data(groupedData.map(d=>d.values))
	// selection.exit().remove();
	// selection.enter()
	//     .append("path")
	//     .attr("class", (d, i) => `line line-${i}`)
	//     .data(groupedData.map(d=>d.values))
	//     .attr("d", this.valueline);
	// selection
	//     .data(groupedData.map(d=>d.values))
	//     .transition()
	//     .attr("d", this.valueline);

        this.valueline = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
            .curve(d3.curveMonotoneX);

	console.log("groupedData");
	console.log(groupedData);
	
	let selection = this.plotArea.selectAll("path.line")
	    .data(groupedData.map(d=>d.values))
	selection.exit().remove();
	selection.enter()
	    .append("path")
	    .attr("class", (d, i) => `line line-${i}`)
	    .data(groupedData.map(d=>d.values))
	    .attr("d", this.valueline);
	selection
	    .data(groupedData.map(d=>d.values))
	    .transition()
	    .attr("d", this.valueline);
	
    }
}

class TenureTypeChart extends Chart {

    constructor(...args) {
	super(...args);
	this.xScale = d3.scaleLinear();
	this.yScale = d3.scaleBand();
    }

    draw(data) {
	let that = this;
	
        if(this.canvas === undefined || this.container === undefined){
            console.log("TenureTypeChart.error, no canvas or container");
            return;
        }

	let xMin = 0
	let xMax = d3.max(data, d=>d.totalDau)
	this.xScale.domain([xMin, xMax]);
	this.yScale.domain(data.map(d=>d.tenureType));
	let selection = this.plotArea.selectAll(".bar")
	    .data(data);
	selection.exit().remove();
	selection.enter().append("rect")
	    .attr("class", d=>`bar bar-${this.dauDashboard.tenureTypes.indexOf(d.tenureType)}`)
	    .attr("x", 0)
	    .attr("y", d=>this.yScale(d.tenureType))
	    .attr("width", d=>this.xScale(d.totalDau))
	    .attr("height", this.yScale.bandwidth())
	    .on(
		"click",
		d=>{
		    let filterIndex = that.dauDashboard.filter.findIndex(d=>d.name == 'tenureType');
		    if(filterIndex != -1) {
			let filterValueIndex = that.dauDashboard.filter[filterIndex].values.indexOf(d.tenureType);
			if(filterValueIndex != -1){
			    that.dauDashboard.filter[filterIndex].values = that.dauDashboard.filter[
				filterIndex
			    ].values.filter(x=>x != d.tenureType)
			} else {
			    that.dauDashboard.filter[filterIndex].values.push(d.tenureType);
			}
		    } else {
			that.dauDashboard.filter.push(
			    {name: 'tenureType', values: [d.tenureType]}
			)
		    }
		    that.dauDashboard.data = that.dauDashboard.data;
		    that.dauDashboard.draw();
		}
	    )

	this.xAxis.call(d3.axisBottom(this.xScale));
	this.yAxis.call(d3.axisLeft(this.yScale));
    }
}

export default DauDashboard;
