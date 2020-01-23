ffmpeg_version = 4.2.2

dist/index.js: src/index.js src/granulate.js
	NODE_ENV=production node_modules/.bin/webpack

src/granulate.js: src/granulate.c
	docker run --mount type=bind,source="$(shell pwd)",target=/build --rm \
		$(shell docker build -q --build-arg ffmpeg_version=$(ffmpeg_version) .) \
		/emsdk-master/upstream/emscripten/emcc /ffmpeg-$(ffmpeg_version)/libavutil/libavutil.a \
		/ffmpeg-$(ffmpeg_version)/libavcodec/libavcodec.a /ffmpeg-$(ffmpeg_version)/libavformat/libavformat.a \
		$< \
		-o $@ \
		-O2 \
		-I/ffmpeg-$(ffmpeg_version)/ \
		-s ENVIRONMENT=worker \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s FORCE_FILESYSTEM=1 \
		-lworkerfs.js \
		-s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "FS"]' \
		-s EXPORTED_FUNCTIONS='[\
			"_init", \
		 	"_read_frame", \
		 	"_frame_free", \
		 	"_num_streams", \
		 	"_is_stream_video", \
		 	"_is_stream_audio", \
		 	"_frame_rate_numerator", \
		 	"_frame_rate_denominator", \
		 	"_sample_rate_numerator", \
		 	"_sample_rate_denominator", \
		 	"_num_channels", \
		 	"_audio_channel_name", \
		 	"_audio_channel_identifier", \
		 	"_frame_height", \
		 	"_frame_width", \
		 	"_interlace_mode", \
		 	"_colorspace", \
		 	"_transfer_characteristic", \
		 	"_stream_index", \
		 	"_frame_data_size", \
		 	"_frame_data_ptr", \
		 	"_is_key_frame" \
		]'

clean:
	rm -rf dist src/granulate.js src/granulate.wasm