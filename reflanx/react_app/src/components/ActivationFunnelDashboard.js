import React from "react";
import * as d3 from "d3";
import ActivationFunnel from "../datasets/ActivationFunnel";
import Dashboard from "./Dashboard";


class ActivationFunnelChart extends React.Component {

    componentDidMount() {
        let id = `activation-funnel-chart-container-${this.props.dataset.groupKey}`;        
        this.container = {
            element: d3.select(`#${id}`)
        };
        this.container.width = parseInt(this.container.element.style("width"), 10);
        this.canvas = {
            element: this.container.element.select(".canvas"),
            height: 300,
            margins: {
                left: 30,
                top: 15,
                right: 50,
                bottom: 50,
            },
            width: this.container.width,
        };
        this.canvas.element.attr("width", this.canvas.width);
        this.canvas.element.attr("height", this.canvas.height);
        this.plotArea = {
            element: this.canvas.element.select(".plot-area"),
            height: this.canvas.height
                - this.canvas.margins.bottom
                - this.canvas.margins.top,
            width: this.canvas.width
                - this.canvas.margins.left
                - this.canvas.margins.right,
            x: this.canvas.margins.left,
            y: this.canvas.margins.top,
        };
        this.plotArea.element.attr(
            "transform",
            `translate(${this.plotArea.x}, ${this.plotArea.y})`
        );
        
        this.xAxis = {
            element: this.plotArea.element.select(".x-axis"),
            scale: d3.scaleTime().range([0, this.plotArea.width]),
            x: 0,
            y: this.plotArea.height
        };
        this.xAxis.element.attr(
            "transform",
            `translate(${this.xAxis.x}, ${this.xAxis.y})`
        );
        
        this.yAxis = {
            element: this.plotArea.element.select(".y-axis"),
            scale: d3.scaleLinear().range([this.plotArea.height, 0]),
            x: 0,
            y: 0,
        };
        this.yAxis.element.attr(
            "transform",
            `translate(${this.yAxis.x}, ${this.yAxis.y})`
        );
        this.draw();
    }

    componentDidUpdate() {
        this.draw();
    }

    draw() {
        console.log("ActivationFunnelChart.draw()");
        // aggregate data
        console.log(this.props.dataset);
        console.log(this.props.groupby);
        if(this.props.groupby === "client") {
            let subgroup = "action";
            let data = this.props.dataset.datasetRegistry["activation-funnel"];
            let groupKeys = data.values(subgroup).reduce(
                (acc, d) => {
                    acc[[d]] = d;
                    return acc;
                },
                {}
            );
            groupKeys = Object.values(groupKeys);

            let groupedData = groupKeys.map(
                groupKey => {
                    console.log("groupKey");
                    console.log(groupKey);
                    console.log("data");
                    console.log(data);
                    let filteredData = {
                        groupKey: groupKey,
                        data: data.filter(subgroup, groupKey)
                    };
                    console.log("filteredData");
                    console.log(filteredData);
                    return filteredData;
                }
            );

            console.log(groupedData);
        }
    }
    
    render() {
        console.log("ActivationFunnelChart.render");
        let id = `activation-funnel-chart-container-${this.props.dataset.groupKey}`;
        return (
            <div id={id}>
              <h3>{this.props.dataset.groupKey}</h3>
              <svg className="canvas">
                <g className="plot-area">
                  <g className="x-axis">
                  </g>
                  <g className="y-axis">
                  </g>
                  <g className="legend"/>
                </g>
              </svg>
            </div>
        );
    }
}


class ActivationFunnelCharts extends React.Component {

    datasets = [new ActivationFunnel()]
    
    componentDidMount() {
        this.datasets.forEach(d=>this.props.getDataset(d));
    }

    render() {
        console.log("ActivationFunnelCharts.render()");
        let dataLoaded = this.props.groupedDatasetRegistry !== undefined
            && this.props.groupedDatasetRegistry.length > 0
            && this.datasets.reduce(
                (acc, d) => acc
                    && (d.name in this.props
                        .groupedDatasetRegistry[0]["datasetRegistry"]),
                true
            );

        console.log(this.props.groupedDatasetRegistry);
        console.log(dataLoaded);

        if(!dataLoaded) {
            return "";
        } else {
            return (
                <div>
                  {
                      this.props.groupedDatasetRegistry.map(
                          g=> {
                              return <ActivationFunnelChart
                                       dataset={g}
                                       groupby={this.props.groupby}
                                       key={g.groupKey}
                                     />;
                          }
                      )
                  }
                </div>            
            );
        }
    }
}


class ActivationFunnelDashboard extends Dashboard {

    constructor(props) {
        super(props);
        this.state = {
            filters: [],
            groupby: "client"
        };
        this.getDataset = props.getDataset;
    }

    filterDataset(dataset, filters) {
        console.log("ActivationFunnelDashboard.filterDataset");
        console.log(dataset);

        let filteredValues = dataset.data.values.filter(
            row => {
                return filters.reduce(
                    (accFilters, f) => {
                        let variableIndex = dataset.headerIndex(f.variable);
                        let passesFilter = f.values.reduce(
                            (accFilterValues, fv) => {
                                let matchesValue =  row[variableIndex] === fv;
                                return accFilterValues || matchesValue;
                            },
                            false
                        );
                        return passesFilter && accFilters;
                    },
                    true
                );
            }
        );

        console.log(filteredValues);
        let data = {...dataset.data, values: filteredValues};
        //dataset = {...dataset, data_: data};
        console.log(data);
        dataset = new ActivationFunnel(data);
        console.log(dataset);
        return dataset;
    }

    render() {
        console.log("ActivationFunnelDashboard.render()");
        console.log(this.props);

        let filteredDatasetRegistry = this.filterDatasetRegistry(
            this.props.data,
            this.state.filters
        );

        console.log(filteredDatasetRegistry);

        let groupedDatasetRegistry = this.groupDatasetRegistry(
            filteredDatasetRegistry,
            this.state.groupby
        );

        console.log(groupedDatasetRegistry);
        
        return (
            <div>
              <ActivationFunnelCharts
                groupby={this.state.groupby}
                groupedDatasetRegistry={groupedDatasetRegistry}
                getDataset={this.props.getDataset}
              />
              {/* <EventActionsChart getDataset={this.props.getDataset}/> */}
              {/* <ClientEventsChart getDataset={this.props.getDataset}/> */}
            </div>
        );
    }
};

export default ActivationFunnelDashboard;
