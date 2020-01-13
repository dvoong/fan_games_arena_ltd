import axios from 'axios';
import React from "react";
import { Link, NavLink, Route, BrowserRouter as Router } from "react-router-dom";
import {Nav, Navbar, NavDropdown, Form, FormControl, Button} from 'react-bootstrap';
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
            onClick={()=>setDashboard("loading-funnel")}
            to="/dashboards/loading-funnel">
            Loading Funnel Dashboard
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

const Title = ({ match }) => {
    return match.params.dashboardId;
    // get 
};

export default MyNavbar;
