const path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: {
	'App': './fga_dashboards/static/App.js',
	'vendors': './fga_dashboards/static/vendors.js'
    },
    output: {
	path: path.resolve(__dirname, 'fga_dashboards/static/dist'),
	filename: '[name].bundle.js'
    },
    module: {
	rules: [
	    {
		test: /\.js$/,
		exclude: /(node_modules)/,
		loader: 'babel-loader',
		query: {
		    presets: ["@babel/preset-env", "@babel/preset-react"]
		}
	    },
	    {
		test: /\.css$/,
		use: ['style-loader', 'css-loader']
	    }
	]
    }
};
