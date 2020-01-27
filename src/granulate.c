#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
#include <stdbool.h>

AVFormatContext *format_context;
AVPacket *packet;

const char *init(char *file_path) {
    format_context = avformat_alloc_context();
    format_context->probesize = INT_MAX;
    format_context->max_analyze_duration = INT_MAX;
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

    packet = av_packet_alloc();
    if (packet == NULL) {
        return "failed to allocate memory for packet";
    }

    return "";
}

const char *read_frame() {
    int read_frame_success = av_read_frame(format_context, packet);
    if (read_frame_success < 0) {
        char *err = (char*) malloc(AV_ERROR_MAX_STRING_SIZE * sizeof(char));
        av_strerror(read_frame_success, err, AV_ERROR_MAX_STRING_SIZE);
        return err;
    }

    return "";
}

void frame_free() {
    av_packet_unref(packet);
}

int num_streams() {
    return format_context->nb_streams;
}

bool is_stream_video(int stream) {
    return format_context->streams[stream]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO;
}

bool is_stream_audio(int stream) {
    return format_context->streams[stream]->codecpar->codec_type == AVMEDIA_TYPE_AUDIO;
}

const char *codec_name(int stream) {
    const AVCodecDescriptor *descriptor = avcodec_descriptor_get(format_context->streams[stream]->codecpar->codec_id);
    if (!descriptor) {
        return "";
    }
    return descriptor->name;
}

int frame_rate_numerator(int stream) {
    return is_stream_audio(stream)
        ? format_context->streams[stream]->codecpar->sample_rate
        : format_context->streams[stream]->r_frame_rate.num;
}

int frame_rate_denominator(int stream) {
    return is_stream_audio(stream)
        ? format_context->streams[stream]->codecpar->frame_size || 1
        : format_context->streams[stream]->r_frame_rate.den;
}

int sample_rate_numerator(int stream) {
    return format_context->streams[stream]->codecpar->sample_rate;
}

int sample_rate_denominator(int stream) {
    return 1;
}

int num_channels(int stream) {
    return format_context->streams[stream]->codecpar->channels;
}

const char *audio_channel_name(int stream, int channel) {
    return av_get_channel_description(av_channel_layout_extract_channel(format_context->streams[stream]->codecpar->channel_layout, channel));
}

const char *audio_channel_identifier(int stream, int channel) {
    switch (av_channel_layout_extract_channel(format_context->streams[stream]->codecpar->channel_layout, channel)) {
        case AV_CH_FRONT_LEFT:
        case AV_CH_STEREO_LEFT:
            return "L";
        case AV_CH_FRONT_RIGHT:
        case AV_CH_STEREO_RIGHT:
            return "R";
        case AV_CH_FRONT_CENTER:
            return "C";
        case AV_CH_LOW_FREQUENCY:
            return "LFE";
        case AV_CH_BACK_LEFT:
            return "Lrs";
        case AV_CH_BACK_RIGHT:
            return "Rrs";
        case AV_CH_FRONT_LEFT_OF_CENTER:
            return "Lc";
        case AV_CH_FRONT_RIGHT_OF_CENTER:
            return "Rc";
        case AV_CH_SIDE_LEFT:
            return "Lss";
        case AV_CH_SIDE_RIGHT:
            return "Rss";
        default: {
            char *channelId = (char*) malloc(4 * sizeof(char));
            sprintf(channelId, "U%02d", channel + 1);
            return channelId;
        }
    }
}

int frame_height(int stream) {
    return format_context->streams[stream]->codecpar->height;
}

int frame_width(int stream) {
    return format_context->streams[stream]->codecpar->width;
}

const char *interlace_mode(int stream) {
    switch (format_context->streams[stream]->codecpar->field_order) {
        case AV_FIELD_PROGRESSIVE:
            return "progressive";
        case AV_FIELD_TT:
            return "interlaced_tff";
        case AV_FIELD_BB:
            return "interlaced_bff";
        default:
            return "";
    }
}

const char *colorspace(int stream) {
    return av_get_colorspace_name(format_context->streams[stream]->codecpar->color_space);
}

const char *transfer_characteristic(int stream) {
    switch (format_context->streams[stream]->codecpar->color_trc) {
        case AVCOL_TRC_SMPTE2084:
            return "PQ";
        case AVCOL_TRC_ARIB_STD_B67:
            return "HLG";
        default:
            return "";
    }
}

int stream_index() {
    return packet->stream_index;
}

int frame_data_size() {
    return packet->size;
}

uint8_t *frame_data_ptr() {
    return packet->data;
}

bool is_key_frame() {
    return (packet->flags & AV_PKT_FLAG_KEY) == AV_PKT_FLAG_KEY;
}
