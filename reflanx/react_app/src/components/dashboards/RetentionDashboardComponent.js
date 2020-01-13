import React from 'react';
import RetentionDashboard from "../../dashboards/RetentionDashboard";

class RetentionDashboardComponent extends React.Component {

    componentDidMount() {
	console.log("RetentionDashboardComponent.componentDidMount()");
        console.log("RetentionDashboard");
	console.log("props");
	console.log(this.props);
        console.log(RetentionDashboard);
        this.dashboard = new RetentionDashboard("retention-dashboard", this.props.data);
        this.dashboard.draw();
    }
    
    render() {
	return <div className="dashboard" id="retention-dashboard"/>;
    }
}

export default RetentionDashboardComponent;
