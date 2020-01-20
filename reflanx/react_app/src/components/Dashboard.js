import React from "react";
import * as d3 from "d3";

class Dashboard extends React.Component {

    get groupby() {
        return this.state.groupby;
    }

    set groupby(groupby) {
        this.setState({groupby: groupby});
    }

    get filters() {
        return this.state.filters;
    }

    set filters(filters) {
        this.setState({filters: filters});
    }

    filterDatasetRegistry = (datasetRegistry, filters) => {
        let newDatasetRegistry = {};
        Object.keys(datasetRegistry).forEach(
            key=> {
                newDatasetRegistry = {
                    ...newDatasetRegistry,
                    [key]: this.filterDataset(datasetRegistry[key], this.state.filters)
                };
            }
        );
        return newDatasetRegistry;
    }

    groupDatasetRegistry(datasetRegistry, groupby){

        if(groupby === null) {
            return [{groupKey: "all", datasetRegistry}];
        }
        
        let datasetNames = Object.keys(datasetRegistry);

        let groupKeys = datasetNames.reduce(
            (accGroups, datasetName) => {
                let dataset = datasetRegistry[[datasetName]];
                dataset.values(groupby).reduce(
                    (accValues, value) => {
                        if(value !== undefined){
                            accGroups[[value]] = true;
                        }
                        return null;
                    },
                    {}
                );
                return accGroups;
            },
            {}
        );
        groupKeys = Object.keys(groupKeys);

        console.log("groupKeys");
        console.log(groupKeys);

        console.log(datasetRegistry);
        
        let groupedDatasetRegistry = groupKeys.map(
            groupKey => {
                console.log(`groupKey: ${groupKey}`);
                let filteredDatasetRegistry = datasetNames.reduce(
                    (acc, datasetName) => {
                        console.log(`datasetName: ${datasetName}`);
                        let dataset = datasetRegistry[[datasetName]];
                        console.log(dataset);
                        let filteredDataset = dataset.filter(groupby, groupKey);
                        console.log(filteredDataset);
                        acc[[datasetName]] = filteredDataset;
                        return acc;
                    },
                    {}
                );
                return {groupKey: groupKey, datasetRegistry: filteredDatasetRegistry};
            }
        );

        console.log(groupedDatasetRegistry);

        return groupedDatasetRegistry;
    }

    hideTooltip = () => this.tooltip.element.style("opacity", 0);

    showTooltip = (data) => this.tooltip
        .html(data)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY) + "px")
        .style("opacity", 0.9);
    
    toggleFilter = (variable, value) => {
        let filters = this.state.filters;
        let filterIndex = filters.map(f=>f.variable).indexOf(variable);
        if(filterIndex !== -1) {
            let filter = filters[filterIndex];
            let values = filter.values;
            let valueIndex = values.indexOf(value);
            if(valueIndex !== -1){
                values = values.filter(v=>v!==value);
            } else {
                values = [...values, value];
            }
            filter = {...filter, values: values};
            filters[filterIndex] = filter;
        } else {
            let filter = {variable: variable, values: [value]};
            filters = [...filters, filter];
        }
        this.setState({filters: filters});
    }
}

export default Dashboard;
