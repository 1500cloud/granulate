#include <libavformat/avformat.h>

void helloWorld() {
    av_register_all();
    AVFormatContext *format_context = avformat_alloc_context();
}