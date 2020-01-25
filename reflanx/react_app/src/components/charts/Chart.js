import React from "react";

class Chart extends React.Component {

    container = {}
    canvas = {height: 300}
    xAxis = {}
    yAxis = {}
    legend = {}

    componentDidMount() {
        console.log("Chart.componentDidMount");
        this.props.registerDatasets(this.datasets);
    }
    
    render() {
        return "Chart";
    }
}

export default Chart;
