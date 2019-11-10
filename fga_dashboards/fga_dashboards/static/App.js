import axios from 'axios';
// import {scaleX} from "d3";
import React from 'react';
import { render } from 'react-dom';
import { DauChart, DauChartComponent } from "./DauChart";
import { NewUsersChart, NewUsersChartComponent } from "./NewUsersChart";

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
            newUsersChart: new NewUsersChart(),
            screenWidth: window.innerWidth,
        };
        this.updateWindow = this.updateWindow.bind(this);
        window.addEventListener('resize', this.updateWindow);
    }

    updateWindow(e) {
        this.setState({screenWidth: window.innerWidth});
    }

    componentDidMount() {
        const {dauChart, newUsersChart} = this.state;
        dauChart.initialise();
        newUsersChart.initialise();
        axios.get("/api/get-data?start=2019-01-01")
            .then(response => response.data)
            .then(data => {
                var data = {...data};
                data.dau.values = data.dau.values.map(d => [new Date(d[0]), d[1], d[2]]);
                data.newUsers.values = data.newUsers.values.map(d => [new Date(d[0]), d[1], d[2]]);
                return data;
            })
            .then(data => this.setState({data: data, loading: false}));
    }

    componentDidUpdate() {
        const {data, dauChart, newUsersChart} = this.state;
        dauChart.draw(data.dau);
        newUsersChart.draw(data.newUsers);
    }
    
    render() {
        const {data, dauChart, loading, newUsersChart} = this.state;


        let loadingComponent = '';
        if(loading == true){
            loadingComponent= <p>loading</p>;
        } 
        return (
            <div className="container main-container">
              <h1>Dashboards</h1>
              {loadingComponent}
              <DauChartComponent dauChart={dauChart} hidden={loading}/>
              <NewUsersChartComponent newUsersChart={newUsersChart} hidden={loading}/>
            </div>
        );
    }
}

render(<App/>, document.getElementById("react-container"));
       
