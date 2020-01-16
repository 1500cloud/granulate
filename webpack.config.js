const path = require("path");
const process = require("process");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  devtool: process.env.NODE_ENV === "production" ? false : "eval-source-map",
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        loader: "file-loader",
      },
    ],
  },
  devServer: {
    publicPath: "/dist/",
  },
};
