import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuthUser } from '../_lib/auth';
import { embedText } from '../_lib/embeddings';

const anthropic = new Anthropic();

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { question, maxChunks = 8 } = await request.json();
  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  try {
    // Embed the question
    const queryEmbedding = await embedText(question);

    // Vector search for relevant transcript chunks
    const { data: matches, error: matchErr } = await supabase
      .rpc('match_transcript_chunks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_user_id: user.id,
        match_count: maxChunks,
        match_threshold: 0.3,
      });
    if (matchErr) throw matchErr;

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer: 'I don\'t have enough indexed content to answer this question. Try loading more sources or indexing transcripts first.',
        citations: [],
        queryId: null,
      });
    }

    // Enrich matches with video titles
    const videoIds = [...new Set(matches.map(m => m.video_id))];
    const { data: videos } = await supabase
      .from('knowledge_videos')
      .select('id, title, url, video_id')
      .in('id', videoIds);

    const videoMap = {};
    for (const v of (videos || [])) {
      videoMap[v.id] = v;
    }

    // Build context for Claude
    const context = matches.map((match, i) => {
      const video = videoMap[match.video_id] || {};
      const timestamp = Math.floor(match.start_seconds || 0);
      return `[${i + 1}] From "${video.title || 'Unknown'}" (${formatTimestamp(timestamp)}):\n${match.content}`;
    }).join('\n\n---\n\n');

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a health research assistant. Answer questions based on the provided expert content.
Rules:
- Base your answer ONLY on the provided source material
- Cite sources using [N] markers (e.g. [1], [2]) corresponding to the numbered passages
- Be specific and actionable
- Include relevant dosages, timing, and protocols when mentioned in sources
- Always note that this is from expert content, not medical advice
- If the sources don't contain enough info to answer, say so`,
      messages: [{
        role: 'user',
        content: `Question: ${question}\n\nSource material:\n\n${context}`,
      }],
    });

    const answer = message.content[0].text;
    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

    // Build citations
    const citations = matches.map((match, i) => {
      const video = videoMap[match.video_id] || {};
      const timestamp = Math.floor(match.start_seconds || 0);
      return {
        index: i + 1,
        video_title: video.title || 'Unknown',
        video_url: video.url || '',
        youtube_video_id: video.video_id || '',
        timestamp_seconds: timestamp,
        timestamp_url: video.video_id
          ? `https://www.youtube.com/watch?v=${video.video_id}&t=${timestamp}s`
          : '',
        chunk_content: match.content.substring(0, 200) + (match.content.length > 200 ? '...' : ''),
        similarity: match.similarity,
      };
    });

    // Save to database
    const { data: query, error: saveErr } = await supabase
      .from('health_queries')
      .insert({
        user_id: user.id,
        question,
        answer,
        citations,
        model: 'claude-sonnet-4-20250514',
        tokens_used: tokensUsed,
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    return NextResponse.json({
      answer,
      citations,
      queryId: query.id,
      tokensUsed,
    });
  } catch (err) {
    console.error('ask error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process question' },
      { status: 500 }
    );
  }
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
