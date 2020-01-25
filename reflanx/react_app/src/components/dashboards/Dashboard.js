import React from "react";

class Dashboard extends React.Component {

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
    
}

export default Dashboard;
