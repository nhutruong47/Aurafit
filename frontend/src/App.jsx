import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import Chat from './pages/Chat';
import Yearbook from './pages/Yearbook';
import Cosplay from './pages/Cosplay';
import CustomerCare from './pages/CustomerCare';
import Account from './pages/Account';
import Events from './pages/Events';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import SellerDashboard from './pages/SellerDashboard';
import BecomeLessor from './pages/BecomeLessor';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Shop from './pages/Shop';
import ShopDetail from './pages/ShopDetail';
import { logUserInteraction } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return window.localStorage.getItem('aurafitCurrentPage') || 'home';
  });
  const [currentProduct, setCurrentProduct] = useState(() => {
    const savedProduct = window.localStorage.getItem('aurafitCurrentProduct');
    return savedProduct ? JSON.parse(savedProduct) : null;
  });
  const [currentShop, setCurrentShop] = useState(() => {
    const savedShop = window.localStorage.getItem('aurafitCurrentShop');
    return savedShop ? JSON.parse(savedShop) : null;
  });
  const [chatContext, setChatContext] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = window.localStorage.getItem('aurafitCartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem('aurafitCurrentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    window.localStorage.setItem('aurafitCartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const hasAdminRole = currentUser?.role?.split(',').some((value) => value.trim() === 'ADMIN');
    if (hasAdminRole && !['adminDashboard', 'account'].includes(currentPage)) {
      setCurrentPage('adminDashboard');
      window.localStorage.setItem('aurafitCurrentPage', 'adminDashboard');
    }
  }, [currentUser, currentPage]);

  const handleAuthChange = (user) => {
    setCurrentUser(user);
    window.localStorage.setItem('aurafitCurrentUser', JSON.stringify(user));
  };

  const hasRole = (role) => currentUser?.role?.split(',').some((value) => value.trim() === role);

  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    window.localStorage.setItem('aurafitCurrentPage', page);
    if (page === 'productDetail' && data) {
      setCurrentProduct(data);
      window.localStorage.setItem('aurafitCurrentProduct', JSON.stringify(data));
    }
    if (page === 'shopDetail' && data) {
      setCurrentShop(data);
      window.localStorage.setItem('aurafitCurrentShop', JSON.stringify(data));
    }
    if (page === 'chat') {
      setChatContext(data || currentProduct || null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchOpen = () => {
    setCurrentPage('catalog');
    setSearchFocusToken((token) => token + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item) => {
    if (currentUser?.id && item?.id) {
      logUserInteraction({
        userId: currentUser.id,
        actionType: 'ADD_TO_CART',
        targetType: 'COSTUME',
        targetId: item.id,
        metadata: JSON.stringify({
          category: item.rawCategory || item.category,
          subcategory: item.subcategory,
          tag: item.tag,
        }),
      }).catch(() => {});
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.name === item.name);

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.cartId === existingItem.cartId
            ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity: 1,
          cartId: `${item.name}-${Date.now()}-${currentItems.length}`,
        },
      ];
    });
    if (currentPage !== 'checkout') {
      handleNavigate('checkout');
    }
  };

  const handleUpdateCartQuantity = (cartId, quantity) => {
    setCartItems((currentItems) =>
      quantity < 1
        ? currentItems.filter((item) => item.cartId !== cartId)
        : currentItems.map((item) => (item.cartId === cartId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (cartId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.cartId !== cartId));
  };

  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  const renderPage = () => {
    switch (currentPage) {
      case 'catalog':
        return <Catalog onNavigate={handleNavigate} onAddToCart={handleAddToCart} searchFocusToken={searchFocusToken} />;
      case 'shop':
        return <Shop currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'checkout':
        return (
          <Checkout
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onNavigate={handleNavigate}
          />
        );
      case 'payment':
        return <Payment cartItems={cartItems} currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'success':
        return <OrderSuccess cartItems={cartItems} onNavigate={handleNavigate} />;
      case 'chat':
        return <Chat onNavigate={handleNavigate} contextProduct={chatContext} cartItems={cartItems} />;
      case 'orders':
        return <Orders currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'becomeLessor':
        return <BecomeLessor currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'adminDashboard':
        return <AdminDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'staffDashboard':
        return <StaffDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'sellerDashboard':
        return <SellerDashboard currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />;
      case 'yearbook':
        return <Yearbook onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'cosplay':
        return <Cosplay onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'events':
        return <Events onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'care':
        return <CustomerCare onNavigate={handleNavigate} />;
      case 'account':
        return <Account currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />;
      case 'productDetail':
        return <ProductDetail product={currentProduct} currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'shopDetail':
        return <ShopDetail shop={currentShop} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
      case 'home':
      default:
        return <Home onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
    }
  };

  const usesCustomShell = currentPage === 'payment' || currentPage === 'success';
  const hidesFooter = usesCustomShell || currentPage === 'chat' || currentPage === 'adminDashboard' || currentPage === 'staffDashboard';

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
      {!usesCustomShell && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onSearchOpen={handleSearchOpen}
          cartCount={cartCount}
          currentUser={currentUser}
          isAdmin={hasRole('ADMIN')}
          isStaff={hasRole('STAFF')}
        />
      )}
      <main className="flex-1">{renderPage()}</main>
      {!hidesFooter && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
