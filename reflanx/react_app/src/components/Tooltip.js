import React from "react";

class Tooltip extends React.Component {
    render() {
        if(this.props.show === true) {
            return "Tooltip";
        } else {
            return "";
        }
    }
}

export default Tooltip;


// import * as d3 from "d3";


// class Tooltip {
    
//     hide = () => {
//         console.log("Tooltip.hide");
//         let element = d3.select(".tooltip");
//         element.style("opacity", 0);
//     }
    
//     show = (data) => {
//         console.log("Tooltip.show");
//         let element = d3.select(".tooltip");        
//         element
//             .html(data)
//             .style("left", (d3.event.pageX) + "px")
//             .style("top", (d3.event.pageY - 28) + "px")
//     	    .style("opacity", 0.9);
//     }
// }

// export default Tooltip;
