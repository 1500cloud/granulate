FROM fedora:31

ARG ffmpeg_version

RUN dnf install -y unzip python bzip2 xz binutils diffutils make
ADD https://github.com/emscripten-core/emsdk/archive/master.zip /emsdk.zip
ADD https://ffmpeg.org/releases/ffmpeg-$ffmpeg_version.tar.bz2 /ffmpeg.tar.bz2
RUN unzip /emsdk.zip
RUN tar jxf /ffmpeg.tar.bz2

WORKDIR /emsdk-master/
RUN ./emsdk install latest
RUN ./emsdk activate latest

WORKDIR /ffmpeg-$ffmpeg_version
RUN /emsdk-master/upstream/emscripten/emconfigure ./configure \
    --target-os=none \
    --disable-runtime-cpudetect \
    --disable-pthreads \
    --disable-debug \
    --disable-stripping \
    --disable-programs \
    --disable-x86asm \
    --disable-inline-asm \
    --disable-fast-unaligned \
    --disable-avdevice \
    --disable-swresample \
    --disable-swscale \
    --disable-postproc \
    --disable-avfilter \
    --disable-network \
    --disable-encoders \
    --disable-decoders \
    --nm="/emsdk-master/upstream/bin/llvm-nm -g" \
    --ar=/emsdk-master/upstream/emscripten/emar \
    --cc=/emsdk-master/upstream/emscripten/emcc \
    --cxx=/emsdk-master/upstream/emscripten/em++ \
    --objcc=/emsdk-master/upstream/emscripten/emcc \
    --dep-cc=/emsdk-master/upstream/emscripten/emcc \
    && sed -i 's/HAVE_CBRT 0/HAVE_CBRT 1/g' config.h \
    && sed -i 's/HAVE_CBRTF 0/HAVE_CBRTF 1/g' config.h \
    && sed -i 's/HAVE_COPYSIGN 0/HAVE_COPYSIGN 1/g' config.h \
    && sed -i 's/HAVE_ERF 0/HAVE_ERF 1/g' config.h \
    && sed -i 's/HAVE_ISNAN 0/HAVE_ISNAN 1/g' config.h \
    && sed -i 's/HAVE_ISFINITE 0/HAVE_ISFINITE 1/g' config.h \
    && sed -i 's/HAVE_HYPOT 0/HAVE_HYPOT 1/g' config.h \
    && sed -i 's/HAVE_RINT 0/HAVE_RINT 1/g' config.h \
    && sed -i 's/HAVE_LRINT 0/HAVE_LRINT 1/g' config.h \
    && sed -i 's/HAVE_LRINTF 0/HAVE_LRINTF 1/g' config.h \
    && sed -i 's/HAVE_ROUND 0/HAVE_ROUND 1/g' config.h \
    && sed -i 's/HAVE_ROUNDF 0/HAVE_ROUNDF 1/g' config.h \
    && sed -i 's/HAVE_TRUNC 0/HAVE_TRUNC 1/g' config.h \
    && sed -i 's/HAVE_TRUNCF 0/HAVE_TRUNCF 1/g' config.h \
    && /emsdk-master/upstream/emscripten/emmake make

WORKDIR /build