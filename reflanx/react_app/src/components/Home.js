import React from 'react';

const Home = ({logoutUser, dauDashboard}) => {
    return (
        <div className="App container">
          <DauDashboard dauDashboard={dauDashboard}/>
          <button className="btn btn-primary" onClick={logoutUser} >Logout</button>
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

    onClientChange() {
	
    }

    componentDidMount() {
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
