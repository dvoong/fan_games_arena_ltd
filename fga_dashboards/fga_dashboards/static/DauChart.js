import { BaseDauChart } from "./BaseDauChart";

class DauChart extends BaseDauChart {

    constructor(containerId="dau-chart", canvasHeight=300){
        super(containerId=containerId, canvasHeight=canvasHeight);
    }
}

const DauChartComponent = ({dauChart, hidden}) => {

    return (
        <div className="chart-container" id={dauChart.containerId}>
	  <h2 className={hidden ? "hidden" : ""}>DAU</h2>
          <svg className="canvas">
            <g className="plot-area"/>
          </svg>
        </div>
    );
}

export {DauChart, DauChartComponent};

