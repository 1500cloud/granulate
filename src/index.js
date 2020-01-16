import granulate from "./granulate.js";
import granulateModule from "./granulate.wasm";

granulate({ locateFile: path => (path.endsWith("granulate.wasm") ? granulateModule : path) }).then(
  Module => {
    Module._helloWorld();
  },
);
