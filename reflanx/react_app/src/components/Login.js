import React from 'react'

const LoginForm = ({errors, loginUser}) => {
    let username = '';
    let password = '';
    
    const onSubmit = (e) => {
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

export default LoginForm;
