export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F6F1E8]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#DED2C2] border-t-[#756536]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#756536]">Đang tải</span>
      </div>
    </div>
  );
}
