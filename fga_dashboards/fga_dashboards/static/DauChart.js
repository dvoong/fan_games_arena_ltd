import {
    axisBottom as d3axisBottom,
    axisLeft as d3axisLeft,
    curveMonotoneX as d3curveMonotoneX,
    line as d3line,
    min as d3min,
    max as d3max,
    scaleTime as d3scaleTime,
    scaleLinear as d3scaleLinear,
    select as d3select
} from "d3";


class DauChart {

    constructor(containerId="dau-chart", canvasHeight=300){
	this.containerId = containerId;
        this.canvasHeight = canvasHeight;
    }

    initialise() {
        console.log("initialise");
	this.container = d3select(`#${this.containerId}`);
	this.canvas = this.container.select(".canvas");
	console.log(`container: ${this.container}`);
	console.log(`canvas: ${this.canvas}`);
    }

    draw(data) {
        console.log("draw");
        this.canvasWidth = parseInt(this.container.style('width'), 10);
        this.canvasHeight = this.canvasHeight;
        this.canvas.attr("width", this.canvasWidth)
            .attr("height", this.canvasHeight);
        this.plotArea = this.canvas.select(".plot-area");
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

        this.xScale = d3scaleTime()
            .range([0, this.plotAreaWidth])
            .domain(
                [
                    d3min(data, (x) => x[0]),
                    d3max(data, (x) => x[0])
                ]
            );

        console.log(this.xScale);
        
        this.yScale = d3scaleLinear()
            .range([this.plotAreaHeight, 0])
            .domain(
                [
                    d3min(data, (x) => x[1]),
                    d3max(data, (x) => x[1])
                ]
            );

        this.valueline = d3line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
            .curve(d3curveMonotoneX);

        this.plotArea.append("path")
            .data([data]) 
            .attr("class", "plot-line")  
            .attr("d", this.valueline);

        this.xAxis = d3axisBottom(this.xScale);
        this.plotArea.append('g')
            .attr('transform', `translate(0, ${this.plotAreaHeight})`)
            .call(this.xAxis);

        this.yAxis = d3axisLeft(this.yScale);
        this.plotArea.append('g')
            .call(this.yAxis);

        this.plotArea.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle") 
            .attr("class", "dot") 
            .attr("cx", d => this.xScale(d[0]))
            .attr("cy", d => this.yScale(d[1]))
            .attr("r", 2);
        
    }
}

const DauChartComponent = ({data, dauChart}) => {

    return (
        <div className="chart-container" id={dauChart.containerId}>
          <svg className="canvas">
            <g className="plot-area"/>
          </svg>
        </div>
    );
}

export {DauChart, DauChartComponent};

