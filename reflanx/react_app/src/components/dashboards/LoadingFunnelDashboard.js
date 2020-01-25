import React from "react";

import Dashboard from "./Dashboard";
import LoadingFunnelChart from "../charts/LoadingFunnelChart";
import Tooltip from "../Tooltip";

class LoadingFunnelDashboard extends Dashboard {

    datasets = [];
    name = "loading-funnel"
    state = {
        showTooltip: false,
    }

    containerId = `${this.name}-dashboard`
    
    componentDidMount() {
        console.log("LoadingFunnelDashboard.componentDidMount");
        this.props.getDatasets(this.datasets);
    }

    constructor(props) {
        super(props);
        this.registerDatasets = this.registerDatasets.bind(this);
    }
    
    registerDatasets(datasets) {
        console.log("Dashboard.registerDatasets()");
        console.log(datasets);
        console.log(this.datasets);
        console.log(this.datasets.length);
        console.log(datasets);
        console.log(this.datasets);
        console.log(this.datasets.length);
        datasets.forEach(
            dataset=>this.datasets.find(d=>d === dataset) === undefined
                ? this.datasets.push(dataset)
                : null
        );
        console.log(this.datasets);
        console.log(this.datasets.length);
    }

    render() {
        return (
            <div id={this.containerId}>
              <Tooltip show={this.state.showTooltip} />
              <LoadingFunnelChart
                datasetRegistry={this.props.datasetRegistry}
                registerDatasets={this.registerDatasets}
                setShowTooltip={this.setShowTooltip} />
            </div>
        );
    }
}

export default LoadingFunnelDashboard;
