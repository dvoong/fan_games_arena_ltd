import React from 'react';
import ActivationFunnelDashboard from "../../dashboards/ActivationFunnelDashboard";

class ActivationFunnelDashboardComponent extends React.Component {

    componentDidMount() {
	console.log("ActivationFunnelDashboardComponent.componentDidMount()");
        console.log("ActivationFunnelDashboard");
        this.dashboard = new ActivationFunnelDashboard(
	    "activation-funnel-dashboard",
	    this.props.data
	);
        this.dashboard.draw();
    }
    
    render() {
	return <div className="dashboard" id="activation-funnel-dashboard"/>;
    }
}

export default ActivationFunnelDashboardComponent;
