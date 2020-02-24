import solidify from "./solidify.js";
import solidifyModule from "./solidify.wasm";

let Module;

self.onmessage = ev => {
  if (ev.data.type === "INIT") {
    init(ev.data.streams);
  } else if (ev.data.type === "FINALISE") {
    finalise();
  }
};

function init(streams) {
  Module = solidify({
    locateFile: path => (path.endsWith("solidify.wasm") ? solidifyModule : path),
  }).then(() => {
    Module.FS.mkdir("/scratch");
    const initError = Module.ccall(
      "init",
      "string",
      ["string", "number"],
      ["/scratch/export.mp4", streams.length],
    );
    if (initError !== "") {
      self.postMessage({ type: "INIT_FAILED", error: initError });
      return;
    }

    const writeHeaderError = Module.ccall("write_header", "string", [], []);
    if (writeHeaderError !== "") {
      self.postMessage({ type: "INIT_FAILED", error: writeHeaderError });
      return;
    }

    self.postMessage({ type: "INIT_COMPLETE" });
  });
}

function finalise() {
  const finaliseError = Module.ccall("finalise", "string", [], []);
  if (finaliseError !== "") {
    self.postMessage({ type: "ERROR", error: finaliseError });
    return;
  }

  const fileBlob = new Blob([Module.FS.readFile("/scratch/export.mp4")], { type: "video/mp4" });
  self.postMessage({ type: "END", blob: fileBlob });
}
