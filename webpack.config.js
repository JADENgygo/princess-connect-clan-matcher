const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = (env, argv) => {
	const config = {
		entry: './src/app.ts',
		output: {
			path: path.resolve(__dirname, './dist'),
			filename: 'app.js'
		},
		module: {
			rules: [
				{
					test: /\.css$/,
					use: [
						'vue-style-loader',
						'style-loader',
						'css-loader'
					]
				},
				{
					test: /\.vue$/,
					loader: "vue-loader"
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				},
				{
					test: /\.ttf$/,
					loader: 'file-loader',
					options: {
						name: '[name].[ext]',
						outputPath: '.',
					}
				},
				{
					test: /\.webp$/,
					loader: 'url-loader',
					options: {
						esModule: false
					}
				},
				{
					test: /\.ts$/,
					use: [{
						loader: 'ts-loader',
						options: {
							appendTsSuffixTo: [/\.vue$/]
						}
					}]
				}
			]
		},
		resolve: {
			extensions: ['.ts', '.js', '.vue', '.json'],
			alias: {
				'vue$': 'vue/dist/vue.esm.js'
			}
		},
		plugins: [
			new VueLoaderPlugin(),
		],
		devServer: {
			contentBase: path.join(__dirname, 'dist'),
			open: true,
			watchContentBase: true,
			writeToDisk: true,
		}
	};
	if (argv.mode === 'development') {
		config.devtool = 'source-map';
	}
	return config;
};
