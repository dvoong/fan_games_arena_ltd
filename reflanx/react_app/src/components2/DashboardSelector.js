import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const DashboardSelector = ({setDashboard}) => {
    
    return (
        <div className="container">
          <div className="form-group">
            <label htmlFor="sel1">Dashboard:</label>
            <select
              className="form-control"
              id="sel1"
              onChange={(e)=>setDashboard(e.target.value)}
            >
              <option value="a">1</option>
              <option value="b">2</option>
              <option value="c">3</option>
              <option value="d">4</option>
            </select>
          </div>
        </div>
    );
};

export default DashboardSelector;
