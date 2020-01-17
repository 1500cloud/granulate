#include <libavformat/avformat.h>
#include <libavutil/error.h>

AVFormatContext *format_context;

char *init(char *file_path) {
    format_context = avformat_alloc_context();
    int open_success = avformat_open_input(&format_context, file_path, NULL, NULL);
    if (open_success != 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(open_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    int stream_info_success = avformat_find_stream_info(format_context,  NULL);
    if (stream_info_success < 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(stream_info_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    return "";
}

int num_streams() {
    return format_context->nb_streams;
}