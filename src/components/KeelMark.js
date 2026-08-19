// The Keel mark — a bold K whose arm and leg cut back toward the stem like a
// hull. Single source of truth for the logo; the PNG/SVG icon assets under
// assets/ and public/icons/ are generated from these same coordinates.
export default function KeelMark({ size = 32, boxed = true, color = '#ffffff', bg = '#172554' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {boxed && <rect width="512" height="512" rx="113" fill={bg} />}
      <rect x="126" y="128" width="78" height="256" rx="14" fill={color} />
      <path d="M220,238 L332,124 L388,178 L280,286 Z" fill={color} />
      <path d="M280,226 L388,334 L332,388 L220,274 Z" fill={color} />
    </svg>
  );
}
