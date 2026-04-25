export const metadata = {
  title: 'Privacy Policy — MindOS',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, color: 'var(--text)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: April 25, 2026</p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>What we collect</h2>
      <p>MindOS is a personal productivity app. We collect only what is necessary to operate the features you use:</p>
      <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
        <li><strong>Account info</strong> — your email and name from your sign-in provider (Google).</li>
        <li><strong>Your content</strong> — tasks, inbox items, projects, calendar events, journal entries, mood logs, weekly reviews, and health-related sources you save.</li>
        <li><strong>Google integrations (optional)</strong> — if you connect Google Calendar, Tasks, or Gmail, we request only read-only scopes needed to display your data inside MindOS. Tokens are stored encrypted by Supabase Auth.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>How we use it</h2>
      <p>Your data is used solely to provide MindOS features to you. We do not sell, rent, or share your data with advertisers or unrelated third parties.</p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Third parties</h2>
      <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
        <li><strong>Supabase</strong> — stores your account and content (encrypted at rest).</li>
        <li><strong>Anthropic</strong> — when you use the HealthOS Ask feature, your question and the relevant indexed snippets are sent to Anthropic&apos;s Claude API to generate an answer. Anthropic does not train on this data.</li>
        <li><strong>OpenAI</strong> — used to generate embeddings for indexed health sources.</li>
        <li><strong>Vercel</strong> — hosts the application.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Your rights</h2>
      <p>You can delete your account and all associated data at any time from <a href="/settings" style={{ color: 'var(--accent)' }}>Settings → Delete account</a>. This removes your auth record and cascades through all your stored content. The action is immediate and irreversible.</p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Data retention</h2>
      <p>Your data is kept until you delete your account. Backups roll off within 30 days of deletion.</p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:hariperugu@gmail.com" style={{ color: 'var(--accent)' }}>hariperugu@gmail.com</a>.</p>

      <p style={{ marginTop: '40px' }}><a href="/" style={{ color: 'var(--accent)' }}>← Back to MindOS</a></p>
    </div>
  );
}
