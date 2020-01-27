import granulate from "./granulate.js";
import granulateModule from "./granulate.wasm";
import {
  add,
  taiTimestampFromMediaTimestamp,
  taiTimestampToMediaTimestamp,
} from "@1500cloud/taitimestamp";

let Module;
let grainBuffer;

self.onmessage = ev => {
  if (ev.data.type === "INIT") {
    init(ev.data.file);
  } else if (ev.data.type === "NEXT_GRAIN") {
    nextGrain();
  }
};

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
      grainBuffer = {};
      streamIndexes().forEach(i => (grainBuffer[i] = []));
      self.postMessage({
        type: "INIT_COMPLETE",
        streams: streamMetadata(),
      });
    }
  });
}

function nextGrain() {
  // TODO: containers for long GOP
  const readFrameError = Module.ccall("read_frame", "string", [], []);
  if (readFrameError === "End of file") {
    if (Object.keys(grainBuffer).length === 0) {
      self.postMessage({ type: "EOF" });
    } else {
      const streamIndex = Object.keys(grainBuffer)[0];
      sendGrain(streamIndex);
      delete grainBuffer[streamIndex];
    }
    return;
  }

  if (readFrameError !== "") {
    self.postMessage({ type: "ERROR", error: readFrameError });
    return;
  }

  const frameDataPtr = Module._frame_data_ptr();
  const frame = {
    data: Module.HEAPU8.slice(frameDataPtr, frameDataPtr + Module._frame_data_size()),
    ts: taiTimestampFromMediaTimestamp(Module.ccall("frame_ts", "string", [], [])),
    duration: taiTimestampFromMediaTimestamp(Module.ccall("frame_duration", "string", [], [])),
  };
  const streamIndex = Module._stream_index();
  const isKeyframe = Module._is_key_frame();
  let needMoreFrames = false;
  if (isKeyframe) {
    if (grainBuffer[streamIndex].length === 1) {
      sendGrain(streamIndex);
    } else if (grainBuffer[streamIndex].length > 1) {
      // This grain is a GOP
      grainBuffer[streamIndex].push(frame);
      sendGrain(streamIndex);
    } else {
      needMoreFrames = true;
    }
    grainBuffer[streamIndex] = [frame];
  } else {
    grainBuffer[streamIndex].push(frame);
    needMoreFrames = true;
  }
  Module._frame_free();
  if (needMoreFrames) {
    nextGrain();
  }
}

function sendGrain(streamIndex) {
  self.postMessage({
    type: "GRAIN",
    streamIndex,
    data: new Blob(grainBuffer[streamIndex].map(({ data }) => data)),
    ts: taiTimestampToMediaTimestamp(grainBuffer[streamIndex][0].ts),
    duration: taiTimestampToMediaTimestamp(
      grainBuffer[streamIndex].map(({ duration }) => duration).reduce(add),
    ),
  });
}

const streamIndexes = () => [...Array(Module._num_streams()).keys()];

const streamMetadata = () =>
  streamIndexes().map(streamIndex => {
    if (Module._is_stream_video(streamIndex)) {
      const interlaceMode = Module.ccall("interlace_mode", "string", ["number"], [streamIndex]);
      const colorspace = Module.ccall("colorspace", "string", ["number"], [streamIndex]);
      const transferCharacteristic = Module.ccall(
        "transfer_characteristic",
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
        mimeType: mimeTypeFromCodec(
          Module.ccall("codec_name", "string", ["number"], [streamIndex]),
        ),
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
        mimeType: mimeTypeFromCodec(
          Module.ccall("codec_name", "string", ["number"], [streamIndex]),
        ),
      };
    } else {
      return { format: "urn:x-nmos:format:data" };
    }
  });

const mimeTypeFromCodec = codecName => {
  switch (codecName) {
    case "h264":
      return "video/h264";
    case "mp3":
      return "audio/mpeg";
    case "ac3":
      return "audio/ac3";
    default:
      console.warn(`Unknown MIME type for codec name: ${codecName}`);
      return "";
  }
};
