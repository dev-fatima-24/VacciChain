const bar = (w, h = 14, mb = 0) => ({
  background: '#1e293b',
  borderRadius: 6,
  width: w,
  height: h,
  marginBottom: mb,
  animation: 'vacciPulse 1.4s ease-in-out infinite',
});

const card = {
  border: '1px solid #334155',
  borderRadius: 12,
  padding: '1.25rem',
  marginBottom: '1rem',
};

export default function NFTCardSkeleton({ count = 3 }) {
  return (
    <>
      <style>{`@keyframes vacciPulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={bar('55%', 16)} />
            <div style={bar(40)} />
          </div>
          <div style={bar('40%', 13, 6)} />
          <div style={bar('60%', 12)} />
        </div>
      ))}
    </>
  );
}
