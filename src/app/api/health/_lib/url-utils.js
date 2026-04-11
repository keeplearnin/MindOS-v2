// Detect URL type: YouTube channel, YouTube video, or article

export function detectUrlType(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    // YouTube video patterns
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      // /watch?v=VIDEO_ID
      if (parsed.pathname === '/watch' && parsed.searchParams.get('v')) {
        return { type: 'youtube_video', videoId: parsed.searchParams.get('v') };
      }
      // /shorts/VIDEO_ID
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return { type: 'youtube_video', videoId: shortsMatch[1] };
      }
      // /embed/VIDEO_ID
      const embedMatch = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) {
        return { type: 'youtube_video', videoId: embedMatch[1] };
      }
      // /live/VIDEO_ID
      const liveMatch = parsed.pathname.match(/^\/live\/([a-zA-Z0-9_-]+)/);
      if (liveMatch) {
        return { type: 'youtube_video', videoId: liveMatch[1] };
      }
      // Channel patterns: /@handle, /channel/UC..., /c/name, /user/name
      if (parsed.pathname.match(/^\/@[^/]+/) ||
          parsed.pathname.match(/^\/channel\//) ||
          parsed.pathname.match(/^\/c\//) ||
          parsed.pathname.match(/^\/user\//)) {
        return { type: 'youtube_channel', url };
      }
    }

    // youtu.be/VIDEO_ID (short URL)
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1).split('/')[0];
      if (videoId) {
        return { type: 'youtube_video', videoId };
      }
    }

    // Everything else is an article
    return { type: 'article', url };
  } catch {
    // If URL parsing fails, treat as article
    return { type: 'article', url };
  }
}
