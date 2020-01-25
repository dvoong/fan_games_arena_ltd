import React from "react";
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import LogoutButton from "./LogoutButton";


const DashboardsDropdown = ({dashboards, setDashboard}) => {

    
    return (
        <NavDropdown title="Dashboards" id="basic-nav-dropdown">
        {
            dashboards.map(
                (dashboard, i) => {
                    return (
                        <NavDropdown.Item key={i} onClick={()=>setDashboard(dashboard)}>
                          {dashboard.title}
                        </NavDropdown.Item>
                    );
                }
            )
        }
        </NavDropdown>
    );
};
      

const MyNavbar = ({dashboards, loggedIn, setDashboard, setLoggedIn, title}) => {
    return (
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Fan Games Arena Data Analytics</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <div className="navbar-title">{title}</div>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {
                  loggedIn
                      ? <DashboardsDropdown
                          dashboards={dashboards}
                          setDashboard={setDashboard} />
                  : ""
              }
              {loggedIn ? <LogoutButton setLoggedIn={setLoggedIn} /> : ""}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
    );
};


export default MyNavbar;
