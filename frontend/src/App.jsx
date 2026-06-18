import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Shop from './pages/Shop';
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
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import { logUserInteraction } from './services/api';
import { addCartItem, removeCartItem, selectCartCount, selectCartItems, updateCartQuantity } from './store/cartSlice';
import { selectCurrentUser, setCurrentUser } from './store/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useNavigationStore } from './stores/useNavigationStore';

function App() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const currentPage = useNavigationStore((state) => state.currentPage);
  const currentProduct = useNavigationStore((state) => state.currentProduct);
  const chatContext = useNavigationStore((state) => state.chatContext);
  const searchFocusToken = useNavigationStore((state) => state.searchFocusToken);
  const handleNavigate = useNavigationStore((state) => state.navigate);
  const handleSearchOpen = useNavigationStore((state) => state.openSearch);

  useEffect(() => {
    const hasAdminRole = currentUser?.role?.split(',').some((value) => value.trim() === 'ADMIN');
    if (hasAdminRole && !['adminDashboard', 'account'].includes(currentPage)) {
      handleNavigate('adminDashboard');
    }
  }, [currentUser, currentPage, handleNavigate]);

  const handleAuthChange = (user) => {
    dispatch(setCurrentUser(user));
  };

  const hasRole = (role) => currentUser?.role?.split(',').some((value) => value.trim() === role);

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

    dispatch(addCartItem(item));
    if (currentPage !== 'checkout') {
      handleNavigate('checkout');
    }
  };

  const handleUpdateCartQuantity = (cartId, quantity) => {
    dispatch(updateCartQuantity({ cartId, quantity }));
  };

  const handleRemoveFromCart = (cartId) => {
    dispatch(removeCartItem(cartId));
  };

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
      case 'adminDashboard':
        return <AdminDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'staffDashboard':
        return <StaffDashboard currentUser={currentUser} onNavigate={handleNavigate} />;
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
      case 'becomeLessor':
      case 'sellerDashboard':
        return <Catalog onNavigate={handleNavigate} onAddToCart={handleAddToCart} searchFocusToken={searchFocusToken} />;
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
