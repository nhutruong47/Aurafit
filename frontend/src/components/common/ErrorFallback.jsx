export default function Fallback({ error, resetError }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Ứng dụng gặp sự cố</h1>
      <p>Đội ngũ kỹ thuật đã được thông báo. Vui lòng thử lại.</p>
      <button onClick={resetError}>Thử lại</button>
      <details style={{ marginTop: 12 }}>
        <summary>Chi tiết kỹ thuật</summary>
        <pre>{String(error)}</pre>
      </details>
    </div>
  )
}
