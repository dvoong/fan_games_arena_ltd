import axios from 'axios';
// import {scaleX} from "d3";
import React from 'react';
import { render } from 'react-dom';
import  { DauChart, DauChartComponent } from "./DauChart";

console.log("App.js");

window.React = React;
axios.defaults.xsrfCookieName = "csrf_token";
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";


class App extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            data: [
                [new Date('2019-01-01'), 10],
                [new Date('2019-01-02'), 15],
                [new Date('2019-01-03'), 21],
            ],
            dauChart: new DauChart(),
        };
        console.log(this.state);
    }

    componentDidMount() {
        console.log('componentDidMount');
        const {data, dauChart} = this.state;
        dauChart.initialise();
        dauChart.draw(data);
    }
    
    render() {
        console.log("render");
        const {data, dauChart} = this.state;
        console.log(`data: ${data}`);
        return (
            <div className="container main-container">
              <h1>Dashboards</h1>
              <DauChartComponent data={data} dauChart={dauChart}/>
            </div>
        );
    }
}

render(<App/>, document.getElementById("react-container"));
       
