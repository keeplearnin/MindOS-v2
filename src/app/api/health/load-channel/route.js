import { NextResponse } from 'next/server';
import { getAuthUser } from '../_lib/auth';
import { fetchChannelVideos } from '../_lib/youtube';

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { url, maxVideos = 200 } = await request.json();
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Scrape channel videos
    const { channelId, channelTitle, videos } = await fetchChannelVideos(url, maxVideos);

    // Create the knowledge source
    const { data: source, error: sourceErr } = await supabase
      .from('knowledge_sources')
      .insert({
        user_id: user.id,
        type: 'youtube_channel',
        title: channelTitle,
        url,
        channel_id: channelId,
        video_count: videos.length,
        status: 'ready',
        metadata: { scraped_at: new Date().toISOString() },
      })
      .select()
      .single();
    if (sourceErr) throw sourceErr;

    // Insert all videos
    if (videos.length > 0) {
      const videoRows = videos.map(v => ({
        user_id: user.id,
        source_id: source.id,
        video_id: v.video_id,
        title: v.title,
        url: v.url,
        published_at: v.published_at || null,
        duration_seconds: v.duration_seconds,
        thumbnail_url: v.thumbnail_url,
        transcript_status: 'pending',
        metadata: {},
      }));

      const { error: videoErr } = await supabase
        .from('knowledge_videos')
        .insert(videoRows);
      if (videoErr) throw videoErr;
    }

    return NextResponse.json({
      source,
      videoCount: videos.length,
    });
  } catch (err) {
    console.error('load-channel error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load channel' },
      { status: 500 }
    );
  }
}
