import { useMemo, useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { getShopByProductCategory } from '../utils/shopMock';

const mobileTabs = [
  ['theater_comedy', 'Cosplay'],
  ['event', 'Events'],
  ['forum', 'Chat'],
  ['receipt_long', 'Orders'],
];

const fallbackProductImage = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

export default function Chat({ onNavigate, contextProduct, cartItems = [] }) {
  // 1. Extract all products from contextProduct or cartItems
  const allProducts = useMemo(() => {
    const productsList = [];

    // If contextProduct is a product (not a shopContext navigation)
    if (contextProduct && !contextProduct.shopContext) {
      productsList.push(contextProduct);
    }

    // Add cart items
    cartItems.forEach((item) => {
      if (!productsList.some((p) => p.name === item.name)) {
        productsList.push(item);
      }
    });

    return productsList;
  }, [contextProduct, cartItems]);

  // 2. Group products by shop
  const shopConversations = useMemo(() => {
    const groups = {};

    // If navigation context specifies a target shop, initialize it first
    if (contextProduct?.shopContext) {
      const shop = contextProduct.shopContext;
      groups[shop.id] = {
        shop,
        products: [],
      };
    }

    // Populate products to their respective shops
    allProducts.forEach((product) => {
      const shop = getShopByProductCategory(product.category || product.rawCategory);
      if (!groups[shop.id]) {
        groups[shop.id] = {
          shop,
          products: [],
        };
      }
      if (!groups[shop.id].products.some((p) => p.name === product.name)) {
        groups[shop.id].products.push(product);
      }
    });

    return Object.values(groups);
  }, [allProducts, contextProduct]);

  // 3. States for active shop and product mapping
  const [activeShopId, setActiveShopId] = useState('');
  const [activeProductMap, setActiveProductMap] = useState({});
  const [draft, setDraft] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [messageMap, setMessageMap] = useState({});

  // Auto select first shop on load or update
  useEffect(() => {
    if (shopConversations.length > 0) {
      if (!activeShopId || !shopConversations.some((sc) => sc.shop.id === activeShopId)) {
        setActiveShopId(shopConversations[0].shop.id);
      }
    } else {
      setActiveShopId('');
    }
  }, [shopConversations, activeShopId]);

  // Resolve active shop and active product
  const activeShopConversation = useMemo(
    () => shopConversations.find((sc) => sc.shop.id === activeShopId) || shopConversations[0] || null,
    [activeShopId, shopConversations]
  );

  const activeProduct = useMemo(() => {
    if (!activeShopConversation) return null;
    const products = activeShopConversation.products;
    if (products.length === 0) return null;
    const selectedName = activeProductMap[activeShopConversation.shop.id];
    return products.find((p) => p.name === selectedName) || products[0];
  }, [activeShopConversation, activeProductMap]);

  // Retrieve messages for the current shop-product combination
  const chatKey = useMemo(() => {
    if (!activeShopConversation) return '';
    return activeProduct
      ? `${activeShopConversation.shop.id}-${activeProduct.name}`
      : `${activeShopConversation.shop.id}-general`;
  }, [activeShopConversation, activeProduct]);

  const messages = useMemo(() => {
    if (!chatKey) return [];
    if (messageMap[chatKey]) return messageMap[chatKey];

    // Default template messages
    if (activeProduct) {
      return [
        {
          id: 1,
          author: 'user',
          time: 'Bây giờ',
          text: `Mình đang quan tâm đến "${activeProduct.name}" của shop và muốn được tư vấn thêm.`,
        },
      ];
    } else {
      return [
        {
          id: 1,
          author: 'staff',
          time: 'Bây giờ',
          text: `Xin chào! Cửa hàng ${activeShopConversation?.shop.name} có thể giúp gì cho bạn?`,
        },
      ];
    }
  }, [chatKey, messageMap, activeProduct, activeShopConversation]);

  const appendMessage = (key, message) => {
    if (!key) return;
    setMessageMap((currentMap) => ({
      ...currentMap,
      [key]: [...(currentMap[key] || (activeProduct ? [
        {
          id: 1,
          author: 'user',
          time: 'Bây giờ',
          text: `Mình đang quan tâm đến "${activeProduct.name}" của shop và muốn được tư vấn thêm.`,
        }
      ] : [
        {
          id: 1,
          author: 'staff',
          time: 'Bây giờ',
          text: `Xin chào! Cửa hàng ${activeShopConversation?.shop.name} có thể giúp gì cho bạn?`,
        }
      ])), message],
    }));
  };

  const sendMessage = () => {
    if (!chatKey) return;
    const text = draft.trim();
    if (!text) return;

    appendMessage(chatKey, {
      id: Date.now(),
      author: 'user',
      time: 'Bây giờ',
      text,
    });
    setDraft('');
  };

  const handleSendOffer = (price) => {
    if (!chatKey || !activeProduct) return;
    const formattedPrice = formatCurrency(Number(price));

    appendMessage(chatKey, {
      id: Date.now(),
      author: 'user',
      time: 'Bây giờ',
      isOffer: true,
      text: `Mình muốn đề xuất mức giá thuê: ${formattedPrice}`,
      status: 'Chờ phản hồi',
    });

    window.setTimeout(() => {
      appendMessage(chatKey, {
        id: Date.now() + 1,
        author: 'staff',
        time: 'Bây giờ',
        isOfferAccepted: true,
        price: formattedPrice,
        text: `AuraFit đã ghi nhận đề xuất ${formattedPrice}. Nếu shop chấp nhận, bạn có thể thanh toán ngay tại đơn thuê.`,
      });
    }, 800);
  };

  const selectProduct = (shopId, productName) => {
    setActiveProductMap((prev) => ({
      ...prev,
      [shopId]: productName,
    }));
  };

  if (shopConversations.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 shadow-sm border border-[#cfc4c5]">
          <span className="material-symbols-outlined text-5xl text-[#99854e] mb-4">forum</span>
          <h1 className="font-serif text-3xl font-normal mb-3">Hộp thư trống</h1>
          <p className="text-sm text-[#5f5e5e] mb-6 leading-relaxed">
            Hiện tại bạn chưa có cuộc trò chuyện nào. Hãy chọn một trang phục bạn yêu thích và nhấn "Chat với cửa hàng" để bắt đầu tư vấn.
          </p>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="bg-black text-white px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-[#99854e]"
          >
            Khám phá trang phục
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        {/* Left Sidebar - Shop List */}
        <aside className="flex h-[280px] w-full flex-shrink-0 flex-col border-b border-[#cfc4c5] bg-white md:h-full md:w-[430px] md:border-b-0 md:border-r">
          <div className="border-b border-[#cfc4c5] p-6">
            <h1 className="mb-3 font-serif text-3xl font-normal">Hộp thư cửa hàng</h1>
            <div className="relative">
              <input
                className="w-full border-none bg-[#eeeeee] py-3 pl-10 pr-4 outline-none transition focus:ring-1 focus:ring-[#99854e]"
                placeholder="Tìm cửa hàng..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]">
                search
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {shopConversations.map(({ shop, products }) => {
              const isActive = activeShopId === shop.id;
              const activeProdForShop = products.find((p) => p.name === activeProductMap[shop.id]) || products[0];
              const shopKey = activeProdForShop ? `${shop.id}-${activeProdForShop.name}` : `${shop.id}-general`;
              const shopMessages = messageMap[shopKey] || [];
              const latestMsg = shopMessages[shopMessages.length - 1];

              return (
                <button
                  key={shop.id}
                  onClick={() => setActiveShopId(shop.id)}
                  className={`grid w-full cursor-pointer grid-cols-[64px_1fr] gap-4 p-5 text-left transition ${
                    isActive ? 'border-r-4 border-[#99854e] bg-[#f3f3f4]' : 'hover:bg-[#f3f3f4]'
                  }`}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-[#cfc4c5] bg-[#eeeeee]">
                    <img alt={shop.name} className="h-full w-full object-cover" src={shop.avatar} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h2 className="truncate font-bold text-base">{shop.name}</h2>
                      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999999]">
                        Bây giờ
                      </span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <StatusChip>{products.length} sản phẩm quan tâm</StatusChip>
                    </div>
                    <p className="truncate text-sm text-[#5f5e5e]">
                      {latestMsg ? latestMsg.text : `Hỏi shop về ${products.length} sản phẩm của cửa hàng`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Window */}
        {activeShopConversation && (
          <section className="relative flex min-h-0 flex-1 flex-col bg-[#f9f9f9]">
            {/* Header: Shop Info */}
            <header className="z-40 flex min-h-20 flex-shrink-0 items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9]/90 px-6 py-4 backdrop-blur-md md:px-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-3xl font-normal leading-tight">
                    {activeShopConversation.shop.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <strong>{activeShopConversation.shop.rating}</strong>
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                  {activeShopConversation.shop.address}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('shopDetail', activeShopConversation.shop)}
                className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Ghé cửa hàng
              </button>
            </header>

            {/* Product Tabs (If shop has products user is interested in) */}
            {activeShopConversation.products.length > 0 && (
              <div className="border-b border-[#cfc4c5] bg-white px-6 py-4 md:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#99854e] mb-3">
                  Chọn sản phẩm cần hỏi chủ shop:
                </p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {activeShopConversation.products.map((product) => {
                    const isSelected = activeProduct?.name === product.name;
                    return (
                      <div key={product.name} className="relative group">
                        <button
                          onClick={() => selectProduct(activeShopConversation.shop.id, product.name)}
                          className={`flex items-center gap-3 border px-4 py-3 shrink-0 transition-all duration-300 text-left cursor-pointer transform hover:-translate-y-0.5 hover:shadow-md ${
                            isSelected
                              ? 'border-[#99854e] bg-[#99854e]/5 ring-1 ring-[#99854e]'
                              : 'border-[#cfc4c5] hover:border-[#99854e] hover:bg-black/[0.01]'
                          }`}
                        >
                          <div className="h-12 w-10 flex-shrink-0 overflow-hidden bg-[#eeeeee]">
                            <img
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.src = fallbackProductImage;
                              }}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-bold w-40 transition-colors duration-300 group-hover:text-[#99854e]">{product.name}</h4>
                            <p className="text-[10px] text-[#5f5e5e] mt-0.5">
                              {product.price || formatCurrency(product.priceValue)}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[#99854e] text-lg">check_circle</span>
                          )}
                        </button>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 z-[100] mb-3 w-72 -translate-x-1/2 scale-95 opacity-0 pointer-events-none transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 bg-white border border-[#cfc4c5] shadow-2xl p-4 text-left text-[#1a1c1c]">
                          <div className="flex gap-3">
                            <div className="h-20 w-16 flex-shrink-0 overflow-hidden bg-[#eeeeee]">
                              <img
                                src={product.image}
                                alt={product.name}
                                onError={(e) => {
                                  e.currentTarget.src = fallbackProductImage;
                                }}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-[#99854e]">
                                {product.category || 'Trang phục'}
                              </p>
                              <h4 className="font-serif text-sm font-normal mt-0.5 leading-snug break-words">
                                {product.name}
                              </h4>
                              <div className="mt-2 text-[11px] space-y-0.5">
                                <p>
                                  <span className="text-[#999999] uppercase text-[9px] tracking-wider mr-1">Giá thuê:</span>
                                  <strong>{product.price || formatCurrency(product.priceValue)}</strong>
                                </p>
                                {product.depositValue && (
                                  <p>
                                    <span className="text-[#999999] uppercase text-[9px] tracking-wider mr-1">Tiền cọc:</span>
                                    <strong>{formatCurrency(product.depositValue)}</strong>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Tooltip Arrows */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white" />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#cfc4c5] -z-10 mt-[1px]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Product Bar (Món thuê đang trao đổi) */}
            {activeProduct && (
              <div className="border-b border-[#cfc4c5] bg-[#fffbf8] px-6 py-3 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#99854e] bg-[#99854e]/10 px-2 py-0.5">
                    Đang hỏi về
                  </span>
                  <span className="text-xs font-bold truncate max-w-[200px] md:max-w-md">{activeProduct.name}</span>
                </div>
                <span className="text-xs font-semibold text-[#99854e]">
                  {activeProduct.price || formatCurrency(activeProduct.priceValue)}
                </span>
              </div>
            )}

            {/* Chat Messages Area */}
            <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-8 md:px-8">
              <div className="flex items-center justify-center">
                <span className="h-px flex-1 bg-[#cfc4c5]" />
                <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#999999]">
                  {activeProduct ? `Hội thoại: ${activeProduct.name}` : 'Hội thoại chung'}
                </span>
                <span className="h-px flex-1 bg-[#cfc4c5]" />
              </div>

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onNavigate={onNavigate} />
              ))}
            </div>

            {/* Footer Input */}
            <footer className="absolute bottom-0 left-0 w-full border-t border-[#cfc4c5] bg-[#f9f9f9]/90 p-4 backdrop-blur-md md:p-6">
              <div className="mx-auto flex max-w-4xl items-end gap-3 md:gap-4">
                <div className="hidden gap-2 pb-2 md:flex">
                  {['receipt_long', 'calendar_month'].map((icon) => (
                    <button
                      key={icon}
                      className="flex h-10 w-10 items-center justify-center border border-[#cfc4c5] text-[#999999] transition hover:text-black"
                      aria-label={icon}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  className="min-h-[56px] flex-1 resize-none border-none bg-[#f3f3f4] px-5 py-4 outline-none transition placeholder:text-[#999999] focus:border-b-2 focus:border-[#99854e] focus:ring-0"
                  placeholder={
                    activeProduct
                      ? `Nhắn cho shop về "${activeProduct.name}"...`
                      : 'Nhắn về đơn thuê này...'
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
                      onClick={() => setIsOfferModalOpen(true)}
                      className="hidden border border-black px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] transition hover:bg-black hover:text-white md:block"
                    >
                      Đề xuất giá
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
        )}
      </div>

      {/* Mobile Nav Bar */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 md:hidden">
        {mobileTabs.map(([icon, label]) => (
          <button
            key={label}
            onClick={() => {
              if (label === 'Orders') onNavigate?.('orders');
              if (label !== 'Chat' && label !== 'Orders') onNavigate?.('home');
            }}
            className={`flex flex-col items-center justify-center p-2 text-[#5f5e5e] ${
              label === 'Chat' ? 'rounded-lg bg-[#eeeeee] text-black' : ''
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={label === 'Chat' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]">{label}</span>
          </button>
        ))}
      </nav>

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
            <h2 className="mb-2 font-serif text-3xl">Tạo đề xuất giá</h2>
            <p className="mb-6 text-sm text-[#5f5e5e]">Đề xuất mức giá thuê mong muốn cho món đang trao đổi.</p>

            <label className="mb-4 block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                Mức giá đề xuất (VNĐ)
              </span>
              <input
                autoFocus
                className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-4 outline-none transition focus:border-black"
                type="number"
                placeholder="VD: 500000"
                value={offerPrice}
                onChange={(event) => setOfferPrice(event.target.value)}
              />
            </label>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setOfferPrice('');
                }}
                className="flex-1 border border-[#cfc4c5] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!offerPrice) return;
                  handleSendOffer(offerPrice);
                  setIsOfferModalOpen(false);
                  setOfferPrice('');
                }}
                className="flex-1 bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
              >
                Gửi đề xuất
              </button>
            </div>
          </div>
        </div>
      )}
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

function MessageBubble({ message, onNavigate }) {
  const isUser = message.author === 'user';

  return (
    <div className={`flex max-w-lg items-end gap-3 ${isUser ? 'ml-auto justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#99854e]/10 text-[#99854e]">
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
        </div>
      )}
      <div
        className={`${isUser ? 'bg-black text-white' : 'border border-[#cfc4c5] bg-[#f3f3f4]'} overflow-hidden p-5 ${
          message.isOfferAccepted ? 'border-[#99854e] bg-[#fffbf8]' : ''
        }`}
      >
        <p className="leading-relaxed">{message.text}</p>

        {message.isOffer && (
          <div className="mt-3 border-t border-white/20 pt-3">
            <span className="bg-white/20 px-2 py-1 text-[10px] uppercase tracking-widest">{message.status}</span>
          </div>
        )}

        {message.isOfferAccepted && (
          <div className="mt-4 border-t border-[#cfc4c5]/50 pt-4">
            <button
              onClick={() => onNavigate?.('checkout')}
              className="w-full bg-black py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#99854e]"
            >
              Thanh toán ngay ({message.price})
            </button>
          </div>
        )}

        <span className={`mt-2 block text-[9px] font-semibold uppercase tracking-[0.12em] ${isUser ? 'text-white/60' : 'text-[#999999]'}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}
