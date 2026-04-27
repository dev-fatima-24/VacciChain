import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import { usePagination } from '../hooks/usePagination';
import NFTCard from '../components/NFTCard';
import NFTCardSkeleton from '../components/NFTCardSkeleton';
import RecordDetailModal from '../components/RecordDetailModal';
import CopyButton from '../components/CopyButton';
import QRCodeModal from '../components/QRCodeModal';

const styles = {
  page: { maxWidth: 700, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  btn: { padding: '0.6rem 1.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  controls: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' },
  pageBtn: {
    padding: '0.4rem 0.9rem', background: '#1e293b', color: '#e2e8f0',
    border: '1px solid #334155', borderRadius: 6, cursor: 'pointer',
  },
  pageBtnDisabled: { opacity: 0.35, cursor: 'default' },
};

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { publicKey, connect } = useAuth();
  const { fetchRecords, loading } = useVaccination();
  const [records, setRecords] = useState([]);
  const [qrRecord, setQrRecord] = useState(null);
  const { currentItems, page, totalPages, goTo, reset, total } = usePagination(records);

  const load = useCallback(() => {
    if (!publicKey) return;
    fetchRecords(publicKey).then((data) => {
      reset();
      if (data) setRecords(data.records || []);
    });
  }, [publicKey, fetchRecords]);

  useEffect(() => { load(); }, [load]);

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your wallet to view records.</p>
        <button style={styles.btn} onClick={connect} aria-label="Connect Freighter wallet to view vaccination records">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#e2e8f0', margin: 0 }}>{t('patient.title')}</h2>
        {total > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {t('patient.recordCount', { count: total })}
          </span>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
        Wallet: {publicKey}
        <CopyButton text={publicKey} label="wallet address" />
      </p>

      {loading && <NFTCardSkeleton count={3} />}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#f87171', marginBottom: '0.75rem' }}>⚠️ {error}</p>
          <button style={styles.btn} onClick={load}>Retry</button>
        </div>
      )}
      {!loading && !error && total === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#475569' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💉</p>
          <p>No vaccination records found for this wallet.</p>
        </div>
      )}

      {currentItems.map((r) => (
        <NFTCard
          key={r.token_id}
          record={r}
          onShowQR={setQrRecord}
        />
      ))}

      {qrRecord && (
        <QRCodeModal
          url={`${window.location.origin}/verify?wallet=${encodeURIComponent(publicKey)}&token=${encodeURIComponent(qrRecord.token_id)}`}
          onClose={() => setQrRecord(null)}
        />
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" style={styles.controls}>
          <button
            style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            {t('patient.prevPage')}
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {t('patient.pageOf', { page, total: totalPages })}
          </span>
          <button
            style={{ ...styles.pageBtn, ...(page === totalPages ? styles.pageBtnDisabled : {}) }}
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            {t('patient.nextPage')}
          </button>
        </nav>
      )}
    </div>
  );
}
