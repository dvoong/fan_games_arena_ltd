import React from 'react';
import RetentionDashboardComponent from "./dashboards/RetentionDashboardComponent";
import WeeklyRetentionDashboardComponent from "./dashboards/WeeklyRetentionDashboardComponent";
import ActivationFunnelDashboardComponent from "./dashboards/ActivationFunnelDashboardComponent";
import DashboardComponent from "./DashboardComponent";

const Home = ({changeDashboard, data, dashboards, dauDashboard, logoutUser, selectedDashboard}) => {
    console.log("Home component");
    console.log("data");
    console.log(data);

    let dashboardComponent = 'asdf';
    let dashboardData = data[`${selectedDashboard}Data`];
    let dashboard = dashboards.filter(d=>d.name === selectedDashboard)[0];

    if(selectedDashboard === "dau-dashboard"){
        dashboardComponent = <DauDashboard dauDashboard={dauDashboard}/>;
    } else if (selectedDashboard === "retention-dashboard"){
	if(data.retentionDashboardData !== undefined){
            dashboardComponent = <RetentionDashboardComponent data={data.retentionDashboardData}/>;
	}
    } else if (selectedDashboard === "weekly-retention-dashboard") {
	if(data.weeklyRetentionDashboardData !== undefined) {
	    dashboardComponent = <WeeklyRetentionDashboardComponent
	                           data={data.weeklyRetentionDashboardData}/>;
	}
    } else if (selectedDashboard === "activation-funnel-dashboard") {
	if(data.activationFunnelDashboardData !== undefined) {
	    dashboardComponent = <ActivationFunnelDashboardComponent
	                           data={data.activationFunnelDashboardData}/>;
	}
    } else {
        if(dashboardData !== undefined){
            dashboardComponent = <DashboardComponent
                                   data={dashboardData}
                                   dashboard={dashboard}
                                 />;
        }
    }
    
    return (
        <div className="App container">
          {dashboardComponent}
          <button className="btn btn-primary" onClick={logoutUser} >Logout</button>
          {
              dashboards.map(
                  d=> {
                      console.log(d.name);
                      return (
                          <button
                            className="btn btn-primary"
                            onClick={e=>changeDashboard(d.name)}
                          >
                            {d.title}
                          </button>
                      );
                      
                  }
              )
          }
        </div>
    );
};

class DauDashboard extends React.Component {

    constructor(props) {
	super(props)
	this.dauDashboard = props.dauDashboard;
	this.state = {
	    groupby: ['client'],
            filter: [],
	};
        this.dauDashboard.groupby = this.state.groupby;
    }

    componentDidMount() {
        console.log("DauDashboard.componentDidMount()");
        this.dauDashboard.initialiseComponents();
        if(this.dauDashboard.data !== undefined){
            this.dauDashboard.draw();
        }
	
    }

    render() {
        const {dauDashboard} = this.props;
        const {dauChart} = dauDashboard;

        return (
	    <div
              id={dauDashboard.containerId}
              className="container dashboard dashboard-container"
              style={{paddingTop: "5em"}}
            >
              <div className="row">
                <div id={dauChart.containerId} className="container chart-container">
                  <h2 className="chart-title title" style={{visibility: "hidden"}}></h2>
	          <svg id={dauChart.canvasId} className="canvas chart-canvas">
                    <g id={dauChart.plotAreaId}>
                    </g>
	          </svg>
	        </div>
              </div>

              <div className="row">
                <div className="col-md-6">
	          <div
                    id={dauDashboard.clientChart.containerId}
                    className="container chart-container"
                  >
                    <h2 className="chart-title title" style={{visibility: "hidden"}}></h2>
		    <svg id={dauDashboard.clientChart.canvasId} className="canvas chart-canvas">
                      <g id={dauDashboard.clientChart.plotAreaId}>
                      </g>
		    </svg>
	          </div>
                </div>

                <div className="col-md-6">
	          <div
                    id={dauDashboard.tenureTypeChart.containerId}
                    className="container chart-container"
                  >
                    <h2 className="chart-title title" style={{visibility: "hidden"}}></h2>
		    <svg id={dauDashboard.tenureTypeChart.canvasId} className="canvas chart-canvas">
                      <g id={dauDashboard.tenureTypeChart.plotAreaId}>
                      </g>
		    </svg>
	          </div>
                </div>
              </div>
              
            </div>
        );
    }
};

export default Home;

// class DauDashboard extends React.Component {

//     componentDidMount() {
//         console.log("DauDashboard.didComponentMount()");
//         const {dauDashboard} = this.props;
//         this.props.dauDashboard.initialiseComponents();
//     }

//     render() {
//         const {dauDashboard} = this.props;
//         const {dauChart} = dauDashboard;

//         return (
// 	    <div
//               id={dauDashboard.containerId}
//               className="container dashboard dashboard-container"
//             >
//               <div id={dauChart.containerId} className="container chart-container">
// 	        <svg id={dauChart.canvasId} className="canvas chart-canvas">
// 	        </svg>
//               </div>
//             </div>
//         );
//     }
// };


// const DauDashboard = ({dauDashboard}) => {
//     return (
//         <div className="dau-dashboard dashboard container">
//           <div className="dau-chart container">
//             <svg className="canvas">
//             </svg>
//           </div>
//         </div>
//     );
// };
