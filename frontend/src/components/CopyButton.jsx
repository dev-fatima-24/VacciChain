import { useState, useCallback } from 'react';

/**
 * A small copy-to-clipboard button with a brief 'Copied!' tooltip.
 * Accessible via keyboard (focusable, responds to Enter/Space).
 */
export default function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy(e);
    }
  }, [handleCopy]);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.4rem' }}>
      <button
        type="button"
        onClick={handleCopy}
        onKeyDown={handleKeyDown}
        aria-label={copied ? 'Copied!' : (label ? `Copy ${label}` : 'Copy to clipboard')}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.15rem 0.25rem',
          borderRadius: 4,
          color: copied ? '#4ade80' : '#64748b',
          fontSize: '0.85rem',
          lineHeight: 1,
          transition: 'color 0.15s',
          verticalAlign: 'middle',
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#38bdf8'; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = '#64748b'; }}
      >
        {copied ? '✓' : '⎘'}
      </button>
      {copied && (
        <span
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#4ade80',
            fontSize: '0.72rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          Copied!
        </span>
      )}
    </span>
  );
}
