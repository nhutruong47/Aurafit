import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatAdminSidebar from '../components/chat/ChatAdminSidebar';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatProductSelector from '../components/chat/ChatProductSelector';
import { formatCurrency } from '../utils/formatCurrency';

export default function ChatPage({ onNavigate, cartItems = [] }) {
  const location = useLocation();
  const contextProduct = location.state?.contextProduct || null;
  const products = useMemo(() => {
    const selectedProducts = [];
    if (contextProduct) selectedProducts.push(contextProduct);

    cartItems.forEach((item) => {
      if (!selectedProducts.some((product) => product.name === item.name)) {
        selectedProducts.push(item);
      }
    });

    return selectedProducts.map((product) => ({
      ...product,
      price: product.price || formatCurrency(product.priceValue || 0),
    }));
  }, [cartItems, contextProduct]);

  const [activeProductName, setActiveProductName] = useState(products[0]?.name || '');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'staff',
      time: 'Bây giờ',
      text: 'Xin chào, AuraFit Admin đang sẵn sàng tư vấn sản phẩm, đơn thuê và thanh toán cho bạn.',
    },
  ]);

  const activeProduct = useMemo(
    () => products.find((product) => product.name === activeProductName) || products[0] || null,
    [activeProductName, products]
  );

  const sendMessage = (textOverride) => {
    const text = (textOverride ?? draft).trim();
    if (!text) return;

    setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now(),
          author: 'user',
          time: 'Bây giờ',
          text,
        },
    ]);
    setDraft('');

    window.setTimeout(() => {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          author: 'staff',
          time: 'Bây giờ',
          text: activeProduct
            ? `Admin đã ghi nhận yêu cầu về "${activeProduct.name}". Chúng mình sẽ kiểm tra lịch thuê và phản hồi sớm.`
            : 'Admin đã ghi nhận tin nhắn. Chúng mình sẽ phản hồi sớm nhất có thể.',
        },
      ]);
    }, 700);
  };

  const sendPriceRequest = () => {
    if (!activeProduct) return;
    sendMessage(`Mình muốn được admin tư vấn giá và lịch thuê cho "${activeProduct.name}" (${activeProduct.price}).`);
  };

  const handleCloseSession = () => {
    onNavigate?.('catalog');
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        <ChatAdminSidebar products={products} />

        <section className="relative flex min-h-0 flex-1 flex-col bg-[#f9f9f9]">
          <header className="z-40 flex min-h-20 flex-shrink-0 items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9]/90 px-6 py-4 backdrop-blur-md md:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl font-normal leading-tight">AuraFit AI Assistant</h2>
                <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <strong>Official</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                Sản phẩm chỉ do ADMIN đăng tải và quản lý
              </p>
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

          <ChatMessageList messages={messages} />

          <ChatComposer
            activeProduct={activeProduct}
            draft={draft}
            onDraftChange={setDraft}
            onSendPriceRequest={sendPriceRequest}
            onSendMessage={() => sendMessage()}
          />
        </section>
      </div>
    </div>
  );
}
