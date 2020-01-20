import Dataset from "./dataset";

class ActivationFunnel extends Dataset {
    constructor(data) {
	super(
	    ["date"],
	    "activation-funnel",
	    undefined,
	    data
	)
    }

    filter(variable, value)  {
        console.log("ActivationFunnel.filter");
        let index = this.headerIndex(variable);
        console.log(this.data);
        let filteredValues = this.data.values.filter(
            row=>{
                return row[index] === value;
            }
        );
        let filteredData = {...this.data, values: filteredValues};
	// let newDataset = {...this, _data: filteredData};
	let newDataset = new ActivationFunnel(filteredData)
	return newDataset;
    }
}

export default ActivationFunnel;
