import axios from 'axios';


class Dataset {

    get apiEndpoint() {
        return this._apiEndpoint;
    }

    set apiEndpoint(a) {
        this._apiEndpoint = a;
    }

    get data() {
        return this._data;
    }

    set data(data) {
        this._data = data;
    }

    get datetimeVariables() {
        return this._datetimeVariables;
    }

    set datetimeVariables(d) {
        this._datetimeVariables = d;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }
    
    constructor(datetimeVariables, name, apiEndpoint, data) {
	console.log("Dataset.constructor");
        this._data = data;
	this._datetimeVariables = datetimeVariables;
	this._name = name;
        this._apiEndpoint = apiEndpoint !== undefined ?
            apiEndpoint :
            `/api/get-dashboard-data/${this.name}`;


        console.log(this.name);
        console.log(this.apiEndpoint);
	
        if(this.data !== undefined){
            this.data = this.processData(this.data);
        }

        this.filter = this.filter.bind(this);

    }

    // filter(variable, value)  {
    //     console.log("Dataset.filter");
    //     let index = this.headerIndex(variable);
    //     console.log(this.data);
    //     let filteredValues = this.data.values.filter(
    //         row=>{
    //             return row[index] === value;
    //         }
    //     );
    //     let filteredData = {...this.data, values: filteredValues};
    // 	let newDataset = {...this, _data: filteredData};
    // 	return newDataset;
    // }

    getDataset(){
        console.log(`Dataset.getDataset(${this.name})`);
        return axios.get(this.apiEndpoint)
            .then(
                response=>{
                    this.data = response.data;
                    this.data = this.processData(response.data);
                    return this;
                }
            )
            .catch(error=>console.log(error));
    };

    headers() {
        return this.data.headers;
    }

    headerIndex(header) {
        return this.data.headers.indexOf(header);
    }

    processData(data){
        let newData = {...data};
        let filterIndices = this.datetimeVariables.map(v=>this.headerIndex(v));
        data.values.map(
            (d, rowNumber) => {
                this.datetimeVariables.map(
                    (v, i) => {
                        newData.values[rowNumber][filterIndices[i]] = new Date(
                            data.values[rowNumber][filterIndices[i]]
                        );
			return null;
                    }
                );
		return null;
            }
        );
        return newData;
    }

    values = (variable) => {
        if(variable === undefined){
            return this.data.values;
        } else {
            return this.data.values.map(d=>d[this.headerIndex(variable)]);
        }
    };
    
}

export default Dataset;
