import React from "react";
import { NavLink } from "react-router-dom";
import {Nav, Navbar, NavDropdown} from 'react-bootstrap';
import LogoutButton from "./LogoutButton";


const DashboardsDropdown = ({setDashboard}) => {
    return (
        <NavDropdown title="Dashboards" id="basic-nav-dropdown">
          <NavDropdown.Item
            as={NavLink}
            onClick={()=>setDashboard("dau")}
            to="/dashboards/dau">
            DAU Dashboard
          </NavDropdown.Item>
          
          <NavDropdown.Item
            as={NavLink}
            onClick={()=>setDashboard("activation-funnel")}
            to="/dashboards/activation-funnel">
            Activation Funnel Dashboard
          </NavDropdown.Item>
          
          <NavDropdown.Item
            as={NavLink}
            onClick={()=>setDashboard("revenue")}
            to="/dashboards/revenue">
            Revenue Dashboard
          </NavDropdown.Item>
          
        </NavDropdown>
    );
};
      

const MyNavbar = ({dashboard, isLoggedIn, setDashboard, setLoginStatus}) => {

    return (
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Fan Games Arena Data Analytics</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">

            <Nav className="ml-auto">
              {dashboard ? dashboard.title : ""}
            </Nav>
            
            <Nav className="ml-auto">
              {isLoggedIn ? <DashboardsDropdown setDashboard={setDashboard} /> : ""}
              {isLoggedIn ? <LogoutButton setLoginStatus={setLoginStatus} /> : ""}
            </Nav>
            
          </Navbar.Collapse>
        
        </Navbar>
    );
};


export default MyNavbar;
