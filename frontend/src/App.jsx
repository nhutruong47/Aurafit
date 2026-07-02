import { useCallback, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CatalogPage from './pages/CatalogPage';
import ChatPage from './pages/ChatPage';
import CosplayPage from './pages/CosplayPage';
import CostumeDetailPage from './pages/CostumeDetailPage';
import CustomerCarePage from './pages/CustomerCarePage';
import DirectRentalPage from './pages/DirectRentalPage';
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
import { addItemToCart as addItemToCartApi, fetchCart, removeCartItem as removeCartItemApi, updateCartItem as updateCartItemApi } from './services/cartService';
import {
  attachGuestSessionToCurrentUser,
  consumeAiStylistRecommendationAttribution,
  logUserInteraction,
  mergeAiStylistCartAttribution,
  rememberAiStylistCartAttribution,
} from './services/interactionsService';
import { selectCurrentUser, setCurrentUser } from './store/authSlice';
import {
  addCartItem,
  removeCartItem,
  selectCartCount,
  selectCartItems,
  setCartItems,
  updateCartQuantity,
} from './store/cartSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useDirectOrderStore } from './store/useDirectOrderStore';
import { useToastStore } from './store/useToastStore';
import { hasUserRole } from './utils/roles';

function DefaultLayout({ currentUser, cartCount, onNavigate, onSearchOpen }) {
  const location = useLocation();
  const currentPage = getCurrentPageFromPath(location.pathname);
  const hidesFooter = currentPage === 'chat' || currentPage === 'adminDashboard' || currentPage === 'staffDashboard';

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <ScrollToTop />
      <Navbar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onSearchOpen={onSearchOpen}
        cartCount={cartCount}
        currentUser={currentUser}
        isAdmin={hasUserRole(currentUser, 'ADMIN')}
        isSeller={hasUserRole(currentUser, 'SELLER')}
        isStaff={hasUserRole(currentUser, 'STAFF')}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hidesFooter && <Footer onNavigate={onNavigate} />}
      <ToastContainer />
    </div>
  );
}

function BareLayout() {
  return <Outlet />;
}

function App() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const handleNavigate = useLegacyNavigate();
  const handleSearchOpen = useSearchNavigation();
  const { setDirectItem } = useDirectOrderStore();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let isMounted = true;

    attachGuestSessionToCurrentUser().catch(() => {});

    fetchCart()
      .then((cart) => {
        if (!isMounted) return;
        dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, dispatch]);

  const handleAuthChange = useCallback(
    (user) => {
      dispatch(setCurrentUser(user));
    },
    [dispatch]
  );

  const handleAddToCart = useCallback(
    async (item) => {
      const aiStylistAttribution = item?.id ? consumeAiStylistRecommendationAttribution(item.id) : null;
      const apiEligible = currentUser?.id && item?.costumeItemId && item?.rentalStartDate && item?.rentalEndDate;

      if (!apiEligible && currentUser?.id && item?.id) {
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

      if (apiEligible) {
        try {
          const cart = await addItemToCartApi({
            costumeItemId: item.costumeItemId,
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            aiStylistAttribution,
          });

          if (aiStylistAttribution) {
            rememberAiStylistCartAttribution(item, aiStylistAttribution);
          }

          dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
          addToast(`Da them "${item.name}" vao gio hang.`);
          return;
        } catch {
          dispatch(addCartItem(aiStylistAttribution ? { ...item, attribution: aiStylistAttribution } : item));
          addToast(`Da them "${item.name}" vao gio hang.`);
          return;
        }
      }

      dispatch(addCartItem(aiStylistAttribution ? { ...item, attribution: aiStylistAttribution } : item));
      addToast(`Da them "${item.name}" vao gio hang.`);
    },
    [currentUser, dispatch, addToast]
  );

  const handleRentNow = useCallback(
    (item) => {
      if (!currentUser?.id) {
        handleNavigate('account');
        return;
      }
      if (!item?.rentalStartDate || !item?.rentalEndDate) {
        return;
      }

      const aiStylistAttribution = item?.id ? consumeAiStylistRecommendationAttribution(item.id) : null;
      setDirectItem(aiStylistAttribution ? { ...item, attribution: aiStylistAttribution } : item);
      addToast(`Dang chuyen den trang thue "${item.name}"...`);
      handleNavigate('direct-rental');
    },
    [currentUser, handleNavigate, setDirectItem, addToast]
  );

  const handleUpdateCartQuantity = useCallback(
    (cartId, quantity) => {
      dispatch(updateCartQuantity({ cartId, quantity }));
    },
    [dispatch]
  );

  const handleRemoveFromCart = useCallback(
    async (cartId) => {
      const matchedItem = cartItems.find((item) => item.cartId === cartId);

      if (currentUser?.id && matchedItem?.cartItemId) {
        try {
          const cart = await removeCartItemApi(matchedItem.cartItemId);
          dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
          return;
        } catch {
          return;
        }
      }

      dispatch(removeCartItem(cartId));
    },
    [cartItems, currentUser?.id, dispatch]
  );
  const handleUpdateCartItem = useCallback(
    async (cartItemId, data) => {
      if (currentUser?.id) {
        try {
          const cart = await updateCartItemApi(cartItemId, data);
          dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
          addToast('Cập nhật giỏ hàng thành công.');
        } catch {
          addToast('Không thể cập nhật giỏ hàng.');
        }
      }
    },
    [currentUser?.id, dispatch, addToast]
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
        <Route path="/" element={<HomePage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/catalog" element={<CatalogPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} onRentNow={handleRentNow} />} />
        <Route
          path="/shop"
          element={<ShopPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} onRentNow={handleRentNow} />}
        />
        <Route
          path="/checkout"
          element={
            <RentalOrderCheckoutPage
              cartItems={cartItems}
              currentUser={currentUser}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onUpdateCartItem={handleUpdateCartItem}
              onNavigate={handleNavigate}
            />
          }
        />
        <Route
          path="/direct-rental"
          element={
            <DirectRentalPage
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          }
        />
        <Route path="/chat" element={<ChatPage currentUser={currentUser} onNavigate={handleNavigate} cartItems={cartItems} />} />
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
          element={<CostumeDetailPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} onRentNow={handleRentNow} />}
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
