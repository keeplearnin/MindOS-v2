// Split transcript segments into overlapping chunks for embedding
// Target: ~400-500 tokens per chunk with ~50-token overlap
// Splits on sentence boundaries when possible

const TARGET_CHUNK_TOKENS = 450;
const OVERLAP_TOKENS = 50;
const AVG_CHARS_PER_TOKEN = 4; // rough estimate for English text

const TARGET_CHARS = TARGET_CHUNK_TOKENS * AVG_CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * AVG_CHARS_PER_TOKEN;

// Merge transcript segments into a single timestamped text
function mergeSegments(segments) {
  const merged = [];
  let current = { text: '', start: 0, end: 0 };

  for (const seg of segments) {
    if (current.text.length === 0) {
      current.start = seg.start_seconds;
    }
    current.text += (current.text ? ' ' : '') + seg.text;
    current.end = seg.start_seconds + (seg.duration_seconds || 0);

    // Flush at sentence boundaries when we have enough text
    if (current.text.length >= TARGET_CHARS && /[.!?]\s*$/.test(current.text)) {
      merged.push({ ...current });
      current = { text: '', start: current.end, end: current.end };
    }
  }
  if (current.text) merged.push(current);
  return merged;
}

// Split a long text at the nearest sentence boundary
function splitAtSentence(text, targetLen) {
  if (text.length <= targetLen) return [text, ''];

  // Look for sentence end near target
  let splitIdx = targetLen;
  const searchRegion = text.substring(Math.max(0, targetLen - 100), targetLen + 100);
  const sentenceEnd = searchRegion.search(/[.!?]\s/);

  if (sentenceEnd !== -1) {
    splitIdx = Math.max(0, targetLen - 100) + sentenceEnd + 2;
  }

  return [text.substring(0, splitIdx).trim(), text.substring(splitIdx).trim()];
}

// Main chunking function: takes transcript segments, returns chunks
export function chunkTranscript(segments) {
  if (!segments || segments.length === 0) return [];

  // First merge segments into larger blocks
  const merged = mergeSegments(segments);

  // Now chunk with overlap
  const chunks = [];
  let chunkIndex = 0;

  for (const block of merged) {
    let remaining = block.text;
    let blockStart = block.start;
    const totalLen = block.text.length;

    while (remaining.length > 0) {
      const [chunkText, rest] = splitAtSentence(remaining, TARGET_CHARS);

      // Estimate timestamps proportionally
      const chunkFraction = chunkText.length / totalLen;
      const chunkDuration = (block.end - block.start) * chunkFraction;

      chunks.push({
        chunk_index: chunkIndex,
        content: chunkText,
        start_seconds: Math.round(blockStart * 10) / 10,
        end_seconds: Math.round((blockStart + chunkDuration) * 10) / 10,
        token_count: Math.ceil(chunkText.length / AVG_CHARS_PER_TOKEN),
      });

      chunkIndex++;

      if (!rest) break;

      // Create overlap by including the end of the previous chunk
      const overlapText = chunkText.slice(-OVERLAP_CHARS);
      remaining = overlapText + ' ' + rest;
      blockStart += chunkDuration * (1 - OVERLAP_CHARS / chunkText.length);
    }
  }

  return chunks;
}
