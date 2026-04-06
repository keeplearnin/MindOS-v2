import { NextResponse } from 'next/server';
import { getAuthUser } from '../_lib/auth';
import { fetchTranscript } from '../_lib/youtube';
import { chunkTranscript } from '../_lib/chunker';
import { embedBatch } from '../_lib/embeddings';

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { sourceId, batchSize = 5 } = await request.json();
  if (!sourceId) {
    return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
  }

  try {
    // Get next batch of pending videos
    const { data: videos, error: fetchErr } = await supabase
      .from('knowledge_videos')
      .select('*')
      .eq('source_id', sourceId)
      .eq('user_id', user.id)
      .eq('transcript_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize);
    if (fetchErr) throw fetchErr;

    let processed = 0;
    const errors = [];

    for (const video of videos) {
      try {
        // Mark as loading
        await supabase
          .from('knowledge_videos')
          .update({ transcript_status: 'loading' })
          .eq('id', video.id);

        // Fetch transcript
        const segments = await fetchTranscript(video.video_id);

        if (!segments || segments.length === 0) {
          await supabase
            .from('knowledge_videos')
            .update({ transcript_status: 'no_transcript' })
            .eq('id', video.id);
          processed++;
          continue;
        }

        // Chunk transcript
        const chunks = chunkTranscript(segments);

        if (chunks.length === 0) {
          await supabase
            .from('knowledge_videos')
            .update({ transcript_status: 'no_transcript' })
            .eq('id', video.id);
          processed++;
          continue;
        }

        // Embed all chunks in batch
        const texts = chunks.map(c => c.content);
        const embeddings = await embedBatch(texts);

        // Insert chunks with embeddings
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

        const { error: chunkErr } = await supabase
          .from('transcript_chunks')
          .insert(chunkRows);
        if (chunkErr) throw chunkErr;

        // Mark video as ready
        await supabase
          .from('knowledge_videos')
          .update({
            transcript_status: 'ready',
            chunk_count: chunks.length,
          })
          .eq('id', video.id);

        processed++;
      } catch (videoErr) {
        console.error(`Error processing video ${video.video_id}:`, videoErr);
        errors.push({ videoId: video.video_id, error: videoErr.message });

        await supabase
          .from('knowledge_videos')
          .update({ transcript_status: 'error' })
          .eq('id', video.id);

        processed++;
      }
    }

    // Count remaining pending videos
    const { count: remaining } = await supabase
      .from('knowledge_videos')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', sourceId)
      .eq('user_id', user.id)
      .eq('transcript_status', 'pending');

    return NextResponse.json({ processed, remaining: remaining || 0, errors });
  } catch (err) {
    console.error('load-transcripts error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process transcripts' },
      { status: 500 }
    );
  }
}
