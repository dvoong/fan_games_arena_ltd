import axios from 'axios';
import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import DauDashboard from './dashboards/DauDashboard';
import LoginForm from './components/Login';
import HomeComponent from './components/Home';
import TotalQuizzesSubmittedDashboard from "./dashboards/TotalQuizzesSubmittedDashboard";


class App extends React.Component {

    changeDashboard(dashboardName) {
	console.log(`changeDashboard: ${dashboardName}`);
	this.setState({selectedDashboard: dashboardName});
    }
    
    checkLoginStatus() {
        return axios.get("/api/check-login-status")
            .then(
                response => {
                    axios.defaults.headers.common['X-CSRFTOKEN'] = response.data.csrftoken;
                    this.setState(
                        {
                            isLoggedIn: response.data.loginStatus === "logged in",
                            loading: false,
                            csrftoken: response.data.csrftoken,
                        }
                    );
		    return this.state.isLoggedIn;
                }
            )
            .catch(
                error => this.setState(
                    {
                        errors: [error],
                        loading: false,
                    }
                )
            );
    }
    
    constructor(props) {
        super(props);
        this.state = {
	    data: {},
	    dashboards: [
		{name: "dau-dashboard", title: "DAU dashboard"},
		{name: "retention-dashboard", title: "Retention dasbhoad"},
		{name: "weekly-retention-dashboard", title: "Weekly retention dashboard"},
		{name: "activation-funnel-dashboard", title: "Activation funnel dashboard"},
		{
		    Class: TotalQuizzesSubmittedDashboard,
		    name: "total-quizzes-submitted",
		    title: "Total quizzes submitted dashboard"
		},
	    ],
            errors: [],
            loading: true,
            isLoggedIn: false,
	    selectedDashboard: "dau-dashboard",
        };
	this.dauDashboard = new DauDashboard("dau-dashboard");
	this.changeDashboard = this.changeDashboard.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.logoutUser = this.logoutUser.bind(this);

        this.checkLoginStatus()
	    .then(isLoggedIn => isLoggedIn ? this.getDauData() : {})
    }
    
    getActivationFunnelDashboardData() {
	console.log("getActivationFunnelDashboardData");
	this.setState({loading: true});
	return axios.get("/api/get-activation-funnel-dashboard-data")
	    .then(
		response=>{
		    let data = {...response.data};
		    let dateIndex = data.headers.indexOf("date");
		    data.values = data.values.map(
			row=>{
			    row[dateIndex] = new Date(row[dateIndex]);
			    return row
			}
		    )
		    this.setState(
			{
			    data: {...this.state.data, activationFunnelDashboardData: data},
			    loading: false,
			}
		    )
		}
	    )
    }

    getDashboardData(dashboardName) {
	console.log(`getDasboardData(${dashboardName})`)
	this.setState({loading: true})
	let url = `/api/get-dashboard-data/${dashboardName}`
	return axios.get(
	    url
	).then(
	    response=>{
		let data = {...response.data}
		let dateIndex = data['headers'].indexOf('date')
		if(dateIndex !== -1) {
		    data.values = data.values.map(
			row=>{
			    row[dateIndex] = new Date(row[dateIndex]);
			    return row
			}
		    )
		}
		let newData = {...this.state.data};
		newData[`${dashboardName}Data`] = data
		this.setState({data: newData, loading: false})
	    }
	)
    }
    
    getDauData() {
	console.log("getDauData()");
	this.setState({loading: true});
	return axios.get("/api/get-dau-data")
	    .then(
		response => {
		    console.log("getDauData().callback");
		    let data = {...response.data}
		    let dateIndex = data['headers'].indexOf('date')
		    let analysisTimeIndex = data['headers'].indexOf('analysisTime')
		    for(let i=0; i<data.values.length; i++){
			data.values[i][dateIndex] = new Date(data.values[i][dateIndex])
			data.values[i][analysisTimeIndex] = new Date(
			    data.values[i][analysisTimeIndex]
			);
		    }
		    console.log("getDauData")
		    console.log("set dauDashboard.data");
		    this.dauDashboard.data = data;
		    this.setState(
			{data: {...this.state.data, dauDashboardData: data}, loading: false}
		    );
		    return response.data;
		}
	    )
	    .catch(error => this.setState({errors: [error], loading: false}));
    }

    getRetentionDashboardData() {
	console.log("getRetentionDashboardData()")
	this.setState({loading: true})
	return axios.get(
	    "/api/get-retention-dashboard-data"
	).then(
	    response=>{
		let data = {...response.data}
		let dateIndex = data['headers'].indexOf('date')
		let analysisTimeIndex = data['headers'].indexOf('analysisTime')
		for(let i=0; i<data.values.length; i++){
		    data.values[i][dateIndex] = new Date(data.values[i][dateIndex])
		    data.values[i][analysisTimeIndex] = new Date(
			data.values[i][analysisTimeIndex]
		    );
		}
		console.log("set retentionDashboardData");
		this.setState(
		    {data: {...this.state.data, retentionDashboardData: data}, loading: false}
		)
	    }
	)
    }

    getWeeklyRetentionDashboardData() {
	console.log("getWeeklyRetentionDashboardData()")
	this.setState({loading: true})
	return axios.get(
	    "/api/get-weekly-retention-dashboard-data"
	).then(
	    response=>{
		let data = {...response.data}
		let dateIndex = data['headers'].indexOf('date')
		let analysisTimeIndex = data['headers'].indexOf('analysisTime')
		for(let i=0; i<data.values.length; i++){
		    data.values[i][dateIndex] = new Date(data.values[i][dateIndex])
		    data.values[i][analysisTimeIndex] = new Date(
			data.values[i][analysisTimeIndex]
		    );
		}
		console.log("set weeklyRetentionDashboardData");
		this.setState(
		    {data: {...this.state.data, weeklyRetentionDashboardData: data}, loading: false}
		)
	    }
	)
    }
    
    loginUser(username, password) {
        const data = {
            "username": username,
            "password": password,
            headers: {"X-CSRFTOKEN": this.state.csrftoken},
        };
        axios.post('/api/login-user', data)
            .then(
                response => {
                    if(response.data.status === 200) {
                        this.setState({isLoggedIn: true, loading: false});
                    } else {
                        this.setState(
                            {
                                isLoggedIn: false,
                                loading: false,
                                errors: response.data.errors,
                            }
                        );
                    }
                }
            )
            .catch(
                error => {
                    this.setState(
                        {
                            errors: [error],
                            loading: false
                        }
                    );
                }
            );
    }

    logoutUser() {
        this.setState({loading: true});
        axios.post('/api/logout-user')
            .then(
                response => {
                    if(response.data.status === 200){
                        this.setState({isLoggedIn: false, loading: false});
                    } else {
                        this.setState({errors: response.data.errors, loading: false});
                    }
                }
            ).catch(
                e => {
                    this.setState({errors: [e], loading: false});
                }
            );
    }
    
    render() {
        console.log("render: state: ");
        console.log(this.state);
	let {dauDashboard} = this;

        const {isLoggedIn, loading} = this.state;
        if(loading === true){
            return "loading";
        }
        if(isLoggedIn === true) {
	    let dataKey = `${this.state.selectedDashboard}Data`;
	    if(this.state.selectedDashboard === "dau-dashboard"){
		console.log("dau-dashboard");
	    } else if(this.state.selectedDashboard === "retention-dashboard"){
		if(this.state.data.retentionDashboardData === undefined)
		    this.getRetentionDashboardData();
	    } else if(this.state.selectedDashboard === "weekly-retention-dashboard") {
		if(this.state.data.weeklyRetentionDashboardData === undefined)
		    this.getWeeklyRetentionDashboardData();
	    } else if(this.state.selectedDashboard === "activation-funnel-dashboard") {
		if(this.state.data.activationFunnelDashboardData === undefined)
		    this.getActivationFunnelDashboardData();
	    } else if(this.state.data[dataKey] === undefined){
		this.getDashboardData(this.state.selectedDashboard);
	    }
	    
	    return <HomeComponent
	    changeDashboard={this.changeDashboard}
	    data={this.state.data}
	    dashboards={this.state.dashboards}
	    dauDashboard={dauDashboard}
	    logoutUser={this.logoutUser}
	    selectedDashboard={this.state.selectedDashboard}
	    />
        } else {
            return <LoginForm errors={this.state.errors} loginUser={this.loginUser}></LoginForm>;
        }
    }
}

export default App;
