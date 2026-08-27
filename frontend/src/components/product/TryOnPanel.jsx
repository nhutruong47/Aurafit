import { useEffect, useRef, useState } from 'react';
import { generateTryOn } from '../../services/tryOnService';

const ACCENT = '#99854e';

const TIPS = [
  'Dùng ảnh toàn thân hoặc nửa thân rõ mặt',
  'Ánh sáng tốt, nền đơn giản',
  'Nhìn thẳng vào camera',
  'Chỉ có một người trong ảnh',
];

const AI_TIPS = [
  'AI đang phân tích ảnh của bạn...',
  'Đang khớp chất liệu & độ rủ vải...',
  'Đang mặc trang phục lên cơ thể...',
  'Điều chỉnh ánh sáng & bóng đổ...',
  'Giữ nguyên khuôn mặt & chi tiết...',
  'Sắp xong! Đang hoàn thiện kết quả...',
];

function RippleLoader() {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: `${(i + 1) * 28}%`,
            height: `${(i + 1) * 28}%`,
            borderColor: ACCENT,
            opacity: 1 - i * 0.2,
            animation: `tryon-ripple 2s ease-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
      <div
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, #c4b07a, ${ACCENT})`,
          boxShadow: `0 0 24px ${ACCENT}60`,
          animation: 'tryon-pulse-orb 1.5s ease-in-out infinite',
        }}
      >
        <span className="material-symbols-outlined text-[28px] text-white">checkroom</span>
      </div>
    </div>
  );
}

function WaveBars() {
  return (
    <div className="flex h-8 items-end gap-1">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full"
          style={{
            background: `linear-gradient(to top, ${ACCENT}, #c4b07a)`,
            animation: `tryon-wave-bar 1.2s ease-in-out ${i * 0.1}s infinite`,
            height: '100%',
          }}
        />
      ))}
    </div>
  );
}

function RotatingTip() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % AI_TIPS.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <p
      className="max-w-[200px] text-center text-xs font-medium leading-relaxed transition-opacity duration-300"
      style={{ color: ACCENT, opacity: fade ? 1 : 0 }}
    >
      {AI_TIPS[idx]}
    </p>
  );
}

export default function TryOnPanel({ productId, productName, productImageUrl }) {
  const [step, setStep] = useState('idle');
  const [personFile, setPersonFile] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file?.type?.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh tối đa 10MB');
      return;
    }
    setError('');
    setPersonFile(file);
    setPersonPreview(URL.createObjectURL(file));
  };

  const handleTryOn = async () => {
    if (!personFile) return;
    setStep('processing');
    setError('');
    try {
      const data = await generateTryOn({
        personImage: personFile,
        garmentImageUrl: productImageUrl || '',
        productId,
        productName,
      });
      setResultUrl(data.resultUrl);
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('idle');
    setPersonFile(null);
    setPersonPreview(null);
    setResultUrl(null);
    setError('');
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `aurafit-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(resultUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ url: resultUrl, title: 'Kết quả thử đồ AuraFit' });
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(resultUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        alert('Trình duyệt không hỗ trợ sao chép link');
      }
    }
  };

  const isProcessing = step === 'processing';
  const isDone = step === 'result';

  return (
    <>
      <style>{`
        @keyframes tryon-ripple {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tryon-pulse-orb {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.12); }
        }
        @keyframes tryon-wave-bar {
          0%, 100% { transform: scaleY(0.3); }
          50%       { transform: scaleY(1); }
        }
        @keyframes tryon-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        {/* Upload */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
              style={{ background: ACCENT }}
            >
              1
            </span>
            <p className="text-sm font-bold text-[#1A1A1A]">Tải ảnh của bạn</p>
          </div>

          <div
            onClick={() => !personPreview && fileRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onDragOver={(e) => e.preventDefault()}
            className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all ${
              personPreview ? 'border-gray-200' : 'cursor-pointer'
            }`}
            style={{ borderColor: personPreview ? '#e5e7eb' : ACCENT, minHeight: 220 }}
          >
            {personPreview ? (
              <>
                <img
                  src={personPreview}
                  alt="Ảnh của bạn"
                  className="w-full object-contain"
                  style={{ maxHeight: 480, background: '#f9f9f9' }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[11px] text-white transition-colors hover:bg-black"
                >
                  ✕
                </button>
                <div
                  className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: ACCENT }}
                >
                  ✓ Đã chọn
                </div>
              </>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2 px-4">
                <span className="material-symbols-outlined text-[40px] opacity-60" style={{ color: ACCENT }}>
                  cloud_upload
                </span>
                <p className="text-center text-sm font-bold text-[#1A1A1A]">Tải ảnh lên</p>
                <p className="text-xs text-gray-400">JPG, PNG hoặc WEBP · tối đa 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {!personPreview && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              Chọn ảnh
            </button>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500">Mẹo để có kết quả đẹp:</p>
            <div className="space-y-1.5">
              {TIPS.map((tip) => (
                <div key={tip} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: ACCENT }}>
                    check
                  </span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black"
              style={{
                background: isProcessing ? ACCENT : '#f3f4f6',
                color: isProcessing ? 'white' : '#9ca3af',
              }}
            >
              2
            </span>
            <p className={`text-sm font-bold ${isProcessing ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
              AI đang xử lý
            </p>
          </div>

          <div
            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 px-4 py-8 transition-all duration-500"
            style={{
              minHeight: 220,
              borderColor: isProcessing ? `${ACCENT}40` : '#f3f4f6',
              borderStyle: isProcessing ? 'solid' : 'dashed',
              background: isProcessing ? 'linear-gradient(135deg, #faf8f2 0%, #fff 100%)' : 'transparent',
            }}
          >
            {isProcessing ? (
              <>
                <RippleLoader />
                <WaveBars />
                <RotatingTip />
                <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-[#f0ebe0]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${ACCENT} 50%, transparent 100%)`,
                      backgroundSize: '200% 100%',
                      animation: 'tryon-shimmer 1.5s linear infinite',
                    }}
                  />
                </div>
              </>
            ) : isDone ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: `${ACCENT}15` }}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ color: ACCENT }}>
                    check
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">Hoàn tất!</p>
                <p className="text-center text-xs text-gray-400">Kết quả đã sẵn sàng</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-40">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-gray-200">
                  <span className="text-base font-black text-gray-300">AI</span>
                </div>
                <p className="text-xs text-gray-400">Chờ ảnh của bạn...</p>
              </div>
            )}
          </div>

          {(step === 'idle' || step === 'error') && (
            <>
              {error && <p className="text-center text-xs font-medium text-red-500">{error}</p>}
              <button
                type="button"
                onClick={handleTryOn}
                disabled={!personFile}
                className="w-full rounded-xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: personFile ? ACCENT : '#d1d5db' }}
              >
                Thử đồ ngay ✦
              </button>
              <p className="text-center text-[10px] text-gray-400">
                Ảnh chỉ dùng để thử đồ ảo và không được lưu lâu dài.
              </p>
            </>
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black"
              style={{
                background: isDone ? ACCENT : '#f3f4f6',
                color: isDone ? 'white' : '#9ca3af',
              }}
            >
              3
            </span>
            <p className={`text-sm font-bold ${isDone ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
              Kết quả thử đồ
            </p>
          </div>

          {isDone && resultUrl ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <img
                  src={resultUrl}
                  alt="Kết quả thử đồ"
                  className="w-full object-contain"
                  style={{ background: '#f9f9f9' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-400 hover:text-black"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Tải xuống
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-400 hover:text-black"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copySuccess ? 'check' : 'share'}
                  </span>
                  {copySuccess ? 'Đã copy link' : 'Chia sẻ'}
                </button>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl border-2 py-2.5 text-sm font-bold transition-all"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                Thử ảnh khác
              </button>
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-100"
              style={{ minHeight: 220 }}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3 opacity-60">
                  <div className="relative h-12 w-12">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className="absolute inset-0 rounded-full border"
                        style={{
                          borderColor: ACCENT,
                          animation: `tryon-ripple 1.8s ease-out ${i * 0.6}s infinite`,
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black" style={{ color: ACCENT }}>
                        ✦
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Đang tạo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <span className="material-symbols-outlined text-[56px] text-gray-300">image</span>
                  <p className="text-xs text-gray-400">Kết quả sẽ hiện ở đây</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
