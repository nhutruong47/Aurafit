// Danh sach bong tin nhan trong cuoc hoi thoai voi admin.
function MessageBubble({ message }) {
  const isUser = message.author === 'user';

  return (
    <div className={`flex max-w-lg items-end gap-3 ${isUser ? 'ml-auto justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#99854e]/10 text-[#99854e]">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
        </div>
      )}
      <div className={`${isUser ? 'bg-black text-white' : 'border border-[#cfc4c5] bg-[#f3f3f4]'} overflow-hidden p-5`}>
        <p className="leading-relaxed">{message.text}</p>
        <span className={`mt-2 block text-[9px] font-semibold uppercase tracking-[0.12em] ${isUser ? 'text-white/60' : 'text-[#999999]'}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}

export default function ChatMessageList({ messages }) {
  return (
    <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-8 md:px-8">
      <div className="flex items-center justify-center">
        <span className="h-px flex-1 bg-[#cfc4c5]" />
        <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#999999]">
          Hội thoại với admin
        </span>
        <span className="h-px flex-1 bg-[#cfc4c5]" />
      </div>

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
