import ChatAdminSidebar from '../components/chat/ChatAdminSidebar';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatProductSelector from '../components/chat/ChatProductSelector';
import { useAiChatSession } from '../hooks/useAiChatSession';

export default function ChatPage({ onNavigate, cartItems = [], currentUser }) {
  const {
    products,
    activeProduct,
    activeProductName, setActiveProductName,
    activeRentalPeriod,
    draft, setDraft,
    messages,
    sessionError,
    isBootstrapping,
    isSending,
    typingLanguage,
    isAssistantTyping,
    sendMessage,
    handleRecommendationClick,
    sendPriceRequest,
    handleCloseSession
  } = useAiChatSession({ cartItems, currentUser, onNavigate });

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        <ChatAdminSidebar products={products} />

        <section className="relative flex min-h-0 flex-1 flex-col bg-[#f9f9f9]">
          <header className="z-40 flex min-h-20 flex-shrink-0 items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9]/90 px-6 py-4 backdrop-blur-md md:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl font-normal leading-tight">AuraFit Chatbot</h2>
                <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <strong>Tự động phản hồi</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                Chỉ đề xuất costume có thật và còn sẵn trong hệ thống
              </p>
              {activeRentalPeriod && (
                <p className="mt-2 text-xs text-[#5f5e5e]">
                  Đang ưu tiên lịch thuê từ {activeRentalPeriod.rentalStartDate} đến {activeRentalPeriod.rentalEndDate}.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCloseSession}
                className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Đóng phiên
              </button>
              <button
                onClick={() => onNavigate?.('catalog')}
                className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Xem catalog
              </button>
            </div>
          </header>

          <ChatProductSelector
            products={products}
            activeProduct={activeProduct}
            onSelectProduct={setActiveProductName}
          />

          {sessionError && (
            <div className="border-b border-[#e4c9c7] bg-[#fff6f5] px-6 py-4 text-sm text-[#a94442] md:px-8">
              {sessionError}
            </div>
          )}

          <ChatMessageList
            messages={messages}
            onNavigate={onNavigate}
            onRecommendationClick={handleRecommendationClick}
            isAssistantTyping={isAssistantTyping}
            typingLanguage={typingLanguage}
          />

          <ChatComposer
            activeProduct={activeProduct}
            draft={draft}
            isSending={isSending || isBootstrapping}
            onDraftChange={setDraft}
            onSendPriceRequest={sendPriceRequest}
            onSendMessage={() => sendMessage()}
          />
        </section>
      </div>
    </div>
  );
}
