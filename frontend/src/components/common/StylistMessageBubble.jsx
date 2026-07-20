import AiRichText from './AiRichText';
import StylistAvatar from './StylistAvatar';

const ERROR_PRESENTATION = {
  RATE_LIMIT_EXCEEDED: {
    icon: 'schedule',
    label: 'Đã đạt giới hạn tạm thời',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  AUTH_ERROR: {
    icon: 'lock',
    label: 'Dịch vụ đang gián đoạn',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  TIMEOUT: {
    icon: 'hourglass_top',
    label: 'Phản hồi quá thời gian',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  INVALID_RESPONSE: {
    icon: 'refresh',
    label: 'Chưa thể xử lý phản hồi',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  PROVIDER_UNAVAILABLE: {
    icon: 'cloud_off',
    label: 'Dịch vụ tạm thời không khả dụng',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  NETWORK_ERROR: {
    icon: 'wifi_off',
    label: 'Mất kết nối',
    className: 'border-red-200 bg-red-50 text-red-800',
  },
};

const DEFAULT_ERROR_PRESENTATION = {
  icon: 'error',
  label: 'Có lỗi xảy ra',
  className: 'border-red-200 bg-red-50 text-red-800',
};

export default function StylistMessageBubble({ message, compact = false }) {
  const isUser = String(message.role).toUpperCase() === 'USER';
  const content = message.content ?? message.text ?? '';
  const errorPresentation = message.isError
    ? ERROR_PRESENTATION[message.errorType] || DEFAULT_ERROR_PRESENTATION
    : null;

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div
          className={`${compact ? 'max-w-[88%] px-3.5 py-2.5' : 'max-w-[82%] px-4 py-3 sm:max-w-[72%]'} rounded-2xl rounded-tr-md bg-[#1b1b1b] text-sm leading-6 text-white shadow-sm`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start gap-2.5">
      <StylistAvatar
        className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} mt-0.5 shrink-0 border border-[#bca76f] bg-white shadow-sm`}
      />
      <div
        className={`${compact ? 'max-w-[calc(100%_-_2.375rem)] px-3.5 py-3' : 'max-w-[calc(100%_-_2.625rem)] px-4 py-3.5 sm:max-w-[78%]'} rounded-2xl rounded-tl-md border shadow-[0_5px_18px_rgba(63,52,30,0.06)] ${
          errorPresentation
            ? errorPresentation.className
            : 'border-[#e4ddd2] bg-[#fffdf8] text-[#333333]'
        }`}
      >
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#9b8248]" aria-hidden="true">
            {errorPresentation?.icon || 'auto_awesome'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#806c3d]">
            {errorPresentation?.label || 'AuraFit Stylist'}
          </span>
        </div>

        {errorPresentation ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
        ) : (
          <AiRichText content={content} />
        )}
      </div>
    </div>
  );
}
