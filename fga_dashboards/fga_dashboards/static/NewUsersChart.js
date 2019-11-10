import { BaseDauChart } from "./BaseDauChart";

class NewUsersChart extends BaseDauChart {

    constructor(containerId="new-users-chart", canvasHeight=300){
        super(containerId=containerId, canvasHeight=canvasHeight);
    }
}

const NewUsersChartComponent = ({hidden, newUsersChart}) => {

    return (
        <div className="chart-container" id={newUsersChart.containerId}>
	  <h2 className={hidden ? "hidden" : ""}>New users</h2>	
          <svg className="canvas">
            <g className="plot-area"/>
          </svg>
        </div>
    );
}

export {NewUsersChart, NewUsersChartComponent};

