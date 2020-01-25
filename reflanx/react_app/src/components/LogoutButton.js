import axios from 'axios';
import React from "react";


const LogoutButton = ({setLoggedIn}) => {

    const onClick = (e) => {
        axios.post("/api/logout-user")
            .then(response => setLoggedIn(!(response.status === 200)));
    };
    
    return (
        <button className="btn btn-primary" onClick={onClick}>
          Logout
        </button>
    );
};

export default LogoutButton;
