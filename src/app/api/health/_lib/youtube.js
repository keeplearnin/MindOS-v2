// YouTube InnerTube API — no API key needed
// Scrapes channel videos and fetches transcripts using YouTube's internal API

const INNERTUBE_API = 'https://www.youtube.com/youtubei/v1';
const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20240101.00.00',
  hl: 'en',
  gl: 'US',
};

async function innertubeRequest(endpoint, body) {
  const res = await fetch(`${INNERTUBE_API}/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: { client: INNERTUBE_CLIENT }, ...body }),
  });
  if (!res.ok) throw new Error(`InnerTube ${endpoint} failed: ${res.status}`);
  return res.json();
}

// Resolve a channel URL to a channel ID
async function resolveChannelId(channelUrl) {
  const res = await fetch(channelUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
  });
  const html = await res.text();

  // Try meta tag first
  const metaMatch = html.match(/<meta\s+itemprop="channelId"\s+content="([^"]+)"/);
  if (metaMatch) return metaMatch[1];

  // Try browseId in page data
  const browseMatch = html.match(/"browseId"\s*:\s*"(UC[^"]+)"/);
  if (browseMatch) return browseMatch[1];

  throw new Error('Could not resolve channel ID from URL');
}

// Extract channel title from page
async function resolveChannelTitle(channelUrl) {
  const res = await fetch(channelUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
  });
  const html = await res.text();
  const match = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  return match ? match[1] : 'Unknown Channel';
}

// Extract video data from InnerTube grid/list renderers
function extractVideos(items) {
  const videos = [];
  for (const item of items) {
    const renderer = item.richItemRenderer?.content?.videoRenderer
      || item.gridVideoRenderer
      || item.videoRenderer;
    if (!renderer?.videoId) continue;

    const lengthText = renderer.lengthText?.simpleText || '';
    const parts = lengthText.split(':').map(Number);
    let durationSeconds = 0;
    if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];

    videos.push({
      video_id: renderer.videoId,
      title: renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '',
      url: `https://www.youtube.com/watch?v=${renderer.videoId}`,
      published_at: renderer.publishedTimeText?.simpleText || null,
      duration_seconds: durationSeconds || null,
      thumbnail_url: renderer.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || null,
    });
  }
  return videos;
}

// Fetch all videos from a channel (up to maxVideos)
export async function fetchChannelVideos(channelUrl, maxVideos = 200) {
  // Normalize URL to /videos tab
  let url = channelUrl.replace(/\/$/, '');
  if (!url.includes('/videos')) url += '/videos';

  const channelId = await resolveChannelId(url);
  const channelTitle = await resolveChannelTitle(url);

  const allVideos = [];
  let continuation = null;

  // First request — browse the channel's videos tab
  const browseData = await innertubeRequest('browse', {
    browseId: channelId,
    params: 'EgZ2aWRlb3PyBgQKAjoA', // Videos tab param
  });

  // Navigate to the video grid
  const tabs = browseData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find(t =>
    t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected
  );

  const sectionContents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents
    || videosTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items
    || [];

  const firstBatch = extractVideos(sectionContents);
  allVideos.push(...firstBatch);

  // Find continuation token
  const contItem = sectionContents.find(i => i.continuationItemRenderer);
  continuation = contItem?.continuationItemRenderer?.continuationEndpoint
    ?.continuationCommand?.token;

  // Paginate
  while (continuation && allVideos.length < maxVideos) {
    const contData = await innertubeRequest('browse', {
      continuation,
    });

    const actions = contData.onResponseReceivedActions || [];
    for (const action of actions) {
      const items = action.appendContinuationItemsAction?.continuationItems || [];
      const batch = extractVideos(items);
      allVideos.push(...batch);

      const nextCont = items.find(i => i.continuationItemRenderer);
      continuation = nextCont?.continuationItemRenderer?.continuationEndpoint
        ?.continuationCommand?.token || null;
    }
  }

  return {
    channelId,
    channelTitle,
    videos: allVideos.slice(0, maxVideos),
  };
}

// Fetch transcript for a single video using InnerTube
export async function fetchTranscript(videoId) {
  // First get the video page to find transcript params
  const playerData = await innertubeRequest('player', { videoId });
  const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  if (captionTracks.length === 0) return null;

  // Prefer English, fall back to first available
  const track = captionTracks.find(t => t.languageCode === 'en')
    || captionTracks.find(t => t.languageCode?.startsWith('en'))
    || captionTracks[0];

  if (!track?.baseUrl) return null;

  // Fetch the XML caption data
  const res = await fetch(track.baseUrl + '&fmt=json3');
  if (!res.ok) return null;

  const data = await res.json();
  const events = data.events || [];

  // Convert to timestamped segments
  const segments = [];
  for (const event of events) {
    if (!event.segs) continue;
    const text = event.segs.map(s => s.utf8 || '').join('').trim();
    if (!text) continue;

    segments.push({
      start_seconds: (event.tStartMs || 0) / 1000,
      duration_seconds: (event.dDurationMs || 0) / 1000,
      text,
    });
  }

  return segments;
}
