class Canvas {
    constructor(container, padding=null, width=null, height=null){
	this.container = container;
	this.padding = padding ? padding : {top: 15, left: 50, right: 30, bottom: 50}
	this.width = width ? width : parseInt(container.style("width"));
	this.height = height ? height : 300;
	this.element = this.container.append("svg")
	    .attr("class", "canvas")
	    .attr("height", this.height)
	    .attr("width", this.width);
    }
}

export default Canvas;
