import LibAV from "libav.js"

export interface ExtractedFrame {
  data: Buffer
  timestamp: number
  width: number
  height: number
}

// Use libav.js to extract actual video frames
export async function extractVideoFrames(videoBuffer: Buffer, maxFrames = 30): Promise<ExtractedFrame[]> {
  try {
    const libav = await LibAV.LibAV()
    const frames: ExtractedFrame[] = []

    // Create a temporary file in memory
    await libav.mkbuffer("video_input", videoBuffer)

    // Initialize demuxer
    const [fmt_ctx, streams] = await libav.ff_init_demuxer_file("video_input")

    // Find video stream
    let videoStreamIdx = -1
    for (let i = 0; i < streams.length; i++) {
      if (streams[i].codec_type === libav.AVMEDIA_TYPE_VIDEO) {
        videoStreamIdx = i
        break
      }
    }

    if (videoStreamIdx < 0) {
      console.log("[v0] No video stream found in file")
      return []
    }

    const videoStream = streams[videoStreamIdx]
    console.log("[v0] Found video stream - duration:", videoStream.duration, "frames:", videoStream.nb_read_packets)

    // Initialize decoder
    const [, c, pkt, frame] = await libav.ff_init_decoder(videoStream.codec_id, videoStream.codecpar)

    const totalFrames = Math.ceil((videoStream.duration * videoStream.r_frame_rate[0]) / videoStream.r_frame_rate[1])
    const sampleInterval = Math.max(1, Math.floor(totalFrames / maxFrames))

    let frameCount = 0
    let sampledFrameCount = 0

    while (true) {
      const ret = await libav.av_read_frame(fmt_ctx, pkt)
      if (ret === libav.AVERROR_EOF) break
      if (ret < 0) continue

      const pkt_stream_index = (await libav.AVPacket_stream_index(pkt)) as number
      if (pkt_stream_index !== videoStreamIdx) continue

      await libav.avcodec_send_packet(c, pkt)

      // Receive decoded frames
      while (true) {
        const ret2 = await libav.avcodec_receive_frame(c, frame)
        if (ret2 === libav.AVERROR_EAGAIN || ret2 === libav.AVERROR_EOF) break

        // Sample every Nth frame
        if (frameCount % sampleInterval === 0 && sampledFrameCount < maxFrames) {
          const width = (await libav.AVFrame_width(frame)) as number
          const height = (await libav.AVFrame_height(frame)) as number

          const data0 = (await libav.AVFrame_data(frame, 0)) as Uint8Array | null
          if (data0) {
            frames.push({
              data: Buffer.from(data0),
              timestamp: frameCount / (videoStream.r_frame_rate[0] / videoStream.r_frame_rate[1]),
              width,
              height,
            })
            sampledFrameCount++
          }
        }
        frameCount++
      }
    }

    // Cleanup
    await libav.avcodec_free_context_js(c)
    await libav.av_frame_free_js(frame)
    await libav.av_packet_free_js(pkt)
    await libav.avformat_close_input_js(fmt_ctx)

    console.log("[v0] Extracted", frames.length, "frames from video")
    return frames
  } catch (error) {
    console.error("[v0] Frame extraction error:", error)
    return []
  }
}

export async function getVideoMetadata(videoBuffer: Buffer): Promise<{
  hasVideo: boolean
  duration: number
  codec: string
  width: number
  height: number
}> {
  try {
    const libav = await LibAV.LibAV()
    await libav.mkbuffer("video_meta", videoBuffer)
    const [fmt_ctx, streams] = await libav.ff_init_demuxer_file("video_meta")

    let videoStream = null
    for (let i = 0; i < streams.length; i++) {
      if (streams[i].codec_type === libav.AVMEDIA_TYPE_VIDEO) {
        videoStream = streams[i]
        break
      }
    }

    if (!videoStream) {
      return { hasVideo: false, duration: 0, codec: "", width: 0, height: 0 }
    }

    return {
      hasVideo: true,
      duration: videoStream.duration || 0,
      codec: videoStream.codec_name || "unknown",
      width: videoStream.width || 0,
      height: videoStream.height || 0,
    }
  } catch (error) {
    console.error("[v0] Metadata extraction error:", error)
    return { hasVideo: false, duration: 0, codec: "", width: 0, height: 0 }
  }
}
