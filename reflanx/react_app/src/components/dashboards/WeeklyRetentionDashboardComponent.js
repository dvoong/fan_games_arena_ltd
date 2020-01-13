import React from 'react';
import WeeklyRetentionDashboard from "../../dashboards/WeeklyRetentionDashboard";

class WeeklyRetentionDashboardComponent extends React.Component {

    componentDidMount() {
	console.log("WeeklyRetentionDashboardComponent.componentDidMount()");
        console.log("WeeklyRetentionDashboard");
        this.dashboard = new WeeklyRetentionDashboard("retention-dashboard", this.props.data);
        this.dashboard.draw();
    }
    
    render() {
	return <div className="dashboard" id="retention-dashboard"/>;
    }
}

export default WeeklyRetentionDashboardComponent;
