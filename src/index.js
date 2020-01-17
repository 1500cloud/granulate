import granulate from "./granulate.js";
import granulateModule from "./granulate.wasm";

let Module;

function init(file) {
  console.log("INIT");
  Module = granulate({
    locateFile: path => (path.endsWith("granulate.wasm") ? granulateModule : path),
    preRun: () => {
      Module.FS.mkdir("/scratch");
      Module.FS.mount(Module.FS.filesystems.WORKERFS, { files: [file] }, "/scratch");
    },
  }).then(() => {
    const initError = Module.ccall("init", "string", ["string"], [`/scratch/${file.name}`]);
    if (initError !== "") {
      self.postMessage({ type: "INIT_FAILED", error: initError });
    } else {
      self.postMessage({ type: "INIT_COMPLETE", numStreams: Module._num_streams() });
    }
  });
}

self.onmessage = ev => {
  if (ev.data.type === "INIT") {
    init(ev.data.file);
  }
};
