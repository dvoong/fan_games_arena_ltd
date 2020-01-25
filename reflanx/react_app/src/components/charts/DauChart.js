import * as d3 from "d3";
import React from "react";
import dauDataset from "../../datasets";


class DauChart extends React.Component {

    container = {id: "dau-chart-container"};
    canvas = {height: 300}
    datasets = [dauDataset]
    plotArea = {margins: {left: 50, right: 30, bottom: 50, top: 15}}
    title = "DAU Chart"
    xAxis = {scale: d3.scaleTime()}
    yAxis = {scale: d3.scaleLinear()}

    componentDidMount() {
        console.log("DauChart.componentDidMount()");
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

        this.legend = {
            element: this.canvas.element.select(".legend"),
            x: this.canvas.width,
            y: 5
        };
        this.legend.element.attr(
            "transform",
            `translate(${this.legend.x}, ${this.legend.y})`
        );
    }

    componentDidUpdate() {

        const datasetInGroup = (dataset, group) => {
            return dataset.name in group.datasetRegistry;
        };

        const datasetInGroups = (dataset, groups) => {
            return groups.reduce(
                (acc, group) => {
                    return acc && datasetInGroup(dataset, group);
                },
                true
            );
        };

        const datasetsInGroups = (datasets, groups) => {
            return datasets.reduce(
                (acc, dataset) => {
                    return acc && datasetInGroups(dataset, groups);
                },
                true
            );
        };

        if(
            this.props.datasetRegistry !== null
                && datasetsInGroups(this.datasets, this.props.datasetRegistry)
        ) {
            this.draw();
        }
        
    }

    constructor(props) {
	console.log("DauChart.constructor()");
	super(props);

	this.props.registerDatasets(this.datasets);
    }

    draw() {
        console.log("DauChart.draw()");

        // aggregate data
        let data = this.props.datasetRegistry.map(
            group => {
                let datasetRegistry = group.datasetRegistry;
                let dataset = datasetRegistry[dauDataset.name];
                let values = dataset.data.values;
                let x = "date";
                let y = "dau";
                let x_i = dataset.data.headers.indexOf(x);
                let y_i = dataset.data.headers.indexOf(y);
                let newValues = values.reduce(
                    (acc, row) => {
                        let date = row[x_i];
                        let dau = row[y_i];
                        if(!(date in acc)) {
                            acc[[date]] = {date: date, dau: 0};
                        }
                        acc[[date]]["dau"] += dau;
                        return acc;
                    },
                    {}
                );
                return {
                    groupKey: group.groupKey,
                    values: Object.values(newValues)
                };
            }
        );

        let startDate = data.reduce(
            (acc, g) => d3.min([acc, d3.min(g.values, d=>d.date)]),
            null
        );
        let endDate = data.reduce(
            (acc, g) => d3.max([acc, d3.max(g.values, d=>d.date)]),
            null
        );
        this.xAxis.scale.domain([startDate, endDate]);

        let maxDau = data.reduce(
            (acc, g) => d3.max([acc, d3.max(g.values, d=>d.dau)]),
            null
        );
        this.yAxis.scale.domain([0, maxDau]);

        this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

        let plotLine = d3.line()
            .x(d => this.xAxis.scale(d.date))
            .y(d => this.yAxis.scale(d.dau))
            .curve(d3.curveMonotoneX);

        let plotGroups = this.plotArea
            .element
            .selectAll(".plot-group")
            .data(data, d=>d.groupKey)
            .join("g")
            .attr("class", "plot-group");


        const toColour = (d) => {
            if(this.props.colours !== undefined){
                if(d.groupKey in this.props.colours) {
                    return this.props.colours[d.groupKey];
                }
            }
            return "steelblue";
        };
        
        let circles = plotGroups
            .selectAll("circle")
            .data((d, i)=>d.values.map(v=>({...v, groupKey: d.groupKey, index: i})));

        circles
            .enter("circle")
            .append("circle")
            .attr("class", d=>`bar-${d.index}`)
            .attr("cx", d=>this.xAxis.scale(d.date))
            .attr("cy", d=>this.yAxis.scale(d.dau))
            .attr("r", 5)
            .style("fill", toColour);

        circles
            .transition()
            .attr("cx", d=>this.xAxis.scale(d.date))
            .attr("cy", d=>this.yAxis.scale(d.dau))
            .style("fill", toColour);

        circles.exit().remove();

        let mouseOvers = plotGroups.selectAll(".mouse-overs")
            .data(d=>d.values)
            .join("circle")
            .attr("class", "mouse-overs")
            .attr("cx", d=>this.xAxis.scale(d.date))
            .attr("cy", d=>this.yAxis.scale(d.dau))
            .attr("r", 15)
            .on(
                "mouseover",
                d=>{
                    console.log("mouseover");
                    this.props.tooltip.show(
                        `${d.date.toLocaleDateString()}: ${d.dau}`
                    );
                }
            )
            .on("mouseout", d=>this.props.tooltip.hide())
            .style("opacity", 0);

        plotGroups.selectAll(".plot-line")
            .data(data)
            .join("path")
            .attr("class", (d,i)=>`plot-line line-${i}`)
            .style("stroke", toColour)
            .transition()
            .attr("d", d=>plotLine(d.values));

	let legendItems = this.legend.element.selectAll(".legend-item")
	    .data(data, d=>d.groupKey);

        legendItems
            .transition()
            .attr("transform", (d, i)=>`translate(-15, ${i*15})`);
        
        let newLegendItems = legendItems.enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i)=>`translate(-15, ${i*15})`);

        newLegendItems
            .append("rect")
	    .attr("height", 15)
	    .attr("width", 15)
            .attr("class", (d, i)=>`bar-${i}`)
            .style("fill", toColour);

        newLegendItems
            .append("text")
            .html(d=>d.groupKey)
            .attr("dx", -5)
	    .attr("dy", (d, i)=>7.5)
            .attr("alignment-baseline", "middle")
	    .attr("text-anchor", "end");

        legendItems.exit().remove();
        
    }
    
    render() {
	console.log("DauChart.render()");
	return (
	    <div className="container" id="dau-chart-container">
              <h3>DAU</h3>
              <svg className="canvas">
                <g className="plot-area">
                  <g className="x-axis"></g>
                  <g className="y-axis"></g>
                </g>
                <g className="legend"/>
              </svg>
            </div>
	);
    }
}

export default DauChart;


// import * as d3 from "d3";
// import React from "react";


// class DauChart extends React.Component {

//     canvas = {height: 300}
//     title = "DAU Chart"
//     xAxis = {scale: d3.scaleTime()}
//     yAxis = {scale: d3.scaleLinear()}

//     componentDidMount() {
//         console.log("DauChart.componentDidMount()");
        
//         this.container = d3.select("#dau-chart-container");
//         this.canvas.element = this.container.select(".canvas");
//         this.canvas.width = parseInt(this.container.style("width"), 10);
//         this.canvas.element.attr("width", this.canvas.width);
//         this.canvas.element.attr("height", this.canvas.height);
//         this.plotArea = {
//             element: this.container.select(".plot-area"),
//             margins: {left: 50, right: 30, bottom: 50, top: 15}
//         };
//         this.plotArea.width = this.canvas.width
//             - this.plotArea.margins.left
//             - this.plotArea.margins.right;
//         this.plotArea.height = this.canvas.height
//             - this.plotArea.margins.top
//             - this.plotArea.margins.bottom;
//         this.plotArea.element.attr(
//             'transform',
//             `translate(${this.plotArea.margins.left}, ${this.plotArea.margins.top})`
//         );
//         this.xAxis.element = this.container.select(".x-axis");
//         this.yAxis.element = this.container.select(".y-axis");
//         this.xAxis.scale.range([0, this.plotArea.width]);
//         this.yAxis.scale.range([this.plotArea.height, 0]);
//         this.xAxis.element.attr('transform', `translate(0, ${this.plotArea.height})`);

//         if(
//             this.props.data !== null && 
//                 this.props.data !== undefined &&
//                 Object.entries(this.props.data).length
//         ) {
//             this.draw();
//         }
//     }

//     componentDidUpdate() {
//         console.log("DauChart.compenentDidUpdate");
//         if(
//             this.props.data !== null && 
//                 this.props.data !== undefined &&
//                 Object.entries(this.props.data).length
//         ) {
//             this.draw();
//         }
//     }

//     draw() {
//         console.log("DauChart.draw()");
//         console.log(this.props);

//         let groupedData = this.props.groupedData;
//         let data = groupedData.map(
//             group=>{
//                 let datasetRegistry = group.datasetRegistry;
//                 let dataset = datasetRegistry["dau-data"];
//                 let values = dataset.data.values;
//                 values = values.reduce(
//                     (acc, row)=>{
//                         let dateIndex = dataset.headerIndex("date");
//                         let dauIndex = dataset.headerIndex("dau");
//                         let date = row[dateIndex];
//                         let dau = row[dauIndex];
//                         if(acc[[date]] === undefined){
//                             acc[[date]] = 0;
//                         }
//                         acc[[date]] += dau;
//                         return acc;
//                     },
//                     {}
//                 );
//                 return {
//                     groupKey: group.groupKey,
//                     values: Object.keys(values).map(
//                         date=>({date: new Date(date), dau: values[date]})
//                     )
//                 };
//             }
//         );

//         let startDate = data.reduce(
//             (acc, g) => d3.min([acc, d3.min(g.values, d=>d.date)]),
//             null
//         );
//         let endDate = data.reduce(
//             (acc, g) => d3.max([acc, d3.max(g.values, d=>d.date)]),
//             null
//         );
//         this.xAxis.scale.domain([startDate, endDate]);

//         let minDau = data.reduce(
//             (acc, g) => d3.min([acc, d3.min(g.values, d=>d.dau)]),
//             null
//         );
//         let maxDau = data.reduce(
//             (acc, g) => d3.max([acc, d3.max(g.values, d=>d.dau)]),
//             null
//         );
//         this.yAxis.scale.domain([minDau, maxDau]);
//         this.yAxis.scale.domain([minDau, maxDau]);

//         this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
//         this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

//         let plotLine = d3.line()
//             .x(d => this.xAxis.scale(d.date))
//             .y(d => this.yAxis.scale(d.dau))
//             .curve(d3.curveMonotoneX);

//         console.log(data);

//         let plotGroups = this.plotArea
//             .element
//             .selectAll(".plot-group")
//             .data(data, d=>d.groupKey)
//             .join("g")
//             .attr("class", "plot-group");

//         plotGroups
//             .selectAll("circle")
//             .data((d, i)=>d.values.map(v=>({...v, groupKey: d.groupKey, index: i})))
//             .join("circle")
//             .attr("class", d=>`bar-${d.index}`)
//             .attr("r", 5)
//             .on("mouseover", d=>this.props.tooltip.show(`${d.date.toLocaleDateString()}: ${d.dau}`))
//             .on("mouseout", d=>this.props.tooltip.hide())
//             .transition()
//             .attr("cx", d=>this.xAxis.scale(d.date))
//             .attr("cy", d=>this.yAxis.scale(d.dau));

//         plotGroups.selectAll(".plot-line")
//             .data(data)
//             .join("path")
//             .attr("class", (d,i)=>`plot-line line-${i}`)
//             .attr("d", d=>plotLine(d.values));
        
// 	let legend = this.plotArea.element
//             .select(".legend")
// 	    .attr("transform", `translate(${this.plotArea.width}, 0)`);

// 	let legendItems = legend.selectAll(".legend-item")
// 	    .data(data, d=>d.groupKey)
//             .join("g")
//             .attr("class", "legend-item");

//         legendItems.selectAll("rect")
//             .data(data)
//             .join("rect")
// 	    .attr("y", (d, i)=>(i-1)*15)
// 	    .attr("height", 15)
// 	    .attr("width", 15)
//             .attr("class", (d, i)=>`bar-${i}`);

//         legendItems.selectAll("text")
//             .data(data)
//             .join("text")
//             .html(d=>d.groupKey)
// 	    .attr("y", (d, i)=>i*15)
// 	    .attr("dx", "-0.5em")
// 	    .attr("text-anchor", "end");

//     }
        
//     render (){
//         console.log("DauChart.render()");
//         return (
//             <div id="dau-chart-container">
//               <h2>Dau Chart</h2>
//               <svg className="canvas">
//                 <g className="plot-area">
//                   <g className="x-axis">
//                   </g>
//                   <g className="y-axis">
//                   </g>
//                   <g className="legend"/>
//                 </g>
//               </svg>
//             </div>
//         );
//     }
// }

// export default DauChart;
