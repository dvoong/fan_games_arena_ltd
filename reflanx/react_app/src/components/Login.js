import axios from 'axios';
import React from "react";


const ErrorComponent = ({error, i}) => {
    return (
        <div className="form-error" key={i}>
          {error}
	</div>
    );
};

class LoginForm extends React.Component {

    constructor(props) {
        console.log("LoginForm.constructor");
	super(props);
        this.state = {
            errors: [],
            password: "",
            username: "",
        };

        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit(e) {
        e.preventDefault();

        const data = {
            username: this.state.username,
            password: this.state.password,
            headers: {"X-CSRFTOKEN": this.props.csrftoken},
        };
        
        axios.post('/api/login-user', data)
            .then(response => {
                if(response.data.status === 200){
                    this.props.setLoginStatus(response.data.status === 200);
                } else {
                    this.setState({errors: response.data.errors});
                }
            });
    }

    render() {
        console.log("LoginForm.render");
        console.log(this.state);
        
        let errorsComponent = "";

        if(this.state.errors.length > 0) {
            errorsComponent = (
                <div
                  className="container errors alert alert-danger"
                  style={{marginTop: "1em"}}>
                  {this.state.errors.map((error, i)=><ErrorComponent error={error} i={i}/>)}
                </div>
            );
        }
        
        return (
            <div className="container main-container" id="login-form-container">
              <form className="form" onSubmit={this.onSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    className="form-control"
                    id="username"
                    name="username"
                    onChange={(e)=>this.setState({username:e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    className="form-control"
                    id="password"
                    name="password"
                    onChange={(e)=>this.setState({password:e.target.value})}
                    type="password"
                    required
                  />
                </div>
                <button className="btn btn-primary">Submit</button>
                {errorsComponent}
              </form>
            </div>

        );
    };
}

export default LoginForm;
