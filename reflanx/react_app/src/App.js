import axios from 'axios';
import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import DauDashboard from './dashboards/DauDashboard';
import LoginForm from './components/Login';
import HomeComponent from './components/Home';


class App extends React.Component {

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
            errors: [],
            loading: true,
            isLoggedIn: false,
        };
	this.dauDashboard = new DauDashboard("dau-dashboard");
        this.loginUser = this.loginUser.bind(this);
        this.logoutUser = this.logoutUser.bind(this);
        this.checkLoginStatus()
	    .then(isLoggedIn => isLoggedIn ? this.getDauData() : {})
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
			{data: data, loading: false}
		    );
		    return response.data;
		}
	    )
	    .catch(error => this.setState({errors: [error], loading: false}));
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
	    return <HomeComponent
	    dauDashboard={dauDashboard}
	    logoutUser={this.logoutUser}
	    />
        } else {
            return <LoginForm errors={this.state.errors} loginUser={this.loginUser}></LoginForm>;
        }
    }
}

export default App;
