class PlotArea {
    constructor(canvas) {
	this.canvas = canvas;
	this.element = this.canvas.element.append("g")
	    .attr("class", "plot-area")
	    .attr(
		"transform",
		`translate(${this.canvas.padding.left}, ${this.canvas.padding.top})`
	    );
	this.width = this.canvas.width - this.canvas.padding.left - this.canvas.padding.right;
	this.height = this.canvas.height - this.canvas.padding.top - this.canvas.padding.bottom;
    }
}

export default PlotArea;
