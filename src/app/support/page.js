export const metadata = {
  title: 'Support — Keel',
};

const CONTACT = 'hariperugu@gmail.com';

export default function SupportPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.6, color: 'var(--text)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Support</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
        Keel — tasks, calendar, and daily health protocol tracking.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Contact</h2>
      <p>
        Questions, bugs, or account requests:{' '}
        <a href={`mailto:${CONTACT}`} style={{ color: 'var(--accent)' }}>{CONTACT}</a>.
        We aim to reply within a few days.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Common questions</h2>

      <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '6px' }}>My daily reminder isn&rsquo;t arriving</h3>
      <p>
        Reminders are delivered by the installed iOS app, not the browser. Check that notifications
        are allowed for Keel in iOS Settings → Notifications, then re-enable the reminder in
        Keel → Settings → Daily reminder.
      </p>

      <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '6px' }}>How do I load my lab results?</h3>
      <p>
        Open Health → Tracker → Markers and choose &ldquo;Import results file&rdquo; to load a JSON
        export, or &ldquo;Enter manually&rdquo; to type values in directly. Each marker keeps its
        history, so trends appear once you have two or more readings.
      </p>

      <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '6px' }}>What is the daily goal?</h3>
      <p>
        The protocol lists sixteen habits, but the daily target is eight. Hitting eight completes
        the day; anything beyond that counts as a bonus rather than a requirement.
      </p>

      <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '6px' }}>Why did a habit tick itself?</h3>
      <p>
        Logging a qualifying number completes its habit automatically — 110 g protein, 30 g fiber,
        8,000 steps, or 7 hours of sleep. Ticking the protocol dinner also adds that meal&rsquo;s
        macros. Metrics can only complete a habit, never un-complete one.
      </p>

      <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '6px' }}>Deleting your account</h3>
      <p>
        Settings → Delete account removes your account and all associated data permanently. This
        cannot be undone.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '12px' }}>Health disclaimer</h2>
      <p>
        Keel is a personal tracking tool, not a medical device. It does not diagnose, treat, or
        offer medical advice, and reference ranges shown alongside biomarkers are for context only.
        Always discuss your results and any changes to diet, exercise, or supplements with a
        qualified healthcare provider.
      </p>

      <p style={{ marginTop: '40px' }}>
        <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
        {' · '}
        <a href="/" style={{ color: 'var(--accent)' }}>Back to Keel</a>
      </p>
    </div>
  );
}
