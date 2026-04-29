import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeModal({ url, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2 });
    }
  }, [url]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'vaccination-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vaccination QR Code"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b', borderRadius: 12, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
        }}
      >
        <h3 style={{ color: '#e2e8f0', margin: 0 }}>Vaccination QR Code</h3>
        <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleDownload}
            style={{ padding: '0.5rem 1.25rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
