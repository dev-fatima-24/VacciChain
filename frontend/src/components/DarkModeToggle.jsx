export default function DarkModeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        marginLeft: 'auto',
        padding: '0.4rem 0.75rem',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--text-muted)',
        fontSize: '1rem',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
