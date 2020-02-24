#include <libavformat/avformat.h>
#include <libavutil/avutil.h>

AVFormatContext *output_context;

const char *init(const char* filename, int num_streams) {
    int alloc_success = avformat_alloc_output_context2(&output_context, NULL, NULL, filename);
    if (alloc_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(alloc_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    for (int i = 0; i < num_streams; i += 1) {
        AVStream *out_stream = avformat_new_stream(output_context, NULL);
        if (out_stream == NULL) {
          return "unable to allocate stream";
        }
    }

    int open_success = avio_open(&output_context->pb, filename, AVIO_FLAG_WRITE);
    if (open_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(open_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    return "";
}

void configure_video_stream(
    int stream_index,
    const char *codec_id,
    int frame_width,
    int frame_height,
    int frame_rate_denominator,
    int frame_rate_numerator,
    const char *interlace_mode,
    const char *colorspace,
    const char *transfer_characteristic
) {

}

void configure_audio_stream(
    int stream_index,
    const char *codec_id,
    int frame_width,
    int frame_height,
    int frame_rate_denominator,
    int frame_numerator,
    const char *interlace_mode,
    const char *colorspace,
    const char *transfer_characteristic
) {

}

const char *write_header() {
    int write_success = avformat_write_header(output_context, NULL);
    if (write_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(write_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    return "";
}

const char *finalise() {
    int write_success = av_write_trailer(output_context);
    if (write_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(write_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    int close_success = avio_closep(&output_context->pb);
    if (close_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(close_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    avformat_free_context(output_context);
}