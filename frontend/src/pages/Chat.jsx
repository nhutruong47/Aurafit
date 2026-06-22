import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatAdminSidebar from '../components/chat/ChatAdminSidebar';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatProductSelector from '../components/chat/ChatProductSelector';
import { formatCurrency } from '../utils/formatCurrency';
import { adminContact } from '../utils/shopMock';

export default function Chat({ onNavigate, cartItems = [] }) {
  const location = useLocation();
  const contextProduct = location.state?.contextProduct || null;
  const products = useMemo(() => {
    const selectedProducts = [];

    if (contextProduct) {
      selectedProducts.push(contextProduct);
    }

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
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      author: 'staff',
      time: 'BÃ¢y giá»',
      text: 'Xin chÃ o, AuraFit Admin Ä‘ang sáºµn sÃ ng tÆ° váº¥n sáº£n pháº©m, Ä‘Æ¡n thuÃª vÃ  thanh toÃ¡n cho báº¡n.',
    },
  ]);

  const activeProduct = useMemo(
    () => products.find((product) => product.name === activeProductName) || products[0] || null,
    [activeProductName, products]
  );

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        author: 'user',
        time: 'BÃ¢y giá»',
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
          time: 'BÃ¢y giá»',
          text: activeProduct
            ? `Admin Ä‘Ã£ ghi nháº­n yÃªu cáº§u vá» "${activeProduct.name}". ChÃºng mÃ¬nh sáº½ kiá»ƒm tra lá»‹ch thuÃª vÃ  pháº£n há»“i sá»›m.`
            : 'Admin Ä‘Ã£ ghi nháº­n tin nháº¯n. ChÃºng mÃ¬nh sáº½ pháº£n há»“i sá»›m nháº¥t cÃ³ thá»ƒ.',
        },
      ]);
    }, 500);
  };

  const sendPriceRequest = () => {
    if (!activeProduct) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        author: 'user',
        time: 'BÃ¢y giá»',
        text: `MÃ¬nh muá»‘n Ä‘Æ°á»£c admin tÆ° váº¥n giÃ¡ vÃ  lá»‹ch thuÃª cho "${activeProduct.name}" (${activeProduct.price}).`,
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        <ChatAdminSidebar products={products} />

        <section className="relative flex min-h-0 flex-1 flex-col bg-[#f9f9f9]">
          <header className="z-40 flex min-h-20 flex-shrink-0 items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9]/90 px-6 py-4 backdrop-blur-md md:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl font-normal leading-tight">{adminContact.name}</h2>
                <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <strong>Official</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                Sáº£n pháº©m chá»‰ do ADMIN Ä‘Äƒng táº£i vÃ  quáº£n lÃ½
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Xem catalog
            </button>
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
            onSendMessage={sendMessage}
          />
        </section>
      </div>
    </div>
  );
}
