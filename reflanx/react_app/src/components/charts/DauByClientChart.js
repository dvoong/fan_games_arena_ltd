// import * as d3 from "d3";
// import React from "react";


// class DauByClientChart extends React.Component {
//     canvas = {height: 300}
//     title = "DAU by Tenure Type Chart"
//     xAxis = {scale: d3.scaleLinear()}
//     yAxis = {scale: d3.scaleBand()}

//     componentDidMount() {
//         console.log("DauByClientChart.componentDidMount()");
//         this.container = d3.select("#dau-by-client-chart-container");
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
//         this.chartTitle = this.container.select(".chart-title");
//         this.chartTitle.on("click", e=>this.props.setGroupBy("client"));

//         if(
//             this.props.datasetRegistry !== null && 
//                 this.props.datasetRegistry !== undefined &&
//                 Object.entries(this.props.datasetRegistry).length
//         ) {
//             this.draw();
//         }
//     }

//     componentDidUpdate() {
//         console.log("DauByClientChart.compenentDidUpdate");
//         if(
//             this.props.datasetRegistry !== null && 
//                 this.props.datasetRegistry !== undefined &&
//                 Object.entries(this.props.datasetRegistry).length
//         ) {
//             this.draw();
//         }
//     }

//     draw() {
//         console.log("DauByClientChart.draw()");

//         let datasetRegistry = this.props.datasetRegistry;
//         let dataset = datasetRegistry["dau-data"];
//         // aggregate
//         let data = dataset.data.values.reduce(
//             (acc, row) => {
//                 let clientIndex = dataset.headerIndex("client");
//                 let dauIndex = dataset.headerIndex("dau");
//                 let client = row[clientIndex];
//                 let dau = row[dauIndex];
//                 if(!(client in acc)){
//                     acc[[client]] = {
//                         client: client,
//                         dau: 0
//                     };
//                 }
//                 acc[client].dau += dau;
//                 return acc;
//             },
//             {}
//         );
//         data = Object.values(data);

//         let clients = data.map(d=>d.client);
//         this.yAxis.scale.domain(clients);
//         this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

//         let minDau = 0;
//         let maxDau = d3.max(data, d=>d.dau);
//         this.xAxis.scale.domain([minDau, maxDau]);
//         this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        
//         this.plotArea.element
//             .selectAll("rect")
//             .data(data)
//             .join("rect")
//             // .enter()
//             // .append("rect")
//             .attr(
//                 "class",
//                 (d,i)=>{
//                     let className = `bar bar-${i}`;
//                     console.log(this.props.filters);
//                     let filterIndex = this.props.filters.map(f=>f.variable).indexOf("client");
//                     console.log(filterIndex);
//                     if(filterIndex !== -1) {
//                         let filter = this.props.filters[filterIndex];
//                         console.log("filter");
//                         console.log(d.client);
//                         if(filter.values.indexOf(d.client) === -1) {
//                             className += " muted-row";
//                         }
//                     }
//                     return className;
//                 }
//             )
//             .attr("x", 0)
//             .attr("y", d=>this.yAxis.scale(d.client))
//             .attr("width", d=>this.xAxis.scale(d.dau))
//             .attr("height", d=>this.yAxis.scale.bandwidth())
//             .on("mouseover", d=>this.props.tooltip.show(`${d.dau}`))
//             .on("mouseout", this.props.tooltip.hide())
//             .on("click", d=>this.props.toggleFilter({variable: "client", value: d.client}));
//     }
        
//     render (){
//         console.log("DauByClientChart.render()");
//         return (
//             <div id="dau-by-client-chart-container">
//               <h2 className="chart-title">Dau By Client Chart</h2>
//               <svg className="canvas">
//                 <g className="plot-area">
//                   <g className="x-axis">
//                   </g>
//                   <g className="y-axis">
//                   </g>
//                 </g>
//               </svg>
//             </div>
//         );
//     }
// }

// export default DauByClientChart.js;
