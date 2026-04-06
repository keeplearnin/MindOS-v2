import OpenAI from 'openai';

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Embed a single text string, returns a 1536-dim array
export async function embedText(text) {
  const openai = getClient();
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

// Embed multiple texts in one API call (max ~8000 tokens per batch)
export async function embedBatch(texts) {
  if (texts.length === 0) return [];

  const openai = getClient();
  // OpenAI supports batching up to 2048 inputs
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return res.data.map(d => d.embedding);
}
