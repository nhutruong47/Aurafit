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
  updateCartItemDates,
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
      // Allow adding to cart even if dates are not selected yet (they will be selected on Checkout)
      const apiEligible = !!(currentUser?.id && item?.costumeItemId);

      if (apiEligible && item?.id) {
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
            quantity: item.quantity || 1,
            aiStylistAttribution,
          });

          if (aiStylistAttribution) {
            rememberAiStylistCartAttribution(item, aiStylistAttribution);
          }

          dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
          addToast(`Da them "${item.name}" vao gio hang.`);
          return;
        } catch (error) {
          addToast(error?.message || 'Lỗi: Không thể thêm vào giỏ hàng, vui lòng thử lại.', 'error');
          return;
        }
      }

      dispatch(addCartItem(aiStylistAttribution ? { ...item, attribution: aiStylistAttribution } : item));
      addToast(`Da them "${item.name}" vao gio hang.`);
    },
    [currentUser, dispatch, addToast]
  );

  const handleRentNow = useCallback(
    async (item) => {
      if (!currentUser?.id) {
        handleNavigate('account');
        return;
      }
      if (!item?.rentalStartDate || !item?.rentalEndDate) {
        return;
      }

      await handleAddToCart(item);
      addToast(`Dang chuyen den trang thanh toan "${item.name}"...`);
      handleNavigate('checkout', null, { state: { autoSelectId: item.id } });
    },
    [currentUser, handleNavigate, addToast, handleAddToCart]
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

      if (currentUser?.id && matchedItem) {
        // Grouped items have cartItemIds (array); ungrouped items have a single cartItemId
        const idsToDelete = matchedItem.cartItemIds || (matchedItem.cartItemId ? [matchedItem.cartItemId] : []);

        if (idsToDelete.length > 0) {
          try {
            let latestCart = null;
            for (const id of idsToDelete) {
              latestCart = await removeCartItemApi(id);
            }
            dispatch(setCartItems(mergeAiStylistCartAttribution(latestCart?.items || [])));
            return;
          } catch (error) {
            if (error?.response?.status === 404) {
              dispatch(removeCartItem(cartId));
            } else {
              addToast('Lỗi: Không thể xoá sản phẩm. Vui lòng tải lại trang.', 'error');
            }
            return;
          }
        }
      }

      dispatch(removeCartItem(cartId));
    },
    [cartItems, currentUser?.id, dispatch]
  );
  const handleUpdateCartItem = useCallback(
    async (cartItemId, localCartId, data) => {
      let isApiUpdated = false;
      if (currentUser?.id && cartItemId && typeof cartItemId === 'number') {
        try {
          const cart = await updateCartItemApi(cartItemId, data);
          dispatch(setCartItems(mergeAiStylistCartAttribution(cart?.items || [])));
          isApiUpdated = true;
          addToast('Cập nhật giỏ hàng thành công.');
        } catch {
          addToast('Không thể cập nhật giỏ hàng trên máy chủ.');
          return; // Stop here if API fails, do not proceed to local success
        }
      }
      
      if (!isApiUpdated) {
        dispatch(updateCartItemDates({ cartId: localCartId, ...data }));
        addToast('Cập nhật thời gian thành công (cục bộ).');
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
              onUpdateCartItem={handleUpdateCartItem}
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
