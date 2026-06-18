// O nhap va hanh dong gui tin nhan trong man hinh chat.
export default function ChatComposer({
  activeProduct,
  draft,
  onDraftChange,
  onSendPriceRequest,
  onSendMessage,
}) {
  return (
    <footer className="absolute bottom-0 left-0 w-full border-t border-[#cfc4c5] bg-[#f9f9f9]/90 p-4 backdrop-blur-md md:p-6">
      <div className="mx-auto flex max-w-4xl items-end gap-3 md:gap-4">
        <textarea
          className="min-h-[56px] flex-1 resize-none border-none bg-[#f3f3f4] px-5 py-4 outline-none transition placeholder:text-[#999999] focus:border-b-2 focus:border-[#99854e] focus:ring-0"
          placeholder={
            activeProduct
              ? `Nhan admin ve "${activeProduct.name}"...`
              : 'Nhap tin nhan cho admin...'
          }
          rows="1"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSendMessage();
            }
          }}
        />
        <div className="flex gap-3 pb-2 md:gap-4">
          {activeProduct && (
            <button
              onClick={onSendPriceRequest}
              className="hidden border border-black px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:bg-black hover:text-white md:block"
            >
              Hoi gia
            </button>
          )}
          <button
            onClick={onSendMessage}
            className="flex h-10 w-10 items-center justify-center bg-black text-white transition hover:bg-[#99854e]"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
