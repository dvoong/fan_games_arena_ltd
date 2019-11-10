import {
    axisBottom as d3axisBottom,
    axisLeft as d3axisLeft,
    curveMonotoneX as d3curveMonotoneX,
    legend as d3legend,
    line as d3line,
    min as d3min,
    max as d3max,
    scaleTime as d3scaleTime,
    scaleLinear as d3scaleLinear,
    select as d3select
} from "d3";
import * as d3 from "d3";


const unique = (value, index, self) => {
  return self.indexOf(value) === index
}

class DauChart {

    constructor(containerId="dau-chart", canvasHeight=300){
	this.containerId = containerId;
        this.canvasHeight = canvasHeight;
    }

    initialise() {
	this.container = d3select(`#${this.containerId}`);
	this.canvas = this.container.select(".canvas");
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

        this.xScale = d3scaleTime();
        this.yScale = d3scaleLinear();

        this.xAxis = d3axisBottom(this.xScale);
        this.yAxis = d3axisLeft(this.yScale);
        this.xAxisElement = this.plotArea.append('g')
            .attr('transform', `translate(0, ${this.plotAreaHeight})`);
        this.yAxisElement = this.plotArea.append('g');

        this.valueline = d3line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[2]))
            .curve(d3curveMonotoneX);

	this.legend = this.canvas.append("g")
	    .attr("class","legend")
	    .attr("transform","translate(50,30)")
	    .style("font-size","12px")
    }

    draw(data) {
        this.xScale
            .domain(
                [
                    d3min(data.values, (x) => x[0]),
                    d3max(data.values, (x) => x[0])
                ]
            )
            .range([0, this.plotAreaWidth]);
            
        this.yScale
            .domain(
                [
                    d3min(data.values, (x) => x[2]),
                    d3max(data.values, (x) => x[2])
                ]
            )
            .range([this.plotAreaHeight, 0]);
        
        this.xAxisElement.call(this.xAxis);
        this.yAxisElement.call(this.yAxis);

        this.plotArea.select(".plot-line")
            .remove();

	let clients = data.values.map(d => d[1]);
	clients = clients.filter(unique)

	clients.map(
	    (client, i) => {
		let values = data.values.filter(d => d[1] == client);
		let colorIndex = i % 5;

		this.plotArea.append("path")
		    .data([values]) 
		    .attr("class", `plot-line ${client} color-stroke-${colorIndex}`)  
		    .attr("d", this.valueline);
		
		this.plotArea.selectAll(`.dot .${client}`)
		    .data(values)
		    .enter()
		    .append("circle") 
		    .attr("class", `dot ${client}`)
		    .attr("cx", d => this.xScale(d[0]))
		    .attr("cy", d => this.yScale(d[2]))
		    .attr("r", 2);
	    }
	);

	let s = this.legend
	    .selectAll(".legend-item")
	    .data(clients)
	
	let legendItems = s.enter()
	    .append("g")
	    .attr("class", "legend-item")
	    .attr("transform", "translate(15, 0)");

	legendItems
	    .append("circle")
	    .attr("class", (d, i)=>{
		let colorIndex = i % 5;
		return `color-fill-${colorIndex}`;
	    })
	    .attr("cy", (d, i)=>i*15)
	    .attr("r", 2)

	legendItems
	    .append("text")
	    .attr("class", (d, i)=>{
		let colorIndex = i % 5;
		return `color-fill-${colorIndex}`;
	    })
	    .attr("x", 15)
	    .attr("y", (d, i)=>i*15)
	    .html(d => d);

	s.exit().remove();
        
    }
}

const DauChartComponent = ({dauChart}) => {

    return (
        <div className="chart-container" id={dauChart.containerId}>
          <svg className="canvas">
            <g className="plot-area"/>
          </svg>
        </div>
    );
}

export {DauChart, DauChartComponent};

