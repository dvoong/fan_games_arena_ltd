import React from "react";
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import LogoutButton from "./LogoutButton";


const DashboardsDropdown = ({setDashboard}) => {
    return (
        
        <NavDropdown title="Dashboards" id="basic-nav-dropdown">
          <NavDropdown.Item onClick={()=>setDashboard("dau-dashboard")}>
            DAU Dashboard
          </NavDropdown.Item>
          
          <NavDropdown.Item onClick={()=>setDashboard("activation-funnel")}>
            Activation Funnel Dashboard
          </NavDropdown.Item>
          
          <NavDropdown.Item onClick={()=>setDashboard("revenue")}>
            Revenue Dashboard
          </NavDropdown.Item>
        </NavDropdown>
    );
};
      

const MyNavbar = ({loggedIn, setDashboard, setLoggedIn, title}) => {
    return (
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Fan Games Arena Data Analytics</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <div className="navbar-title">{title}</div>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {loggedIn ? <DashboardsDropdown setDashboard={setDashboard} /> : ""}
              {loggedIn ? <LogoutButton setLoggedIn={setLoggedIn} /> : ""}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
    );
};


export default MyNavbar;
