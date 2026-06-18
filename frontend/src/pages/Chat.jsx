import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { adminContact } from '../utils/shopMock';

const fallbackProductImage = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

export default function Chat({ onNavigate, contextProduct, cartItems = [] }) {
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

    return selectedProducts;
  }, [contextProduct, cartItems]);

  const [activeProductName, setActiveProductName] = useState(products[0]?.name || '');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      author: 'staff',
      time: 'Bay gio',
      text: 'Xin chao, AuraFit Admin dang san sang tu van san pham, don thue va thanh toan cho ban.',
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
        time: 'Bay gio',
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
          time: 'Bay gio',
          text: activeProduct
            ? `Admin da ghi nhan yeu cau ve "${activeProduct.name}". Chung minh se kiem tra lich thue va phan hoi som.`
            : 'Admin da ghi nhan tin nhan. Chung minh se phan hoi som nhat co the.',
        },
      ]);
    }, 500);
  };

  const sendPriceRequest = () => {
    if (!activeProduct) return;

    const price = activeProduct.price || formatCurrency(activeProduct.priceValue || 0);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        author: 'user',
        time: 'Bay gio',
        text: `Minh muon duoc admin tu van gia va lich thue cho "${activeProduct.name}" (${price}).`,
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        <aside className="flex h-auto w-full flex-shrink-0 flex-col border-b border-[#cfc4c5] bg-white md:h-full md:w-[380px] md:border-b-0 md:border-r">
          <div className="border-b border-[#cfc4c5] p-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">
              Admin support
            </p>
            <h1 className="font-serif text-3xl font-normal">Lien he AuraFit Admin</h1>
            <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
              Moi cau hoi ve san pham, gia thue, coc va thanh toan deu duoc xu ly truc tiep boi admin.
            </p>
          </div>

          <button className="grid w-full grid-cols-[64px_1fr] gap-4 bg-[#f3f3f4] p-5 text-left">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-[#cfc4c5] bg-[#eeeeee]">
              <img alt={adminContact.name} className="h-full w-full object-cover" src={adminContact.avatar} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-start justify-between gap-3">
                <h2 className="truncate font-bold text-base">{adminContact.name}</h2>
                <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999999]">
                  Online
                </span>
              </div>
              <StatusChip>{products.length || 1} ngu can tu van</StatusChip>
              <p className="mt-2 truncate text-sm text-[#5f5e5e]">Kenh lien he chinh thuc cua he thong</p>
            </div>
          </button>
        </aside>

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
                San pham chi do ADMIN dang tai va quan ly
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('catalog')}
              className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Xem catalog
            </button>
          </header>

          {products.length > 0 && (
            <div className="border-b border-[#cfc4c5] bg-white px-6 py-4 md:px-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#99854e]">
                San pham can admin tu van
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {products.map((product) => {
                  const isSelected = activeProduct?.name === product.name;
                  return (
                    <button
                      key={product.name}
                      onClick={() => setActiveProductName(product.name)}
                      className={`flex shrink-0 items-center gap-3 border px-4 py-3 text-left transition ${
                        isSelected ? 'border-[#99854e] bg-[#99854e]/5 ring-1 ring-[#99854e]' : 'border-[#cfc4c5]'
                      }`}
                    >
                      <div className="h-12 w-10 flex-shrink-0 overflow-hidden bg-[#eeeeee]">
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(event) => {
                            event.currentTarget.src = fallbackProductImage;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="w-40 truncate text-xs font-bold">{product.name}</h4>
                        <p className="mt-0.5 text-[10px] text-[#5f5e5e]">
                          {product.price || formatCurrency(product.priceValue || 0)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-8 md:px-8">
            <div className="flex items-center justify-center">
              <span className="h-px flex-1 bg-[#cfc4c5]" />
              <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#999999]">
                Hoi thoai voi admin
              </span>
              <span className="h-px flex-1 bg-[#cfc4c5]" />
            </div>

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

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
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="flex gap-3 pb-2 md:gap-4">
                {activeProduct && (
                  <button
                    onClick={sendPriceRequest}
                    className="hidden border border-black px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:bg-black hover:text-white md:block"
                  >
                    Hoi gia
                  </button>
                )}
                <button
                  onClick={sendMessage}
                  className="flex h-10 w-10 items-center justify-center bg-black text-white transition hover:bg-[#99854e]"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function StatusChip({ children }) {
  return (
    <span className="w-fit bg-[#99854e]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#99854e]">
      {children}
    </span>
  );
}

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
