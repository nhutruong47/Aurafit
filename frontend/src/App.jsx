import { useEffect } from 'react';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import Catalog from './pages/Catalog';
import Chat from './pages/Chat';
import Checkout from './pages/Checkout';
import Cosplay from './pages/Cosplay';
import CustomerCare from './pages/CustomerCare';
import Events from './pages/Events';
import Home from './pages/Home';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import Payment from './pages/Payment';
import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';
import StaffDashboard from './pages/StaffDashboard';
import Yearbook from './pages/Yearbook';
import { fetchCart, logUserInteraction } from './services/api';
import { selectCurrentUser, setCurrentUser, clearCurrentUser } from './store/authSlice';
import { addCartItem, clearCart, removeCartItem, selectCartCount, selectCartItems, setCartItems, updateCartQuantity } from './store/cartSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useNavigationStore } from './store/useNavigationStore';
import { useCheckoutStore } from './store/useCheckoutStore';
import { hasUserRole } from './utils/roles';

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
  const clearPendingOrderId = useCheckoutStore((state) => state.clearPendingOrderId);
  const setPendingOrderId = useCheckoutStore((state) => state.setPendingOrderId);

  useEffect(() => {
    if (hasUserRole(currentUser, 'ADMIN') && !['adminDashboard', 'account'].includes(currentPage)) {
      handleNavigate('adminDashboard');
    }
  }, [currentPage, currentUser, handleNavigate]);

  // Sync the cart with the backend whenever the authenticated user changes.
  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let isMounted = true;
    fetchCart()
      .then((cartData) => {
        if (!isMounted) return;
        const items = cartData?.items || [];
        if (items.length > 0) {
          dispatch(setCartItems(items));
        }
      })
      .catch(() => {
        // Keep local cart state if backend is unreachable.
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, dispatch]);

  const handleAuthChange = (user) => {
    dispatch(user ? setCurrentUser(user) : clearCurrentUser());
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

    dispatch(addCartItem(item));
    if (currentPage !== 'checkout') {
      handleNavigate('checkout');
    }
  };

  const handleUpdateCartQuantity = (cartId, quantity) => {
    dispatch(updateCartQuantity({ cartId, quantity }));
  };

  const handleRemoveFromCart = (cartId) => {
    const item = cartItems.find((cartItem) => cartItem.cartId === cartId);
    if (currentUser?.id && item?.cartItemId) {
      // Best-effort backend removal — UI removes locally regardless.
      import('./services/api').then(({ removeCartItem }) =>
        removeCartItem(item.cartItemId).catch(() => {})
      );
    }
    dispatch(removeCartItem(cartId));
  };

  const handleCheckoutSuccess = (orderId) => {
    dispatch(clearCart());
    clearPendingOrderId();
    setPendingOrderId(orderId);
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
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onCheckoutSuccess={handleCheckoutSuccess}
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
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      {!usesCustomShell && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onSearchOpen={handleSearchOpen}
          cartCount={cartCount}
          currentUser={currentUser}
          isAdmin={hasUserRole(currentUser, 'ADMIN')}
          isStaff={hasUserRole(currentUser, 'STAFF')}
        />
      )}
      <main className="flex-1">{renderPage()}</main>
      {!hidesFooter && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
