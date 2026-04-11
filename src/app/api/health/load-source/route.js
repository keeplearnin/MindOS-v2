import { NextResponse } from 'next/server';
import { getAuthUser } from '../_lib/auth';
import { detectUrlType } from '../_lib/url-utils';
import { fetchChannelVideos, fetchVideoMeta, fetchTranscript } from '../_lib/youtube';
import { fetchArticle } from '../_lib/article';
import { chunkTranscript, chunkText } from '../_lib/chunker';
import { embedBatch } from '../_lib/embeddings';

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { url } = body;
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const detected = detectUrlType(url);

  try {
    if (detected.type === 'youtube_channel') {
      return await handleChannel(user, supabase, url);
    } else if (detected.type === 'youtube_video') {
      return await handleVideo(user, supabase, detected.videoId);
    } else {
      return await handleArticle(user, supabase, url);
    }
  } catch (err) {
    console.error('load-source error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load source' },
      { status: 500 }
    );
  }
}

// ─── YouTube Channel ──────────────────────────────────────────
async function handleChannel(user, supabase, url) {
  const maxVideos = 200;
  const { channelId, channelTitle, videos } = await fetchChannelVideos(url, maxVideos);

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
    type: 'youtube_channel',
    source,
    videoCount: videos.length,
  });
}

// ─── Individual YouTube Video ─────────────────────────────────
async function handleVideo(user, supabase, videoId) {
  // Fetch metadata
  const meta = await fetchVideoMeta(videoId);

  // Create source
  const { data: source, error: sourceErr } = await supabase
    .from('knowledge_sources')
    .insert({
      user_id: user.id,
      type: 'youtube_video',
      title: meta.title,
      url: meta.url,
      video_count: 1,
      status: 'loading',
      metadata: { channel: meta.channel_title },
    })
    .select()
    .single();
  if (sourceErr) throw sourceErr;

  // Create video entry
  const { data: video, error: videoErr } = await supabase
    .from('knowledge_videos')
    .insert({
      user_id: user.id,
      source_id: source.id,
      video_id: meta.video_id,
      title: meta.title,
      url: meta.url,
      duration_seconds: meta.duration_seconds,
      thumbnail_url: meta.thumbnail_url,
      transcript_status: 'loading',
      metadata: {},
    })
    .select()
    .single();
  if (videoErr) throw videoErr;

  // Fetch and process transcript immediately (single video, fast)
  let chunksCreated = 0;
  try {
    const segments = await fetchTranscript(videoId);

    if (!segments || segments.length === 0) {
      await supabase.from('knowledge_videos').update({ transcript_status: 'no_transcript' }).eq('id', video.id);
      await supabase.from('knowledge_sources').update({ status: 'ready' }).eq('id', source.id);

      return NextResponse.json({
        type: 'youtube_video',
        source: { ...source, status: 'ready' },
        video: { ...video, transcript_status: 'no_transcript' },
        chunksCreated: 0,
      });
    }

    const chunks = chunkTranscript(segments);
    const embeddings = await embedBatch(chunks.map(c => c.content));

    const chunkRows = chunks.map((chunk, i) => ({
      user_id: user.id,
      video_id: video.id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      start_seconds: chunk.start_seconds,
      end_seconds: chunk.end_seconds,
      token_count: chunk.token_count,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: chunkErr } = await supabase.from('transcript_chunks').insert(chunkRows);
    if (chunkErr) throw chunkErr;

    chunksCreated = chunks.length;

    await supabase.from('knowledge_videos')
      .update({ transcript_status: 'ready', chunk_count: chunks.length })
      .eq('id', video.id);

    await supabase.from('knowledge_sources').update({ status: 'ready' }).eq('id', source.id);
  } catch (indexErr) {
    console.error('Video indexing error:', indexErr);
    await supabase.from('knowledge_videos').update({ transcript_status: 'error' }).eq('id', video.id);
    await supabase.from('knowledge_sources')
      .update({ status: 'error', error_message: indexErr.message })
      .eq('id', source.id);
  }

  return NextResponse.json({
    type: 'youtube_video',
    source: { ...source, status: chunksCreated > 0 ? 'ready' : 'error' },
    video,
    chunksCreated,
  });
}

// ─── Article / Web Page ───────────────────────────────────────
async function handleArticle(user, supabase, url) {
  // Scrape article
  const article = await fetchArticle(url);

  // Create source
  const { data: source, error: sourceErr } = await supabase
    .from('knowledge_sources')
    .insert({
      user_id: user.id,
      type: 'article',
      title: article.title,
      url,
      video_count: 0,
      status: 'loading',
      metadata: { site_name: article.siteName, author: article.author },
    })
    .select()
    .single();
  if (sourceErr) throw sourceErr;

  // Create article entry
  const { data: articleRow, error: articleErr } = await supabase
    .from('knowledge_articles')
    .insert({
      user_id: user.id,
      source_id: source.id,
      url,
      title: article.title,
      site_name: article.siteName,
      author: article.author,
      excerpt: article.excerpt,
      word_count: article.wordCount,
      favicon_url: article.faviconUrl,
      content_status: 'loading',
    })
    .select()
    .single();
  if (articleErr) throw articleErr;

  // Chunk and embed
  let chunksCreated = 0;
  try {
    const chunks = chunkText(article.content);

    if (chunks.length === 0) {
      await supabase.from('knowledge_articles').update({ content_status: 'no_content' }).eq('id', articleRow.id);
      await supabase.from('knowledge_sources').update({ status: 'ready' }).eq('id', source.id);

      return NextResponse.json({
        type: 'article',
        source: { ...source, status: 'ready' },
        article: { ...articleRow, content_status: 'no_content' },
        chunksCreated: 0,
      });
    }

    const embeddings = await embedBatch(chunks.map(c => c.content));

    const chunkRows = chunks.map((chunk, i) => ({
      user_id: user.id,
      article_id: articleRow.id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      token_count: chunk.token_count,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: chunkErr } = await supabase.from('transcript_chunks').insert(chunkRows);
    if (chunkErr) throw chunkErr;

    chunksCreated = chunks.length;

    await supabase.from('knowledge_articles')
      .update({ content_status: 'ready', chunk_count: chunks.length })
      .eq('id', articleRow.id);

    await supabase.from('knowledge_sources').update({ status: 'ready' }).eq('id', source.id);
  } catch (indexErr) {
    console.error('Article indexing error:', indexErr);
    await supabase.from('knowledge_articles').update({ content_status: 'error' }).eq('id', articleRow.id);
    await supabase.from('knowledge_sources')
      .update({ status: 'error', error_message: indexErr.message })
      .eq('id', source.id);
  }

  return NextResponse.json({
    type: 'article',
    source: { ...source, status: chunksCreated > 0 ? 'ready' : 'error' },
    article: articleRow,
    chunksCreated,
  });
}
