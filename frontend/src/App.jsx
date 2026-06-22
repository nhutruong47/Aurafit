import { useCallback } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CatalogPage from './pages/CatalogPage';
import ChatPage from './pages/ChatPage';
import CosplayPage from './pages/CosplayPage';
import CostumeDetailPage from './pages/CostumeDetailPage';
import CustomerCarePage from './pages/CustomerCarePage';
import EventsPage from './pages/EventsPage';
import HomePage from './pages/HomePage';
import PaymentPage from './pages/PaymentPage';
import RentalOrderCheckoutPage from './pages/RentalOrderCheckoutPage';
import RentalOrdersPage from './pages/RentalOrdersPage';
import RentalOrderSuccessPage from './pages/RentalOrderSuccessPage';
import ShopPage from './pages/ShopPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import UserAccountPage from './pages/UserAccountPage';
import YearbookPage from './pages/YearbookPage';
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
        <Route path="/" element={<HomePage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/catalog" element={<CatalogPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/shop" element={<ShopPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route
          path="/checkout"
          element={
            <RentalOrderCheckoutPage
              cartItems={cartItems}
              currentUser={currentUser}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onNavigate={handleNavigate}
            />
          }
        />
        <Route path="/chat" element={<ChatPage onNavigate={handleNavigate} cartItems={cartItems} />} />
        <Route path="/orders" element={<RentalOrdersPage currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/admin" element={<AdminDashboardPage currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/staff" element={<StaffDashboardPage currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/yearbook" element={<YearbookPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/cosplay" element={<CosplayPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/events" element={<EventsPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/care" element={<CustomerCarePage onNavigate={handleNavigate} />} />
        <Route path="/account" element={<UserAccountPage currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />} />
        <Route
          path="/products/:productId"
          element={<CostumeDetailPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />}
        />
      </Route>

      <Route element={<BareLayout />}>
        <Route path="/payment" element={<PaymentPage cartItems={cartItems} currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/success" element={<RentalOrderSuccessPage cartItems={cartItems} onNavigate={handleNavigate} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
