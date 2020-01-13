import React from 'react';

class DashboardComponent extends React.Component {

    componentDidMount() {
	console.log("DashboardComponent.componentDidMount()");
        console.log(this.props.dashboard);
        this.dashboard = new this.props.dashboard.Class(
	    this.props.dashboard.name,
	    this.props.data
	);
        this.dashboard.draw();
    }
    
    render() {
	return <div className="dashboard" id={this.props.dashboard.name}/>;
    }
}

export default DashboardComponent;
