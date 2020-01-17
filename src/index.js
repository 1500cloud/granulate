import granulate from "./granulate.js";
import granulateModule from "./granulate.wasm";

let Module;

function init(file) {
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
      self.postMessage({
        type: "INIT_COMPLETE",
        streams: streamMetadata(),
      });
    }
  });
}

const streamMetadata = () =>
  [...Array(Module._num_streams()).keys()].map(streamIndex => {
    if (Module._is_stream_video(streamIndex)) {
      const interlaceMode = Module.ccall("interlace_mode", "string", ["number"], [streamIndex]);
      const colorspace = Module.ccall("colorspace", "string", ["number"], [streamIndex]);
      const transferCharacteristic = Module.ccall(
        "transferCharacteristic",
        "string",
        ["number"],
        [streamIndex],
      );
      return {
        format: "urn:x-nmos:format:video",
        grainRate: {
          numerator: Module._frame_rate_numerator(streamIndex),
          denominator: Module._frame_rate_denominator(streamIndex),
        },
        interlaceMode: interlaceMode === "" ? undefined : interlaceMode,
        colorspace: colorspace === "" ? "unknown" : colorspace,
        transferCharacteristic: colorspace === "" ? undefined : transferCharacteristic,
      };
    } else if (Module._is_stream_audio(streamIndex)) {
      return {
        format: "urn:x-nmos:format:audio",
        grainRate: {
          numerator: Module._frame_rate_numerator(streamIndex),
          denominator: Module._frame_rate_denominator(streamIndex),
        },
        sampleRate: {
          numerator: Module._sample_rate_numerator(streamIndex),
          denominator: Module._sample_rate_denominator(streamIndex),
        },
        channels: [...Array(Module._num_channels(streamIndex)).keys()].map(channel => {
          const label = Module.ccall(
            "audio_channel_name",
            "string",
            ["number", "number"],
            [streamIndex, channel],
          );
          return label === ""
            ? { label: `Channel ${channel + 1}` }
            : {
                label,
                symbol: Module.ccall(
                  "audio_channel_identifier",
                  "string",
                  ["number", "number"],
                  [streamIndex, channel],
                ),
              };
        }),
      };
    } else {
      return { format: "urn:x-nmos:format:data" };
    }
  });

function nextGrain() {}

self.onmessage = ev => {
  if (ev.data.type === "INIT") {
    init(ev.data.file);
  } else if (ev.data.type === "NEXT_GRAIN") {
    nextGrain();
  }
};
