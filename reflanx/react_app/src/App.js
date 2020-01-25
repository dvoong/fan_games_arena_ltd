import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";

import './App.css';
import LoginForm from "./components/Login";
import Navbar from "./components/Navbar";
// import ActivationFunnelDashboard from "./components/dashboards/ActivationFunnelDashboard";
import DauDashboard from "./components/dashboards/DauDashboard";
import LoadingScreen from "./components/LoadingScreen";


class App extends React.Component {

    dashboards = [
        {name: "dau-dashboard", title: "DAU Dashboard"}
    ]

    state = {
        dashboard: "dau-dashboard",
        datasetRegistry: {},
        errors: [],
        loading: true,
        loggedIn: null,
    }

    checkLoginStatus() {
        console.log("App.checkLoginStatus()");
        return axios.get("/api/check-login-status")
            .then(
                response => {
                    let csrftoken = response.data.csrftoken;
                    axios.defaults.headers.common["X-CSRFTOKEN"] = csrftoken;
                    return response.data.loginStatus === "logged in";
                }
            ).catch(
                error => this.state.errors.push(error)
            );
    }

    constructor(props) {
        super(props);
        this.getDatasets = this.getDatasets.bind(this);
        this.setDashboard = this.setDashboard.bind(this);
        this.setLoggedIn = this.setLoggedIn.bind(this);
        
        this.checkLoginStatus()
            .then((loggedIn)=>this.setState({loading: false, loggedIn: loggedIn}));
    }

    getDatasets(datasets) {
        console.log(`App.getDatasets()`);
        console.log(datasets);

        let datasetsQueue = [...datasets];
        let datasetRegistry = {...this.state.datasetRegistry};

        const checkRegistry = d => d.name in datasetRegistry;
        const dequeueDataset = d => {
            datasetsQueue = datasetsQueue.filter(q=>d!==q);
            return datasetsQueue;
        };
        const fetchData = dataset => axios.get(`api/get-dataset/${dataset.name}`)
              .then(response=>({...dataset, data: response.data}));
        const processDataset = dataset => dataset.datetimeVariables !== undefined
              ? datetimeVariablesConversion(dataset)
              : dataset;
        const datetimeVariableConversion = (dataset, variable) => {
            let data = dataset.data;
            let index = dataset.data.headers.indexOf(variable);
            let values = data.values.map(
                row=> [
                    ...row.slice(0, index),
                    new Date(row[index]),
                    ...row.slice(index+1)
                ]
            );
            data = {...data, values: values};
            return {...dataset, data: data};
        };
        const datetimeVariablesConversion = dataset => dataset.datetimeVariables.reduce(
            datetimeVariableConversion,
            dataset
        );
        const setLoading = () => this.setState({loading: true});
        const updateRegistry = dataset => {
            datasetRegistry = {...datasetRegistry, [dataset.name]: dataset};
            return datasetRegistry;
        };
        const updateState = () => this.setState(
            {datasetRegistry: datasetRegistry, loading: false}
        );

        datasets.forEach(
            dataset => checkRegistry(dataset)
                ? dequeueDataset(dataset)
                : new Promise((resolve, reject)=>resolve(1))
                .then(()=>this.state.loading === false ? setLoading() : null)
                .then(()=>fetchData(dataset))
                .then(dataset=>processDataset(dataset))
                .then(dataset=>updateRegistry(dataset))
                .then(registry=>dequeueDataset(dataset))
                .then(queue => queue.length === 0)
                .then(status => status ? updateState() : null)
                .catch(error => this.setState({errors: [...this.state.errors, error]}))
        );
    }
    
    render() {
	console.log("App.render");
        console.log(this.state);

        let dashboard = this.dashboards.find(d=>d.name === this.state.dashboard);
        let title = dashboard !== undefined
            ? dashboard.title
            : `Unrecognised dashboard: ${this.state.dashboard}`;
        let navbar = <Navbar
                       title={title}
                       loggedIn={this.state.loggedIn}
                       setDashboard={this.setDashboard}
                       setLoggedIn={this.setLoggedIn}
                     />;

        let loadingScreen = <LoadingScreen />;
        let errors = "error";

        let mainComponent = "";
        if(this.state.loggedIn === null) {
        } else if(this.state.loggedIn === false) {
            mainComponent = <LoginForm setLoggedIn={this.setLoggedIn}/>;
        } else if (this.state.dashboard === "dau-dashboard") {
            mainComponent = <DauDashboard
                              datasetRegistry={this.state.datasetRegistry}
                              getDatasets={this.getDatasets}
                            />;
        }
        
	return (
	    <div>
              {navbar}
              {this.state.loading ? loadingScreen : ""}
              {this.state.errors.length > 0 ? errors : ""}
              {mainComponent}
            </div>
	);
    }

    setDashboard(dashboard) {
        this.setState({dashboard: dashboard});
    }

    setLoggedIn(loggedIn) {
        this.setState({loggedIn: loggedIn});
    }
}

// class App extends React.Component {

    // constructor(props) {
    //     super(props);
    //     let url = window.location.href.replace(/^(?:\/\/|[^]+)*\//, "");
    //     let match = url.match(/(?<=dashboards\/).+/);
    //     let dashboardName = match ? match[0] : null;
        
    //     this.dashboards = {
    //         dau: {
    //             title: "DAU",
    //             component: DauDashboard
    //         },
    //         "activation-funnel": {
    //             title: "Activation Funnel",
    //             component: ActivationFunnelDashboard
    //         },
    //         // revenue: {
    //         //     title: "Revenu",
    //         //     component: RevenueDashboard
    //         // },
    //     };

    //     let dashboard = null; 
    //     if(dashboardName !== null) {
    //         dashboard = this.dashboards[dashboardName];
    //         if(dashboard === undefined) {
    //             dashboard = {
    //                 title: "",
    //                 component: <div>Unrecognised dashboard: {dashboardName}</div>
    //             };
    //         }
    //     }
        
    //     this.state = {
    //         csrftoken: null,
    //         data: {},
    //         dashboard: dashboard,
    //         isLoggedIn: false,
    //         loading: true,
    //     };

    //     this.getDataset = this.getDataset.bind(this);
    //     this.setDashboard = this.setDashboard.bind(this);
    //     this.setLoading = this.setLoading.bind(this);
    //     this.setLoginStatus = this.setLoginStatus.bind(this);

    //     this.checkLoginStatus();
    // }

    // checkLoginStatus() {
    //     this.setLoading(true);
    //     return axios.get("/api/check-login-status")
    //         .then(
    //             response => {
    //                 let csrftoken = response.data.csrftoken;
    //                 axios.defaults.headers.common['X-CSRFTOKEN'] = csrftoken;
    //                 this.setLoginStatus(response.data.loginStatus === "logged in");
    //             }
    //         ).catch(
    //             error => this.setLoginStatus(false)
    //         ).finally(()=>this.setLoading(false));
    // }

    // getDataset(dataset) {
    //     console.log("App.getDataset()");
    //     if(dataset.name in this.state.data) {
    //         return this.state.data[[dataset.name]];
    //     } else {
    //         return dataset.getDataset().then(
    //             (data)=>{
    //                 let newData = {...this.state.data, [dataset.name]: data};
    //                 this.setState({data: newData});
    //             }
    //         );
    //     }
    // }
    
    // setDashboard(dashboardName) {
    //     let dashboard = this.dashboards[dashboardName];
    //     this.setState({dashboard: dashboard});
    // }
    
    // setLoading(loading) {
    //     this.setState({loading: loading});
    // }
    
    // setLoginStatus(isLoggedIn){
    //     this.setState({isLoggedIn: isLoggedIn});
    // }

    // render() {
    //     console.log("App.render()");
    //     console.log(this.state);

    //     let loadingComponent = <LoadingScreen loading={this.state.loading}/>;

    //     let navbar = (
    //         <Navbar
    //           dashboard={this.state.dashboard}
    //           isLoggedIn={this.state.isLoggedIn}
    //           setDashboard={this.setDashboard}
    //           setLoginStatus={this.setLoginStatus}
    //         />
    //     );
        
    //     if(this.state.loading && this.state.isLoggedIn !== true) {
    //         return (
    //             <div>
    //               {navbar}
    //               {loadingComponent}
    //             </div>
    //         );
    //     }
        
    //     let mainComponent = "";
        
    //     if(this.state.isLoggedIn === false){
    //         mainComponent = (
    //             <LoginForm
    //               csrftoken={this.state.csrftoken}
    //               setLoading={this.setLoading}
    //               setLoginStatus={this.setLoginStatus}
    //             />
    //         );
    //     } else {
    //         if(this.state.dashboard !== null){
    //             mainComponent = React.createElement(
    //                 this.state.dashboard.component,
    //                 {data: this.state.data, getDataset: this.getDataset}
    //             );
    //         }
    //     }

    //     return (
    //         <Router>
    //           <Route path="/login">
    //             {this.state.isLoggedIn ? <Redirect to="/" /> : <LoginForm />}
    //           </Route>
              
    //           {navbar}
    //           {loadingComponent}
    //           {mainComponent}
    //         </Router>
    //     );
    // }
// }

export default App;
