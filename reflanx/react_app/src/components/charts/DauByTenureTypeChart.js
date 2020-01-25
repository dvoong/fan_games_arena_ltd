// import * as d3 from "d3";
// import React from "react";


// class DauByTenureTypeChart extends React.Component {
//     canvas = {height: 300}
//     title = "DAU by Tenure Type Chart"
//     xAxis = {scale: d3.scaleLinear()}
//     yAxis = {scale: d3.scaleBand()}

//     componentDidMount() {
//         console.log("DauByTenureTypeChart.componentDidMount()");
//         this.container = d3.select("#dau-by-tenure-type-chart-container");
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
//         this.chartTitle.on("click", e=>this.props.setGroupBy("tenureType"));

//         if(
//             this.props.datasetRegistry !== null && 
//                 this.props.datasetRegistry !== undefined &&
//                 Object.entries(this.props.datasetRegistry).length
//         ) {
//             this.draw();
//         }
//     }

//     componentDidUpdate() {
//         console.log("DauByTenureTypeChart.compenentDidUpdate");
//         if(
//             this.props.datasetRegistry !== null && 
//                 this.props.datasetRegistry !== undefined &&
//                 Object.entries(this.props.datasetRegistry).length
//         ) {
//             this.draw();
//         }
//     }

//     draw() {
//         console.log("DauByTenureTypeChart.draw()");

//         let datasetRegistry = this.props.datasetRegistry;
//         let dataset = datasetRegistry["dau-data"];
//         // aggregate
//         let data = dataset.data.values.reduce(
//             (acc, row) => {
//                 let tenureTypeIndex = dataset.headerIndex("tenureType");
//                 let dauIndex = dataset.headerIndex("dau");
//                 let tenureType = row[tenureTypeIndex];
//                 let dau = row[dauIndex];
//                 if(!(tenureType in acc)){
//                     acc[[tenureType]] = {
//                         tenureType: tenureType,
//                         dau: 0
//                     };
//                 }
//                 acc[tenureType].dau += dau;
//                 return acc;
//             },
//             {}
//         );
//         data = Object.values(data);

//         let tenureTypes = data.map(d=>d.tenureType);
//         this.yAxis.scale.domain(tenureTypes);
//         this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

//         let minDau = 0;
//         let maxDau = d3.max(data, d=>d.dau);
//         this.xAxis.scale.domain([minDau, maxDau]);
//         this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        
//         this.plotArea.element
//             .selectAll("rect")
//             .data(data)
//             .join("rect")
//             .attr(
//                 "class",
//                 (d,i)=>{
//                     let className = `bar bar-${i}`;
//                     let filterIndex = this.props.filters.map(f=>f.variable).indexOf("tenureType");
//                     if(filterIndex !== -1) {
//                         let filter = this.props.filters[filterIndex];
//                         if(filter.values.indexOf(d.tenureType) === -1) {
//                             className += " muted-row";
//                         }
//                     }
//                     return className;
//                 }
//             )
//             .attr("x", 0)
//             .attr("y", d=>this.yAxis.scale(d.tenureType))
//             .attr("width", d=>this.xAxis.scale(d.dau))
//             .attr("height", d=>this.yAxis.scale.bandwidth())
//             .on("mouseover", d=>this.props.tooltip.show(`${d.dau}`))
//             .on("mouseout", this.props.tooltip.hide())
//             .on("click", d=>this.props.toggleFilter({variable: "tenureType", value: d.tenureType}));
//     }
        
//     render (){
//         console.log("DauByTenureTypeChart.render()");
//         return (
//             <div id="dau-by-tenure-type-chart-container">
//               <h2 className="chart-title">Dau By Tenure Type Chart</h2>
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

// export default DauByTenureTypeChart;
