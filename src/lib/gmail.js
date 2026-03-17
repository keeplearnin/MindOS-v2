// Gmail API helper — uses the Google access token from Supabase OAuth
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function fetchEmails(accessToken, query = 'is:unread', maxResults = 20) {
  const res = await fetch(
    `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  const data = await res.json();
  if (!data.messages) return [];

  // Fetch full message details in parallel
  const messages = await Promise.all(
    data.messages.map(async (msg) => {
      const detail = await fetch(
        `${GMAIL_API}/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const d = await detail.json();
      const headers = d.payload?.headers || [];
      return {
        id: d.id,
        threadId: d.threadId,
        snippet: d.snippet,
        subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
        from: headers.find(h => h.name === 'From')?.value || '',
        date: headers.find(h => h.name === 'Date')?.value || '',
        labelIds: d.labelIds || [],
      };
    })
  );

  return messages;
}

export async function fetchEmailDetail(accessToken, messageId) {
  const res = await fetch(
    `${GMAIL_API}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}
