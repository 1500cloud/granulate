import solidify from "./solidify.js";
import solidifyModule from "./solidify.wasm";

let Module;

self.onmessage = ev => {
  if (ev.data.type === "INIT") {
    init();
  }
};

function init() {
  Module = solidify({
    locateFile: path => (path.endsWith("solidify.wasm") ? solidifyModule : path),
  }).then(() => {
    Module._init();
    self.postMessage({
      type: "INIT_COMPLETE",
    });
  });
}
