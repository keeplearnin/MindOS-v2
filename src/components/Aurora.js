// Ambient colour wash sitting behind every page. Glass surfaces need
// something to refract — over a flat background they read as plain panels.
// Fixed and pointer-events:none, so it never interferes with layout or input.
export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span style={{ width: 460, height: 460, top: -140, left: '-10%', background: 'var(--accent)' }} />
      <span style={{ width: 380, height: 380, top: '30%', right: '-12%', background: 'var(--q2)', animationDelay: '-8s' }} />
      <span style={{ width: 320, height: 320, bottom: '-10%', left: '26%', background: 'var(--q3)', animationDelay: '-16s' }} />
    </div>
  );
}
