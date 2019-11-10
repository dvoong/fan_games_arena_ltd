import axios from 'axios';
// import {scaleX} from "d3";
import React from 'react';
import { render } from 'react-dom';
import  { DauChart, DauChartComponent } from "./DauChart";


window.React = React;
axios.defaults.xsrfCookieName = "csrf_token";
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";

class App extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            data: {dau: null,},
            dauChart: new DauChart(),
            loading: true,
        };
    }

    componentDidMount() {
        const {dauChart} = this.state;
        dauChart.initialise();
        axios.get("/api/get-data?start=2019-01-01")
            .then(response => response.data)
            .then(data => {
                var data = {...data};
                data.dau.values = data.dau.values.map(d => [new Date(d[0]), d[1], d[2]]);
                return data;
            })
            .then(data => this.setState({data: data, loading: false}));
    }

    componentDidUpdate() {
        const {data, dauChart} = this.state;
        dauChart.draw(data.dau);
    }
    
    render() {
        const {data, dauChart, loading} = this.state;

        let loadingComponent = '';
        if(loading == true){
            loadingComponent= <h1>loading</h1>;
        }
        
        return (
            <div className="container main-container">
              <h1>Dashboards</h1>
              {loadingComponent}
              <DauChartComponent dauChart={dauChart}/>
            </div>
        );
    }
}

render(<App/>, document.getElementById("react-container"));
       
