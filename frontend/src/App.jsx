import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import StylistChatWidget from './components/common/StylistChatWidget';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CatalogPage from './pages/CatalogPage';
import ChatDetailPage from './pages/ChatDetailPage';
import CosplayPage from './pages/CosplayPage';
import CostumeDetailPage from './pages/CostumeDetailPage';
import CustomerCarePage from './pages/CustomerCarePage';
import EventsPage from './pages/EventsPage';
import EventDetailPlaceholderPage from './pages/EventDetailPlaceholderPage';
import HomePage from './pages/HomePage';
import PaymentPage from './pages/PaymentPage';
import RentalOrderCheckoutPage from './pages/RentalOrderCheckoutPage';
import RentalOrdersPage from './pages/RentalOrdersPage';
import RentalOrderSuccessPage from './pages/RentalOrderSuccessPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import TraditionalPage from './pages/TraditionalPage';
import UserAccountPage from './pages/UserAccountPage';
import YearbookPage from './pages/YearbookPage';
import PolicyPage from './pages/PolicyPage';
import StaffLayout from './components/layout/StaffLayout';
import { getCurrentPageFromPath, useLegacyNavigate, useSearchNavigation } from './routing/navigation';
import { addItemToCart as addItemToCartApi, fetchCart, removeCartItem as removeCartItemApi, updateCartItem as updateCartItemApi } from './services/cartService';
import {
  attachGuestSessionToCurrentUser,
  logUserInteraction,
} from './services/interactionsService';
import { clearCurrentUser, selectCurrentUser, setCurrentUser } from './store/authSlice';
import {
  addCartItem,
  removeCartItem,
  selectCartCount,
  selectCartItems,
  setCartItems,
  updateCartItemDates,
} from './store/cartSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useToastStore } from './store/useToastStore';
import authNotify from './utils/authNotify';
import { hasUserRole } from './utils/roles';

function CustomerLayout({ currentUser, cartCount, onNavigate, onSearchOpen }) {
  const location = useLocation();
  const currentPage = getCurrentPageFromPath(location.pathname);
  const hidesFooter = currentPage === 'staffDashboard' || currentPage === 'chat';

  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = currentUser?.role === 'STAFF';
  
  if (isAdmin && currentPage !== 'account') {
    return <Navigate to="/admin" replace />;
  }
  if (isStaff && currentPage !== 'account') {
    return <Navigate to="/staff" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <ScrollToTop />
      <Navbar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onSearchOpen={onSearchOpen}
        cartCount={cartCount}
        currentUser={currentUser}
        isAdmin={false}
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

function AdminLayout({ currentUser }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Only ADMIN can access this layout
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    authNotify.logoutSuccess(currentUser);
    dispatch(clearCurrentUser());
    localStorage.removeItem('aurafitCurrentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/account');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f2]">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#d7d2c8] bg-[#111111] px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg italic text-white">AuraFit</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f7041] md:inline">
            Admin Console
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/80 transition hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="hidden md:inline">{currentUser.fullName || currentUser.email}</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-[#d7d2c8] bg-[#fdfdfb] py-1 shadow-lg">
                <div className="border-b border-[#ebe7df] px-4 py-3">
                  <p className="text-sm font-medium text-black">{currentUser.fullName || 'Admin'}</p>
                  <p className="mt-0.5 text-xs text-[#5f5e5e]">{currentUser.email}</p>
                  <span className="mt-2 inline-block border border-[#7f7041] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7f7041]">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <ScrollToTop />
      <main className="flex-1">
        <Outlet />
      </main>
      <ToastContainer />
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
  const addToast = useToastStore((state) => state.addToast);
  const isInternalDashboard =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');
  const hidesStylistWidget = isInternalDashboard || location.pathname === '/chat';

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let isMounted = true;

    attachGuestSessionToCurrentUser().catch(() => {});

    fetchCart()
      .then((cart) => {
        if (!isMounted) return;
        dispatch(setCartItems(cart?.items || []));
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
          });

          dispatch(setCartItems(cart?.items || []));
          addToast(`Sản phẩm "${item.name}" đã được thêm vào giỏ hàng.`);
          return;
        } catch (error) {
          addToast(error?.message || 'Hệ thống gặp sự cố khi thêm sản phẩm vào giỏ hàng. Quý khách vui lòng thử lại.', 'error');
          return;
        }
      }

      dispatch(addCartItem(item));
      addToast(`Sản phẩm "${item.name}" đã được thêm vào giỏ hàng.`);
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
      addToast(`Đang chuyển hướng đến trang thanh toán cho "${item.name}"...`);
      handleNavigate('checkout', null, { state: { autoSelectId: item.id } });
    },
    [currentUser, handleNavigate, addToast, handleAddToCart]
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
            dispatch(setCartItems(latestCart?.items || []));
            return;
          } catch (error) {
            if (error?.response?.status === 404) {
              dispatch(removeCartItem(cartId));
            } else {
              addToast('Hệ thống gặp sự cố khi xóa sản phẩm. Quý khách vui lòng tải lại trang.', 'error');
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
          dispatch(setCartItems(cart?.items || []));
          isApiUpdated = true;
          addToast('Giỏ hàng đã được cập nhật thành công.');
        } catch {
          addToast('Hệ thống không thể cập nhật giỏ hàng trên máy chủ.');
          return; // Stop here if API fails, do not proceed to local success
        }
      }
      
      if (!isApiUpdated) {
        dispatch(updateCartItemDates({ cartId: localCartId, ...data }));
        addToast('Thời gian thuê đã được cập nhật thành công.');
      }
    },
    [currentUser?.id, dispatch, addToast]
  );

  return (
    <>
      <Routes>
      {/* Admin-only layout: no Navbar, no cart, no customer UI */}
      <Route
        element={
          <AdminLayout currentUser={currentUser} />
        }
      >
        <Route path="/admin" element={<AdminDashboardPage currentUser={currentUser} />} />
      </Route>

      {/* Customer layout: full Navbar, cart, footer */}
      <Route
        element={
          <CustomerLayout
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

        <Route path="/orders" element={<RentalOrdersPage currentUser={currentUser} onNavigate={handleNavigate} />} />
        <Route path="/chat" element={<ChatDetailPage currentUser={currentUser} />} />
        <Route path="/yearbook" element={<YearbookPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/cosplay" element={<CosplayPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/events" element={<EventsPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/events/:eventSlug" element={<EventDetailPlaceholderPage />} />
        <Route path="/traditional" element={<TraditionalPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/care" element={<CustomerCarePage onNavigate={handleNavigate} />} />
        <Route path="/account" element={<UserAccountPage currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />} />
        <Route
          path="/products/:productId"
          element={<CostumeDetailPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} onRentNow={handleRentNow} />}
        />
        <Route path="/success" element={<RentalOrderSuccessPage cartItems={cartItems} onNavigate={handleNavigate} />} />
        <Route path="/policy" element={<PolicyPage />} />
      </Route>

      {/* Staff layout: no Navbar, no cart, internal dashboard UI */}
      <Route
        element={
          <StaffLayout currentUser={currentUser} />
        }
      >
        <Route path="/staff" element={<StaffDashboardPage currentUser={currentUser} onNavigate={handleNavigate} />} />
      </Route>

      <Route element={<BareLayout />}>
        <Route path="/payment" element={<PaymentPage cartItems={cartItems} currentUser={currentUser} onNavigate={handleNavigate} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hidesStylistWidget && <StylistChatWidget />}
    </>
  );
}

export default App;
