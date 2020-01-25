import * as d3 from "d3";
import React from "react";

import ClientDauChart from "../charts/ClientDauChart";
import Dashboard from "./Dashboard";
import DauChart from "../charts/DauChart";
import TenureTypeDauChart from "../charts/TenureTypeDauChart";


class DauDashboard extends Dashboard {

    colours = {
        client: {
            Android: "indianred",
            iOS: "aquamarine",
            na: "pink",
            Unknown: "coral",
        },
        tenureType: {
            new: "indianred",
            existing: "aquamarine",
            unknown: "coral"
        }
    }
    
    datasets = [];

    state = {
	filters: [],
	groupby: null,
    };

    componentDidMount() {
        console.log("DauDashboard.componentDidMount()");
        this.props.getDatasets(this.datasets);
        this.tooltip.element = d3.select(".tooltip");
        this.tooltip.show = d => {
            this.tooltip.element.html(d);	
            this.tooltip.element
                .style("left", (d3.event.pageX) + "px")
                .style("opacity", 0.9)
                .style("top", (d3.event.pageY - 28) + "px");	
        };
        this.tooltip.hide = () => this.tooltip.element.style("opacity", 0);
    }

    constructor(props) {
        super(props);
        this.tooltip = {};
        this.registerDatasets = this.registerDatasets.bind(this);
        this.setGroupby = this.setGroupby.bind(this);
        this.toggleFilter = this.toggleFilter.bind(this);
    }
    
    filterDataset(dataset) {
        console.log("DauDashboard.filterDataset");
        console.log(dataset);

        if(this.state.filters.length === 0 || this.state.filters === undefined) {
            return dataset;
        }

        let newDataset = this.state.filters.reduce(
            (acc, filter) => {
                let variable = filter.variable;
                let filterValues = filter.values;
                let index = dataset.data.headers.indexOf(variable);
                let data = {...acc.data};
                let values = [...data.values];
                let newValues = values.filter(row=>filterValues.indexOf(row[index]) !== -1);
                let newData = {...data, values: newValues};
                let newDataset = {...acc, data: newData};
                return newDataset;
            },
            dataset
        );
        console.log(newDataset);
        return newDataset;
    }
    
    filterDatasetRegistry() {
        console.log("DauDashboard.filterDatasetRegistry");
        console.log(this.props.datasetRegistry);
        let datasetRegistry = Object.values(this.props.datasetRegistry).reduce(
            (acc, dataset) => {
                if(this.datasets.find(d =>d.name === dataset.name) === undefined){
                    return acc;
                }
                acc[dataset.name] = this.filterDataset(dataset);
                return acc;
            },
            {}
        );
        return datasetRegistry;
    }

    groupDatasetRegistry(datasetRegistry) {
        console.log("DauDashboard.groupDatasetRegistry");
        console.log(datasetRegistry);
        if(this.state.groupby === null) {
            return [{groupKey: "all", datasetRegistry: datasetRegistry}];
        }

        const filterDatasetRegistry = (datasetRegistry, datasets) => {
            return Object.values(datasetRegistry).reduce(
                (acc, dataset) => {
                    if(datasets.find(d=>d.name === dataset.name) !== undefined) {
                        acc[dataset.name] = dataset;
                    }
                    return acc;
                },
                {}
            );
        };

        const getUniqueValues = (dataset, variable) => {
            let index = dataset.data.headers.indexOf(variable);
            if(index === -1) {
                return [];
            }
            let values = dataset.data.values;
            let unique = values.reduce(
                (acc, row) => {
                    let value = row[index];
                    if(acc.indexOf(value) === -1){
                        acc.push(value);
                    }
                    return acc;
                },
                []
            );
            return unique;
            
        };

        const getGroupKeys = (datasetRegistry, groupby) => {
            return Object.values(datasetRegistry).reduce(
                (acc, dataset) => {
                    let unique = getUniqueValues(dataset, groupby);
                    unique.forEach(d=>acc.indexOf(d) === -1 ? acc.push(d) : null);
                    return acc;
                },
                []
            );
        };

        const getGroups = (datasetRegistry, groupby, groupKeys) => {
            let groups = groupKeys.map(
                groupKey => {
                    let datasetRegistryFiltered = Object.values(datasetRegistry).reduce(
                        (acc, dataset) => {
                            let data = dataset.data;
                            let values = data.values;
                            let index = data.headers.indexOf(groupby);
                            if(index === -1) {
                                return acc;
                            }
                            let newValues = values.filter(row=>row[index] === groupKey);
                            let newData = {...data, values: newValues};
                            let newDataset = {...dataset, data: newData};
                            acc[dataset.name] = newDataset;
                            return acc;
                        },
                        {}
                    );
                    return {
                        groupKey: groupKey,
                        datasetRegistry: datasetRegistryFiltered
                    };
                }
            );
            return groups;
        };

        datasetRegistry = filterDatasetRegistry(datasetRegistry, this.datasets);
        let groupKeys = getGroupKeys(datasetRegistry, this.state.groupby);
        let groups = getGroups(datasetRegistry, this.state.groupby, groupKeys);
        return groups;
    }
    
    registerDatasets(datasets) {
        console.log("Dashboard.registerDatasets()");
        console.log(datasets);
        datasets.forEach(
            dataset=>this.datasets.find(d=>d === dataset) === undefined
                ? this.datasets.push(dataset)
                : null
        );
    }

    render() {
	console.log("DauDashboard.render()");
        console.log(this.props);
        console.log(this.state);
        

        let groupedDatasetRegistry = null;

        if(Object.keys(this.props.datasetRegistry).length > 0) {
            let filteredDatasetRegistry = this.filterDatasetRegistry();
            groupedDatasetRegistry = this.groupDatasetRegistry(filteredDatasetRegistry);
        }

        let dauChart = <DauChart
                         colours={this.colours[this.state.groupby]}
                         datasetRegistry={groupedDatasetRegistry}
                         registerDatasets={this.registerDatasets}
                         tooltip={this.tooltip}
                       />;
        
        let clientDauChart = <ClientDauChart
                               colours={this.colours.client}
                               datasetRegistry={this.props.datasetRegistry}
                               filters={this.state.filters}
                               registerDatasets={this.registerDatasets}
                               toggleFilter={this.toggleFilter}
                               tooltip={this.tooltip}
                             />;

        let tenureTypeDauChart = <TenureTypeDauChart
                                   colours={this.colours.tenureType}
                                   datasetRegistry={this.props.datasetRegistry}
                                   filters={this.state.filters}
                                   registerDatasets={this.registerDatasets}
                                   toggleFilter={this.toggleFilter}
                                   tooltip={this.tooltip}
                                 />;

        return (
            <div className="container dashboard-cntainer">

              <div className="dashboard-controller">
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Groupby</label>
                  <div className="col-sm-10">
                    <select className="custom-select form-control"
                            onChange={(e)=>this.setGroupby(e.target.value)}
                    >
                      <option value={null}>None</option>
                      <option value="client">Client</option>
                      <option value="tenureType">New/Existing</option>
                    </select>
                  </div>
                </div>            
              </div>                
              
              <div className="row">
                <div className="col-12">
                  {dauChart}
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  {clientDauChart}
                </div>
                <div className="col-6">
                  {tenureTypeDauChart}
                </div>
              </div>

              <div className="tooltip"/>
              
            </div>
        );
        
    }

    setGroupby(groupby) {
        groupby = groupby === "None" ? null : groupby;
        this.setState({groupby: groupby});
    }

    toggleFilter(variable, value) {
        console.log("DauDashboard.toggleFilter");
        let filter = this.state.filters.find(f=>f.variable === variable);
        if(filter !== undefined) {
            let index = filter.values.indexOf(value);
            let newValues = index === -1
                ? [...filter.values, value]
                : filter.values.filter(v=>v!==value);
            let newFilter = {...filter, values: newValues};
            let newFilters = this.state.filters.filter(f=>f.variable !== variable);
            newFilters.push(newFilter);
            this.setState({filters: newFilters});
        } else {
            filter = {variable: variable, values: [value]};
            let newFilters = [...this.state.filters, filter];
            this.setState({filters: newFilters});
        }
    }
}

export default DauDashboard;
        
//             <div className="container dashboard-container" id="dashboard-container">
//               <div className="row">
//                 <div className="col-12">
//                   <DauChart
//                     data={filteredDatasets}
//                     groupedData={groupedDatasets}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
//               </div>

//               <div className="row">
                
//                 <div className="col-md-6">
//                   <DauByTenureTypeChart
//                     datasetRegistry={this.props.data}
//                     filters={this.state.filters}
//                     toggleFilter={this.toggleFilter}
//                     setGroupBy={this.setGroupBy}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
                
//                 <div className="col-md-6">
//                   <DauByClientChart
//                     datasetRegistry={this.props.data}
//                     filters={this.state.filters}
//                     toggleFilter={this.toggleFilter}
//                     setGroupBy={this.setGroupBy}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
                
//               </div>
              
//               <div className="tooltip" styles="opacity: 0"/>
//             </div>




        
// import React from "react";
// import DauDataset from "../../datasets/DauDataset";
// import Tooltip from "../Tooltip";
// import DauChart from "../charts/DauChart";
// import DauByClientChart from "../charts/DauByClientChart";
// import DauByTenureTypeChart from "../charts/DauByTenureTypeChart";


// class DauDashboard extends React.Component {

//     datasets = [new DauDataset()]
//     state = {
//         filters: [],
//         groupby: null,
//     };
    
//     constructor({data, getDataset, ...props}) {
//         super(props);

// 	this.data = data;
// 	this.getDataset = getDataset;

// 	console.log(this.data);
//         this.setGroupBy = this.setGroupBy.bind(this);
//         this.toggleFilter = this.toggleFilter.bind(this);
//         this.tooltip = new Tooltip();

//         // get data based on what the groupby is
//         this.datasets.map(
//             d => {
//                 if(!(d.name in this.props.data)){
//                     this.props.getDataset(d);
//                 }
//                 return null;
//             }
//         );
//     }

//     filterDataset(dataset, filters) {
//         console.log("DauDashboard.filterDataset");
//         console.log(dataset);
//         if(dataset === undefined){
//             return undefined;
//         }
//         let filteredValues = dataset.data.values.filter(
//             row => {
//                 return filters.reduce(
//                     (accFilters, f) => {
//                         let variableIndex = dataset.headerIndex(f.variable);
//                         let passesFilter = f.values.reduce(
//                             (accFilterValues, fv) => {
//                                 let matchesValue =  row[variableIndex] === fv;
//                                 return accFilterValues || matchesValue;
//                             },
//                             false
//                         );
//                         return passesFilter && accFilters;
//                     },
//                     true
//                 );
//             }
//         );

//         let data = {...dataset.data, values: filteredValues};

//         dataset = new DauDataset(data);
//         return dataset;
//     }

//     getFilteredDatasets(data, filters) {
//         console.log("DauDashboard.getFilteredDatasets");
//         let filteredData = this.datasets.reduce(
//             (acc, ds) => {
//                 if(ds.name in data) {
//                     acc[[ds.name]] = this.filterDataset(data[[ds.name]], filters);
//                 }
//                 return acc;
//             },
//             {}
//         );

//         return filteredData;
//     }

//     groupDatasets(datasetRegistry, groupby){

//         if(groupby === null) {
//             return [{groupKey: "all", datasetRegistry}];
//         }
        
//         let datasetNames = Object.keys(datasetRegistry);

//         let groupKeys = datasetNames.reduce(
//             (accGroups, datasetName) => {
//                 let dataset = datasetRegistry[[datasetName]];
//                 dataset.values(groupby).reduce(
//                     (accValues, value) => {
//                         if(value !== undefined){
//                             accGroups[[value]] = true;
//                         }
//                         return null;
//                     },
//                     {}
//                 );
//                 return accGroups;
//             },
//             {}
//         );
//         groupKeys = Object.keys(groupKeys);
        
//         let groupedDatasetRegistry = groupKeys.map(
//             groupKey => {
//                 let filteredDatasetRegistry = datasetNames.reduce(
//                     (acc, datasetName) => {
//                         let dataset = datasetRegistry[[datasetName]];
//                         let filteredDataset = dataset.filter(groupby, groupKey);
//                         acc[[datasetName]] = filteredDataset;
//                         return acc;
//                     },
//                     {}
//                 );
//                 return {groupKey: groupKey, datasetRegistry: filteredDatasetRegistry};
//             }
//         );

//         return groupedDatasetRegistry;
//     }

//     render() {
//         console.log("DauDashboard.render()");
//         console.log(this.props.data);
//         console.log(this.state);
//         const filteredDatasets = this.getFilteredDatasets(this.props.data, this.state.filters);
//         const groupedDatasets = this.groupDatasets(filteredDatasets, this.state.groupby);

//         return (
//             <div className="container dashboard-container" id="dashboard-container">
//               <div className="row">
//                 <div className="col-12">
//                   <DauChart
//                     data={filteredDatasets}
//                     groupedData={groupedDatasets}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
//               </div>

//               <div className="row">
                
//                 <div className="col-md-6">
//                   <DauByTenureTypeChart
//                     datasetRegistry={this.props.data}
//                     filters={this.state.filters}
//                     toggleFilter={this.toggleFilter}
//                     setGroupBy={this.setGroupBy}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
                
//                 <div className="col-md-6">
//                   <DauByClientChart
//                     datasetRegistry={this.props.data}
//                     filters={this.state.filters}
//                     toggleFilter={this.toggleFilter}
//                     setGroupBy={this.setGroupBy}
//                     tooltip={this.tooltip}
//                   />
//                 </div>
                
//               </div>
              
//               <div className="tooltip" styles="opacity: 0"/>
//             </div>
//         );
//     }

//     setGroupBy(groupby) {
//         console.log("DauDashboard.setGroupBy");
//         this.setState({groupby: groupby});
//     }

//     toggleFilter({variable, value}) {
//         console.log("toggleFilter");
        
//         let filters = this.state.filters;
//         let filterIndex = filters.map(f=>f.variable).indexOf(variable);
//         if(filterIndex !== -1) {
//             let filter = filters[filterIndex];
//             let values = filter.values;
//             let valueIndex = values.indexOf(value);
//             if(valueIndex !== -1){
//                 values = values.filter(v=>v!==value);
//             } else {
//                 values = [...values, value];
//             }
//             filter = {...filter, values: values};
//             filters[filterIndex] = filter;
//         } else {
//             let filter = {variable: variable, values: [value]};
//             filters = [...filters, filter];
//         }
//         this.setState({filters: filters});
//     }
// };

// export default DauDashboard;
