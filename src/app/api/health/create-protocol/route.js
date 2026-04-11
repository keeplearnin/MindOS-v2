import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuthUser } from '../_lib/auth';

const anthropic = new Anthropic();

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { queryId } = body;
  if (!queryId) {
    return NextResponse.json({ error: 'queryId is required' }, { status: 400 });
  }

  try {
    // Load the Q&A
    const { data: query, error: queryErr } = await supabase
      .from('health_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single();
    if (queryErr || !query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Ask Claude to generate a structured protocol
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a health protocol designer. Based on the Q&A below, create a structured health experiment.
Return ONLY valid JSON with this exact structure:
{
  "title": "Short protocol name",
  "hypothesis": "If I [action], then [expected outcome] because [reasoning from sources]",
  "protocol_steps": [
    { "order": 1, "action": "What to do", "frequency": "How often", "duration": "How long", "notes": "Any details" }
  ],
  "success_criteria": [
    { "metric": "What to measure", "target": "Goal value", "measurement_method": "How to track" }
  ],
  "timeframe_days": 30
}
Make it practical, specific, and based on the cited evidence. Include 3-6 steps and 2-4 success criteria.`,
      messages: [{
        role: 'user',
        content: `Question: ${query.question}\n\nAnswer: ${query.answer}`,
      }],
    });

    const responseText = message.content[0].text;

    // Parse JSON from response (handle markdown code blocks)
    let protocolData;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
    try {
      protocolData = JSON.parse(jsonMatch[1].trim());
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse protocol from AI response' },
        { status: 500 }
      );
    }

    // Save protocol
    const { data: protocol, error: saveErr } = await supabase
      .from('health_protocols')
      .insert({
        user_id: user.id,
        query_id: queryId,
        title: protocolData.title,
        hypothesis: protocolData.hypothesis,
        protocol_steps: protocolData.protocol_steps || [],
        success_criteria: protocolData.success_criteria || [],
        timeframe_days: protocolData.timeframe_days || 30,
        status: 'draft',
        source_citations: query.citations || [],
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    return NextResponse.json({ protocol });
  } catch (err) {
    console.error('create-protocol error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create protocol' },
      { status: 500 }
    );
  }
}
