import { useCallback } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
import { getCurrentPageFromPath, useLegacyNavigate, useSearchNavigation } from './routing/navigation';
import { logUserInteraction } from './services/interactionsService';
import { selectCurrentUser, setCurrentUser } from './store/authSlice';
import { addCartItem, removeCartItem, selectCartCount, selectCartItems, updateCartQuantity } from './store/cartSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { hasUserRole } from './utils/roles';

function DefaultLayout({ currentUser, cartCount, onNavigate, onSearchOpen }) {
  const location = useLocation();
  const currentPage = getCurrentPageFromPath(location.pathname);
  const hidesFooter = currentPage === 'chat' || currentPage === 'adminDashboard' || currentPage === 'staffDashboard';

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Navbar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onSearchOpen={onSearchOpen}
        cartCount={cartCount}
        currentUser={currentUser}
        isAdmin={hasUserRole(currentUser, 'ADMIN')}
        isStaff={hasUserRole(currentUser, 'STAFF')}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hidesFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}

function BareLayout() {
  return <Outlet />;
}

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const handleNavigate = useLegacyNavigate();
  const handleSearchOpen = useSearchNavigation();

  const handleAuthChange = useCallback(
    (user) => {
      dispatch(setCurrentUser(user));
    },
    [dispatch]
  );

  const handleAddToCart = useCallback(
    (item) => {
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
      if (location.pathname !== '/checkout') {
        handleNavigate('checkout');
      }
    },
    [currentUser, dispatch, handleNavigate, location.pathname]
  );

  const handleUpdateCartQuantity = useCallback(
    (cartId, quantity) => {
      dispatch(updateCartQuantity({ cartId, quantity }));
    },
    [dispatch]
  );

  const handleRemoveFromCart = useCallback(
    (cartId) => {
      dispatch(removeCartItem(cartId));
    },
    [dispatch]
  );

  return (
    <Routes>
      <Route
        element={
          <DefaultLayout
            currentUser={currentUser}
            cartCount={cartCount}
            onNavigate={handleNavigate}
            onSearchOpen={handleSearchOpen}
          />
        }
      >
        <Route path="/" element={<Home onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/catalog" element={<Catalog onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/shop" element={<Shop currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route
          path="/checkout"
          element={
            <Checkout
              cartItems={cartItems}
              currentUser={currentUser}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onNavigate={handleNavigate}
            />
          }
        />
        <Route path="/chat" element={<Chat onNavigate={handleNavigate} cartItems={cartItems} />} />
        <Route path="/orders" element={<Orders currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/admin" element={<AdminDashboard currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/staff" element={<StaffDashboard currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/yearbook" element={<Yearbook onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/cosplay" element={<Cosplay onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/events" element={<Events onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/care" element={<CustomerCare onNavigate={handleNavigate} />} />
        <Route path="/account" element={<Account currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />} />
        <Route
          path="/products/:productId"
          element={<ProductDetail currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />}
        />
      </Route>

      <Route element={<BareLayout />}>
        <Route path="/payment" element={<Payment cartItems={cartItems} currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/success" element={<OrderSuccess cartItems={cartItems} onNavigate={handleNavigate} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
