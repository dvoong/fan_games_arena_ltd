import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import { Route, Redirect, BrowserRouter as Router } from "react-router-dom";

import './App2.css';
import LoginForm from "./components2/Login";
import Navbar from "./components2/Navbar";
import ActivationFunnelDashboard from "./components2/ActivationFunnelDashboard";

import * as d3 from "d3";


class DauChart extends React.Component {

    canvas = {height: 300}
    title = "DAU Chart"
    xAxis = {scale: d3.scaleTime()}
    yAxis = {scale: d3.scaleLinear()}

    componentDidMount() {
        console.log("DauChart.componentDidMount()");
        
        this.container = d3.select("#dau-chart-container");
        this.canvas.element = this.container.select(".canvas");
        this.canvas.width = parseInt(this.container.style("width"), 10);
        this.canvas.element.attr("width", this.canvas.width);
        this.canvas.element.attr("height", this.canvas.height);
        this.plotArea = {
            element: this.container.select(".plot-area"),
            margins: {left: 50, right: 30, bottom: 50, top: 15}
        };
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
        this.xAxis.element = this.container.select(".x-axis");
        this.yAxis.element = this.container.select(".y-axis");
        this.xAxis.scale.range([0, this.plotArea.width]);
        this.yAxis.scale.range([this.plotArea.height, 0]);
        this.xAxis.element.attr('transform', `translate(0, ${this.plotArea.height})`);

        if(
            this.props.data !== null && 
                this.props.data !== undefined &&
                Object.entries(this.props.data).length
        ) {
            this.draw();
        }
    }

    componentDidUpdate() {
        console.log("DauChart.compenentDidUpdate");
        if(
            this.props.data !== null && 
                this.props.data !== undefined &&
                Object.entries(this.props.data).length
        ) {
            this.draw();
        }
    }

    draw() {
        console.log("DauChart.draw()");
        console.log(this.props);

        let groupedData = this.props.groupedData;
        let data = groupedData.map(
            group=>{
                let datasetRegistry = group.datasetRegistry;
                let dataset = datasetRegistry["dau-data"];
                let values = dataset.data.values;
                values = values.reduce(
                    (acc, row)=>{
                        let dateIndex = dataset.headerIndex("date");
                        let dauIndex = dataset.headerIndex("dau");
                        let date = row[dateIndex];
                        let dau = row[dauIndex];
                        if(acc[[date]] === undefined){
                            acc[[date]] = 0;
                        }
                        acc[[date]] += dau;
                        return acc;
                    },
                    {}
                );
                return {
                    groupKey: group.groupKey,
                    values: Object.keys(values).map(
                        date=>({date: new Date(date), dau: values[date]})
                    )
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

        let minDau = data.reduce(
            (acc, g) => d3.min([acc, d3.min(g.values, d=>d.dau)]),
            null
        );
        let maxDau = data.reduce(
            (acc, g) => d3.max([acc, d3.max(g.values, d=>d.dau)]),
            null
        );
        this.yAxis.scale.domain([minDau, maxDau]);
        this.yAxis.scale.domain([minDau, maxDau]);

        this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

        let plotLine = d3.line()
            .x(d => this.xAxis.scale(d.date))
            .y(d => this.yAxis.scale(d.dau))
            .curve(d3.curveMonotoneX);

        console.log(data);

        let plotGroups = this.plotArea
            .element
            .selectAll(".plot-group")
            .data(data, d=>d.groupKey)
            .join("g")
            .attr("class", "plot-group");

        plotGroups
            .selectAll("circle")
            .data((d, i)=>d.values.map(v=>({...v, groupKey: d.groupKey, index: i})))
            .join("circle")
            .attr("class", d=>`bar-${d.index}`)
            .attr("r", 5)
            .on("mouseover", d=>this.props.tooltip.show(`${d.date.toLocaleDateString()}: ${d.dau}`))
            .on("mouseout", d=>this.props.tooltip.hide())
            .transition()
            .attr("cx", d=>this.xAxis.scale(d.date))
            .attr("cy", d=>this.yAxis.scale(d.dau));

        plotGroups.selectAll(".plot-line")
            .data(data)
            .join("path")
            .attr("class", (d,i)=>`plot-line line-${i}`)
            .attr("d", d=>plotLine(d.values));
        
	let legend = this.plotArea.element
            .select(".legend")
	    .attr("transform", `translate(${this.plotArea.width}, 0)`);

	let legendItems = legend.selectAll(".legend-item")
	    .data(data, d=>d.groupKey)
            .join("g")
            .attr("class", "legend-item");

        legendItems.selectAll("rect")
            .data(data)
            .join("rect")
	    .attr("y", (d, i)=>(i-1)*15)
	    .attr("height", 15)
	    .attr("width", 15)
            .attr("class", (d, i)=>`bar-${i}`);

        legendItems.selectAll("text")
            .data(data)
            .join("text")
            .html(d=>d.groupKey)
	    .attr("y", (d, i)=>i*15)
	    .attr("dx", "-0.5em")
	    .attr("text-anchor", "end");

    }
        
    render (){
        console.log("DauChart.render()");
        return (
            <div id="dau-chart-container">
              <h2>Dau Chart</h2>
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

class DauByTenureTypeChart extends React.Component {
    canvas = {height: 300}
    title = "DAU by Tenure Type Chart"
    xAxis = {scale: d3.scaleLinear()}
    yAxis = {scale: d3.scaleBand()}

    componentDidMount() {
        console.log("DauByTenureTypeChart.componentDidMount()");
        this.container = d3.select("#dau-by-tenure-type-chart-container");
        this.canvas.element = this.container.select(".canvas");
        this.canvas.width = parseInt(this.container.style("width"), 10);
        this.canvas.element.attr("width", this.canvas.width);
        this.canvas.element.attr("height", this.canvas.height);
        this.plotArea = {
            element: this.container.select(".plot-area"),
            margins: {left: 50, right: 30, bottom: 50, top: 15}
        };
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
        this.xAxis.element = this.container.select(".x-axis");
        this.yAxis.element = this.container.select(".y-axis");
        this.xAxis.scale.range([0, this.plotArea.width]);
        this.yAxis.scale.range([this.plotArea.height, 0]);
        this.xAxis.element.attr('transform', `translate(0, ${this.plotArea.height})`);
        this.chartTitle = this.container.select(".chart-title");
        this.chartTitle.on("click", e=>this.props.setGroupBy("tenureType"));

        if(
            this.props.datasetRegistry !== null && 
                this.props.datasetRegistry !== undefined &&
                Object.entries(this.props.datasetRegistry).length
        ) {
            this.draw();
        }
    }

    componentDidUpdate() {
        console.log("DauByTenureTypeChart.compenentDidUpdate");
        if(
            this.props.datasetRegistry !== null && 
                this.props.datasetRegistry !== undefined &&
                Object.entries(this.props.datasetRegistry).length
        ) {
            this.draw();
        }
    }

    draw() {
        console.log("DauByTenureTypeChart.draw()");

        let datasetRegistry = this.props.datasetRegistry;
        let dataset = datasetRegistry["dau-data"];
        // aggregate
        let data = dataset.data.values.reduce(
            (acc, row) => {
                let tenureTypeIndex = dataset.headerIndex("tenureType");
                let dauIndex = dataset.headerIndex("dau");
                let tenureType = row[tenureTypeIndex];
                let dau = row[dauIndex];
                if(!(tenureType in acc)){
                    acc[[tenureType]] = {
                        tenureType: tenureType,
                        dau: 0
                    };
                }
                acc[tenureType].dau += dau;
                return acc;
            },
            {}
        );
        data = Object.values(data);

        let tenureTypes = data.map(d=>d.tenureType);
        this.yAxis.scale.domain(tenureTypes);
        this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

        let minDau = 0;
        let maxDau = d3.max(data, d=>d.dau);
        this.xAxis.scale.domain([minDau, maxDau]);
        this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        
        this.plotArea.element
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr(
                "class",
                (d,i)=>{
                    let className = `bar bar-${i}`;
                    let filterIndex = this.props.filters.map(f=>f.variable).indexOf("tenureType");
                    if(filterIndex !== -1) {
                        let filter = this.props.filters[filterIndex];
                        if(filter.values.indexOf(d.tenureType) === -1) {
                            className += " muted-row";
                        }
                    }
                    return className;
                }
            )
            .attr("x", 0)
            .attr("y", d=>this.yAxis.scale(d.tenureType))
            .attr("width", d=>this.xAxis.scale(d.dau))
            .attr("height", d=>this.yAxis.scale.bandwidth())
            .on("mouseover", d=>this.props.tooltip.show(`${d.dau}`))
            .on("mouseout", this.props.tooltip.hide())
            .on("click", d=>this.props.toggleFilter({variable: "tenureType", value: d.tenureType}));
    }
        
    render (){
        console.log("DauByTenureTypeChart.render()");
        return (
            <div id="dau-by-tenure-type-chart-container">
              <h2 className="chart-title">Dau By Tenure Type Chart</h2>
              <svg className="canvas">
                <g className="plot-area">
                  <g className="x-axis">
                  </g>
                  <g className="y-axis">
                  </g>
                </g>
              </svg>
            </div>
        );
    }
}

class DauByClientChart extends React.Component {
    canvas = {height: 300}
    title = "DAU by Tenure Type Chart"
    xAxis = {scale: d3.scaleLinear()}
    yAxis = {scale: d3.scaleBand()}

    componentDidMount() {
        console.log("DauByClientChart.componentDidMount()");
        this.container = d3.select("#dau-by-client-chart-container");
        this.canvas.element = this.container.select(".canvas");
        this.canvas.width = parseInt(this.container.style("width"), 10);
        this.canvas.element.attr("width", this.canvas.width);
        this.canvas.element.attr("height", this.canvas.height);
        this.plotArea = {
            element: this.container.select(".plot-area"),
            margins: {left: 50, right: 30, bottom: 50, top: 15}
        };
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
        this.xAxis.element = this.container.select(".x-axis");
        this.yAxis.element = this.container.select(".y-axis");
        this.xAxis.scale.range([0, this.plotArea.width]);
        this.yAxis.scale.range([this.plotArea.height, 0]);
        this.xAxis.element.attr('transform', `translate(0, ${this.plotArea.height})`);
        this.chartTitle = this.container.select(".chart-title");
        this.chartTitle.on("click", e=>this.props.setGroupBy("client"));

        if(
            this.props.datasetRegistry !== null && 
                this.props.datasetRegistry !== undefined &&
                Object.entries(this.props.datasetRegistry).length
        ) {
            this.draw();
        }
    }

    componentDidUpdate() {
        console.log("DauByClientChart.compenentDidUpdate");
        if(
            this.props.datasetRegistry !== null && 
                this.props.datasetRegistry !== undefined &&
                Object.entries(this.props.datasetRegistry).length
        ) {
            this.draw();
        }
    }

    draw() {
        console.log("DauByClientChart.draw()");

        let datasetRegistry = this.props.datasetRegistry;
        let dataset = datasetRegistry["dau-data"];
        // aggregate
        let data = dataset.data.values.reduce(
            (acc, row) => {
                let clientIndex = dataset.headerIndex("client");
                let dauIndex = dataset.headerIndex("dau");
                let client = row[clientIndex];
                let dau = row[dauIndex];
                if(!(client in acc)){
                    acc[[client]] = {
                        client: client,
                        dau: 0
                    };
                }
                acc[client].dau += dau;
                return acc;
            },
            {}
        );
        data = Object.values(data);

        let clients = data.map(d=>d.client);
        this.yAxis.scale.domain(clients);
        this.yAxis.element.transition().call(d3.axisLeft(this.yAxis.scale));

        let minDau = 0;
        let maxDau = d3.max(data, d=>d.dau);
        this.xAxis.scale.domain([minDau, maxDau]);
        this.xAxis.element.transition().call(d3.axisBottom(this.xAxis.scale));
        
        this.plotArea.element
            .selectAll("rect")
            .data(data)
            .join("rect")
            // .enter()
            // .append("rect")
            .attr(
                "class",
                (d,i)=>{
                    let className = `bar bar-${i}`;
                    console.log(this.props.filters);
                    let filterIndex = this.props.filters.map(f=>f.variable).indexOf("client");
                    console.log(filterIndex);
                    if(filterIndex !== -1) {
                        let filter = this.props.filters[filterIndex];
                        console.log("filter");
                        console.log(d.client);
                        if(filter.values.indexOf(d.client) === -1) {
                            className += " muted-row";
                        }
                    }
                    return className;
                }
            )
            .attr("x", 0)
            .attr("y", d=>this.yAxis.scale(d.client))
            .attr("width", d=>this.xAxis.scale(d.dau))
            .attr("height", d=>this.yAxis.scale.bandwidth())
            .on("mouseover", d=>this.props.tooltip.show(`${d.dau}`))
            .on("mouseout", this.props.tooltip.hide())
            .on("click", d=>this.props.toggleFilter({variable: "client", value: d.client}));
    }
        
    render (){
        console.log("DauByClientChart.render()");
        return (
            <div id="dau-by-client-chart-container">
              <h2 className="chart-title">Dau By Client Chart</h2>
              <svg className="canvas">
                <g className="plot-area">
                  <g className="x-axis">
                  </g>
                  <g className="y-axis">
                  </g>
                </g>
              </svg>
            </div>
        );
    }
}


class Dataset {

    name = "dataset"
    apiEndpoint = null
    datetimeVariables = []

    constructor(data) {
        if(data !== undefined){
            this.data = this.processData(data);
        }
    }

    getDataset(){
        console.log(`Dataset.getDataset(${this.name})`);
        return axios.get(this.apiEndpoint)
            .then(
                response=>{
                    this.data = response.data;
                    this.data = this.processData(response.data);
                    return this;
                }
            )
            .catch(error=>console.log(error));
    };

    headers() {
        return this.data.headers;
    }

    headerIndex(header) {
        return this.data.headers.indexOf(header);
    }

    processData(data){
        let newData = {...data};
        let filterIndices = this.datetimeVariables.map(v=>this.headerIndex(v));
        data.values.map(
            (d, rowNumber) => {
                this.datetimeVariables.map(
                    (v, i) => {
                        newData.values[rowNumber][filterIndices[i]] = new Date(
                            data.values[rowNumber][filterIndices[i]]
                        );
                        return null;
                    }
                );
                return null;
            }
        );
        return newData;
    }

    values(variable) {
        if(variable === undefined){
            return this.data.values;
        } else {
            return this.data.values.map(d=>d[this.headerIndex(variable)]);
        }
    };
    
}

class DauDataset extends Dataset {
    name = "dau-data";
    apiEndpoint = "/api/get-dashboard-data/dau";
    datetimeVariables = ["analysisTime", "date"];

    filter(variable, value) {
        let index = this.headerIndex(variable);
        let filteredValues = this.data.values.filter(
            row=>{
                return row[index] === value;
            }
        );
        let filteredData = {...this.data, values: filteredValues};
        let filteredDataset = new DauDataset(filteredData);
        return filteredDataset;
    }
}

class Tooltip {
    
    hide = () => {
        console.log("Tooltip.hide");
        let element = d3.select(".tooltip");
        element.style("opacity", 0);
    }
    
    show = (data) => {
        console.log("Tooltip.show");
        let element = d3.select(".tooltip");        
        element
            .html(data)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px")
    	    .style("opacity", 0.9);
    }
}


class DauDashboard extends React.Component {

    datasets = [new DauDataset()]
    state = {
        filters: [],
        groupby: null,
    };
    
    constructor(props) {
        super(props);

        this.setGroupBy = this.setGroupBy.bind(this);
        this.toggleFilter = this.toggleFilter.bind(this);
        this.tooltip = new Tooltip();

        // get data based on what the groupby is
        this.datasets.map(
            d => {
                if(!(d.name in this.props.data)){
                    this.props.getDataset(d);
                }
                return null;
            }
        );
    }

    filterDataset(dataset, filters) {
        console.log("DauDashboard.filterDataset");
        console.log(dataset);
        if(dataset === undefined){
            return undefined;
        }
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

        let data = {...dataset.data, values: filteredValues};

        dataset = new DauDataset(data);
        return dataset;
    }

    getFilteredDatasets(data, filters) {
        console.log("DauDashboard.getFilteredDatasets");
        let filteredData = this.datasets.reduce(
            (acc, ds) => {
                if(ds.name in data) {
                    acc[[ds.name]] = this.filterDataset(data[[ds.name]], filters);
                }
                return acc;
            },
            {}
        );

        return filteredData;
    }

    groupDatasets(datasetRegistry, groupby){

        if(groupby === null) {
            return [{groupKey: "all", datasetRegistry}];
        }
        
        let datasetNames = Object.keys(datasetRegistry);

        let groupKeys = datasetNames.reduce(
            (accGroups, datasetName) => {
                let dataset = datasetRegistry[[datasetName]];
                dataset.values(groupby).reduce(
                    (accValues, value) => {
                        if(value !== undefined){
                            accGroups[[value]] = true;
                        }
                        return null;
                    },
                    {}
                );
                return accGroups;
            },
            {}
        );
        groupKeys = Object.keys(groupKeys);
        
        let groupedDatasetRegistry = groupKeys.map(
            groupKey => {
                let filteredDatasetRegistry = datasetNames.reduce(
                    (acc, datasetName) => {
                        let dataset = datasetRegistry[[datasetName]];
                        let filteredDataset = dataset.filter(groupby, groupKey);
                        acc[[datasetName]] = filteredDataset;
                        return acc;
                    },
                    {}
                );
                return {groupKey: groupKey, datasetRegistry: filteredDatasetRegistry};
            }
        );

        return groupedDatasetRegistry;
    }

    render() {
        console.log("DauDashboard.render()");
        console.log(this.state);
        console.log(this.props.data);
        const filteredDatasets = this.getFilteredDatasets(this.props.data, this.state.filters);
        const groupedDatasets = this.groupDatasets(filteredDatasets, this.state.groupby);

        return (
            <div className="container dashboard-container" id="dashboard-container">
              <div className="row">
                <div className="col-12">
                  <DauChart
                    data={filteredDatasets}
                    groupedData={groupedDatasets}
                    tooltip={this.tooltip}
                  />
                </div>
              </div>

              <div className="row">
                
                <div className="col-md-6">
                  <DauByTenureTypeChart
                    datasetRegistry={this.props.data}
                    filters={this.state.filters}
                    toggleFilter={this.toggleFilter}
                    setGroupBy={this.setGroupBy}
                    tooltip={this.tooltip}
                  />
                </div>
                
                <div className="col-md-6">
                  <DauByClientChart
                    datasetRegistry={this.props.data}
                    filters={this.state.filters}
                    toggleFilter={this.toggleFilter}
                    setGroupBy={this.setGroupBy}
                    tooltip={this.tooltip}
                  />
                </div>
                
              </div>
              
              <div className="tooltip" styles="opacity: 0"/>
            </div>
        );
    }

    setGroupBy(groupby) {
        console.log("DauDashboard.setGroupBy");
        this.setState({groupby: groupby});
    }

    toggleFilter({variable, value}) {
        console.log("toggleFilter");
        
        let filters = this.state.filters;
        let filterIndex = filters.map(f=>f.variable).indexOf(variable);
        if(filterIndex !== -1) {
            let filter = filters[filterIndex];
            let values = filter.values;
            let valueIndex = values.indexOf(value);
            if(valueIndex !== -1){
                values = values.filter(v=>v!==value);
            } else {
                values = [...values, value];
            }
            filter = {...filter, values: values};
            filters[filterIndex] = filter;
        } else {
            let filter = {variable: variable, values: [value]};
            filters = [...filters, filter];
        }
        this.setState({filters: filters});
    }
};


const LoadingScreen = ({loading}) => {
    return loading ? <div>Loading...</div> : "";
};

class App extends React.Component {

    constructor(props) {
        super(props);
        let url = window.location.href.replace(/^(?:\/\/|[^]+)*\//, "");
        let match = url.match(/(?<=dashboards\/).+/);
        let dashboardName = match ? match[0] : null;
        
        this.dashboards = {
            dau: {
                title: "DAU",
                component: DauDashboard
            },
            "activation-funnel": {
                title: "Activation Funnel",
                component: ActivationFunnelDashboard
            },
            // revenue: {
            //     title: "Revenu",
            //     component: RevenueDashboard
            // },
        };

        let dashboard = null; 
        if(dashboardName !== null) {
            dashboard = this.dashboards[dashboardName];
            if(dashboard === undefined) {
                dashboard = {
                    title: "",
                    component: <div>Unrecognised dashboard: {dashboardName}</div>
                };
            }
        }
        
        this.state = {
            csrftoken: null,
            data: {},
            dashboard: dashboard,
            isLoggedIn: false,
            loading: true,
        };

        this.getDataset = this.getDataset.bind(this);
        this.setDashboard = this.setDashboard.bind(this);
        this.setLoading = this.setLoading.bind(this);
        this.setLoginStatus = this.setLoginStatus.bind(this);

        this.checkLoginStatus();
    }

    checkLoginStatus() {
        this.setLoading(true);
        return axios.get("/api/check-login-status")
            .then(
                response => {
                    let csrftoken = response.data.csrftoken;
                    axios.defaults.headers.common['X-CSRFTOKEN'] = csrftoken;
                    this.setLoginStatus(response.data.loginStatus === "logged in");
                }
            ).catch(
                error => this.setLoginStatus(false)
            ).finally(()=>this.setLoading(false));
    }

    getDataset(dataset) {
        console.log("App.getDataset()");
        if(dataset.name in this.state.data) {
            return this.state.data[[dataset.name]];
        } else {
            return dataset.getDataset().then(
                (data)=>{
                    let newData = {...this.state.data, [dataset.name]: data};
                    this.setState({data: newData});
                }
            );
        }
    }
    
    setDashboard(dashboardName) {
        let dashboard = this.dashboards[dashboardName];
        this.setState({dashboard: dashboard});
    }
    
    setLoading(loading) {
        this.setState({loading: loading});
    }
    
    setLoginStatus(isLoggedIn){
        this.setState({isLoggedIn: isLoggedIn});
    }

    render() {
        console.log("App.render()");
        console.log(this.state);

        let loadingComponent = <LoadingScreen loading={this.state.loading}/>;

        let navbar = (
            <Navbar
              dashboard={this.state.dashboard}
              isLoggedIn={this.state.isLoggedIn}
              setDashboard={this.setDashboard}
              setLoginStatus={this.setLoginStatus}
            />
        );
        
        if(this.state.loading && this.state.isLoggedIn !== true) {
            return (
                <div>
                  {navbar}
                  {loadingComponent}
                </div>
            );
        }
        
        let mainComponent = "";
        
        if(this.state.isLoggedIn === false){
            mainComponent = (
                <LoginForm
                  csrftoken={this.state.csrftoken}
                  setLoading={this.setLoading}
                  setLoginStatus={this.setLoginStatus}
                />
            );
        } else {
            if(this.state.dashboard !== null){
                mainComponent = React.createElement(
                    this.state.dashboard.component,
                    {data: this.state.data, getDataset: this.getDataset}
                );
            }
        }

        return (
            <Router>
              <Route path="/login">
                {this.state.isLoggedIn ? <Redirect to="/" /> : <LoginForm />}
              </Route>
              
              {navbar}
              {loadingComponent}
              {mainComponent}
            </Router>
        );
    }
}

export default App;
