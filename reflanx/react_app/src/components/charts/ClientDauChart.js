import * as d3 from "d3";
import React from "react";
import { dauDataset } from "../../datasets";


class ClientDauChart extends React.Component {

    container = {id: "client-dau-chart-container"};
    canvas = {height: 300}
    datasets = [dauDataset]
    plotArea = {margins: {left: 50, right: 30, bottom: 50, top: 15}}
    title = "DAU Chart"
    xAxis = {scale: d3.scaleLinear()}
    yAxis = {scale: d3.scaleBand()}

    componentDidMount() {
        console.log("ClientDauChart.componentDidMount()");
        this.container.element = d3.select(`#${this.container.id}`);
        this.container.width = parseInt(this.container.element.style("width"), 10);

        this.canvas.element = this.container.element.select(".canvas");
        this.canvas.width = this.container.width;
        this.canvas.element.attr("width", this.canvas.width);
        this.canvas.element.attr("height", this.canvas.height);
        
        this.plotArea.element = this.container.element.select(".plot-area");
        this.plotArea.width = this.canvas.width
            - this.plotArea.margins.left
            - this.plotArea.margins.right;
        this.plotArea.height = this.canvas.height
            - this.plotArea.margins.top
            - this.plotArea.margins.bottom;
        this.plotArea.element.attr(
            'transform',
            `translate(${this.plotArea.margins.left}, ${this.plotArea.margins.top})`
        );

        this.xAxis.element = this.plotArea.element.select(".x-axis");
        this.xAxis.scale.range([0, this.plotArea.width]);
        this.xAxis.element.attr('transform', `translate(0, ${this.plotArea.height})`);

        this.yAxis.element = this.plotArea.element.select(".y-axis");
        this.yAxis.scale.range([this.plotArea.height, 0]);
    }

    componentDidUpdate() {

        if(dauDataset.name in this.props.datasetRegistry) {
            this.draw();
        }
    }

    constructor(props) {
    	console.log("ClientDauChart.constructor()");
    	super(props);

    	this.props.registerDatasets(this.datasets);
    }

    draw() {
        console.log("ClientDauChart.draw()");

        // aggregate data
        let dataset = this.props.datasetRegistry[dauDataset.name];
        let clientIndex = dataset.data.headers.indexOf("client");
        let dauIndex = dataset.data.headers.indexOf("dau");
        let data = dataset.data.values.reduce(
            (acc, row) => {
                let client = row[clientIndex];
                let dau = row[dauIndex];
                if(!(client in acc)) {
                    acc[[client]] = {client: client, dau: 0};
                }
                acc[[client]]["dau"] += dau;
                return acc;
            },
            {}
        );
        data = Object.values(data);

        let minDau = 0;
        let maxDau = d3.max(data, d=>d.dau);
        this.xAxis.scale.domain([minDau, maxDau]);
        this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale).ticks(5));

        this.yAxis.scale.domain(data.map(d=>d.client));
        this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

        const getClass = (d, i) => {
            let className = `bar`;
            let filters = this.props.filters;
            let filter = this.props.filters.find(f=>f.variable === "client");
            className += filter === undefined
                || filters.length === 0
                || filter.values.indexOf(d.client) !== -1
                ? ` bar-${i}`
                : " filtered-row";
            return className;
        };

        const toColour = (d) => {
            if(d.client in this.props.colours) {
                return this.props.colours[d.client];
            }
            return "steelblue";
        };

        this.plotArea
            .element
            .selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", (d,i)=>`bar bar-${i}`)
            .attr("class", getClass)
            .attr("y", d=>this.yAxis.scale(d.client))
            .attr("height", this.yAxis.scale.bandwidth())
            .on("click", d=>this.props.toggleFilter("client", d.client))
            .on("mouseover", d=>this.props.tooltip.show(d.dau))
            .on("mouseout", this.props.tooltip.hide)
            .style("fill", toColour)
            .transition()
            .attr("width", d=>this.xAxis.scale(d.dau));
        
    }
    
    render() {
    	console.log("ClientDauChart.render()");
    	return (
    	    <div className="container" id={`${this.container.id}`}>
              <h3>Dau by Client</h3>
              <svg className="canvas">
                <g className="plot-area">
                  <g className="x-axis"></g>
                  <g className="y-axis"></g>
                </g>
              </svg>
            </div>
    	);
    }

    
}

export default ClientDauChart;
