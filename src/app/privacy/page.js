export const metadata = {
  title: 'Privacy Policy — Keel',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, color: 'var(--text)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>Last updated: April 25, 2026</p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>What we collect</h2>
      <p>Keel is a personal productivity app. We collect only what is necessary to operate the features you use:</p>
      <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
        <li><strong>Account info</strong> — your email and name from your sign-in provider (Google).</li>
        <li><strong>Your content</strong> — tasks, inbox items, projects, calendar events, journal entries, mood logs, weekly reviews, and health-related sources you save.</li>
        <li><strong>Health &amp; fitness data</strong> — the habits, daily metrics (weight, calories and macros, fiber, sleep, steps, fasting glucose), blood pressure readings, and biomarker results you choose to record or import. This data is entered by you; Keel does not read from Apple Health or any other health service.</li>
        <li><strong>Google integrations (optional)</strong> — if you connect Google Calendar, Tasks, or Gmail, we request only read-only scopes needed to display your data inside Keel. Tokens are stored encrypted by Supabase Auth.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>How we use it</h2>
      <p>Your data is used solely to provide Keel features to you. We do not sell, rent, or share your data with advertisers or unrelated third parties.</p>

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

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Health data</h2>
      <p>
        Health and fitness data you record is stored in your own account and protected by row-level
        security, so it is readable only by you. It is never used for advertising, never sold, and
        never shared with data brokers or unrelated third parties. Deleting your account removes it
        permanently along with everything else.
      </p>
      <p style={{ marginTop: '12px' }}>
        Keel is a personal tracking tool, not a medical device. It does not diagnose or treat any
        condition, and reference ranges shown alongside biomarkers are for context only.
      </p>

      <p style={{ marginTop: '40px' }}>
        <a href="/support" style={{ color: 'var(--accent)' }}>Support</a>
        {' · '}
        <a href="/" style={{ color: 'var(--accent)' }}>← Back to Keel</a>
      </p>
    </div>
  );
}
