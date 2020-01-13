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

        this.props.setLoading(true);
        
        const data = {
            username: this.state.username,
            password: this.state.password,
            headers: {"X-CSRFTOKEN": this.props.csrftoken},
        };
        
        axios.post('/api/login-user', data)
            .then(response => {
                this.props.setLoginStatus(response.data.status == 200);
                this.setState({errors: response.data.errors});
            })
            .catch(error => this.props.setLoginStatus(false))
            .finally(()=>this.props.setLoading(false));
    }

    render() {

        let errorsComponent = "";

        if(this.state.errors.length > 0) {
            errorsComponent = (
                <div className="container errors alert alert-danger">
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
                    onChange={(e)=>this.state.username=e.target.value}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    className="form-control"
                    id="password"
                    name="password"
                    onChange={(e)=>this.state.password=e.target.value}
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
