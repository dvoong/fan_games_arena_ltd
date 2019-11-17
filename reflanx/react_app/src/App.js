import axios from 'axios';
import React from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Cookies from 'universal-cookie';


axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";

class App extends React.Component {

    checkLoginStatus() {
        axios.get("/api/check-login-status")
            .then(
                response => {
                    this.setState(
                        {
                            isLoggedIn: response.data.loginStatus === "logged in",
                            loading: false,
                        }
                    );
                    let cookies = new Cookies();
                    cookies.set('csrftoken', response.data.csrftoken, { path: '/' });
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
        
        this.checkLoginStatus();
        this.loginUser = this.loginUser.bind(this);
        this.logoutUser = this.logoutUser.bind(this);
    }

    loginUser(username, password) {
        const data = {"username": username, "password": password};
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
        console.log("state");
        console.log(this.state);
        const {isLoggedIn, loading} = this.state;
        if(loading === true){
            return "loading";
        }
        if(isLoggedIn === true) {
            return (
                <div className="App">
                  <button className="btn btn-primary" onClick={this.logoutUser} >Logout</button>
                </div>
            );
        } else {
            return <LoginForm errors={this.state.errors} loginUser={this.loginUser}></LoginForm>;
        }
    }
}

const LoginForm = ({errors, loginUser}) => {
    let username = '';
    let password = '';
    
    const onSubmit = (e) => {
        console.log("onSubmit");
        e.preventDefault();
        username = username.value;
        password = password.value;
        return loginUser(username, password);
    };

    let errorsComponent = "";
    if(errors.length > 0){
        errorsComponent = (
            <div
              className="container errors alert alert-danger"
              role="alert"
              style={{marginTop: "1em"}}
            >
              {
                  errors.map(
                      (e, i)=>{
                          return (
                              <div className="form-error" key={i}>
                                {e}
	                      </div>
                          );
                      }
              )
              }
            </div>
        );
    }
    
    return (
        <div className="container main-container" id="login-form-container">
          <form className="form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                className="form-control"
                id="username"
                name="username"
                ref={e=>username=e}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                className="form-control"
                id="password"
                name="password"
                ref={e=>password=e}
                type="password"
                required
              />
            </div>
            <button className="btn btn-primary">Submit</button>
          </form>
          {errorsComponent}
        </div>
    );
};

export default App;
