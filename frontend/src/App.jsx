import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/common/ScrollToTop';
import BackToTop from './components/common/BackToTop';
import PageLoader from './components/common/PageLoader';
import StylistChatWidget from './components/common/StylistChatWidget';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import StaffLayout from './components/layout/StaffLayout';
import { applyRouteMeta } from './utils/pageMeta';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ChatDetailPage = lazy(() => import('./pages/ChatDetailPage'));
const CosplayPage = lazy(() => import('./pages/CosplayPage'));
const CostumeDetailPage = lazy(() => import('./pages/CostumeDetailPage'));
const CustomerCarePage = lazy(() => import('./pages/CustomerCarePage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const RentalOrderCheckoutPage = lazy(() => import('./pages/RentalOrderCheckoutPage'));
const RentalOrdersPage = lazy(() => import('./pages/RentalOrdersPage'));
const RentalOrderSuccessPage = lazy(() => import('./pages/RentalOrderSuccessPage'));
const ProgramsPage = lazy(() => import('./pages/ProgramsPage'));
const StaffDashboardPage = lazy(() => import('./pages/StaffDashboardPage'));
const TraditionalPage = lazy(() => import('./pages/TraditionalPage'));
const UserAccountPage = lazy(() => import('./pages/UserAccountPage'));
const YearbookPage = lazy(() => import('./pages/YearbookPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
import { getCurrentPageFromPath, useLegacyNavigate, useSearchNavigation } from './routing/navigation';
import { addItemToCart as addItemToCartApi, fetchCart, removeCartItem as removeCartItemApi, updateCartItem as updateCartItemApi } from './services/cartService';
import {
  attachGuestSessionToCurrentUser,
  logUserInteraction,
} from './services/interactionsService';
import { performLogout } from './services/sessionService';
import { loadJson } from './store/browserStorage';
import { selectCurrentUser, setCurrentUser } from './store/authSlice';
import {
  addCartItem,
  getCartGroupId,
  removeCartItem,
  selectCartCount,
  selectCartItems,
  setCartItems,
  updateCartItemDates,
} from './store/cartSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useToastStore } from './store/useToastStore';
import { useStylistChatStore } from './store/useStylistChatStore';
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
    <div className="relative flex min-h-screen flex-col bg-[#F6F1E8]">
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
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      {!hidesFooter && <Footer onNavigate={onNavigate} />}
      <ToastContainer />
    </div>
  );
}

function AdminLayout({ currentUser }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // Only ADMIN can access this layout
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    authNotify.logoutSuccess(currentUser);
    performLogout(dispatch).finally(() => navigate('/account'));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F1EAE0]">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#DED2C2] bg-[#111111] px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg italic text-white">AuraFit</span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756536] md:inline">
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
              <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-[#DED2C2] bg-[#FFFCF7] py-1 shadow-lg">
                <div className="border-b border-[#E8DDCE] px-4 py-3">
                  <p className="text-sm font-medium text-black">{currentUser.fullName || 'Admin'}</p>
                  <p className="mt-0.5 text-xs text-[#6B6259]">{currentUser.email}</p>
                  <span className="mt-2 inline-block border border-[#756536] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#756536]">
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
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
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
  const stylistMessages = useStylistChatStore((state) => state.messages);
  const setStylistWidgetOpen = useStylistChatStore((state) => state.setWidgetOpen);
  const previousPathnameRef = useRef(location.pathname);
  const mergedCartUserRef = useRef(null);
  const isInternalDashboard =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');
  const hidesStylistWidget = isInternalDashboard || location.pathname === '/chat';

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const isLeavingChat =
      previousPathname === '/chat' &&
      location.pathname !== '/chat' &&
      !isInternalDashboard;

    if (location.pathname === '/chat') {
      setStylistWidgetOpen(false);
    } else if (isLeavingChat && stylistMessages.length > 0) {
      setStylistWidgetOpen(true);
    }

    previousPathnameRef.current = location.pathname;
  }, [
    isInternalDashboard,
    location.pathname,
    setStylistWidgetOpen,
    stylistMessages.length,
  ]);

  useEffect(() => {
    applyRouteMeta(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!currentUser?.id) {
      mergedCartUserRef.current = null;
      return undefined;
    }

    // Merge the locally persisted guest cart into the server cart exactly once
    // per login. Without this the first fetch would silently overwrite it.
    if (mergedCartUserRef.current === currentUser.id) {
      return undefined;
    }
    mergedCartUserRef.current = currentUser.id;

    let isMounted = true;

    attachGuestSessionToCurrentUser().catch(() => {});

    const mergeGuestCart = async () => {
      const guestItems = loadJson('aurafitCartItems', []);
      const serverCart = await fetchCart();
      const serverItems = serverCart?.items || [];
      const serverCostumeItemIds = new Set(
        serverItems.map((item) => item.costumeItemId)
      );

      const itemsToMerge = guestItems.filter(
        (item) =>
          item?.costumeItemId && !serverCostumeItemIds.has(item.costumeItemId)
      );

      for (const item of itemsToMerge) {
        await addItemToCartApi({
          costumeItemId: item.costumeItemId,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
          quantity: item.quantity || 1,
        });
      }

      const mergedCart = itemsToMerge.length ? await fetchCart() : serverCart;
      if (isMounted) {
        dispatch(setCartItems(mergedCart?.items || []));
      }
    };

    mergeGuestCart().catch(() => {
      // Keep the local cart if the merge fails; the next cart action retries
      // against the server and reports an error through the normal flow.
    });

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
          return cart;
        } catch (error) {
          addToast(error?.message || 'Hệ thống gặp sự cố khi thêm sản phẩm vào giỏ hàng. Quý khách vui lòng thử lại.', 'error');
          return null;
        }
      }

      dispatch(addCartItem(item));
      addToast(`Sản phẩm "${item.name}" đã được thêm vào giỏ hàng.`);
      return { items: [item] };
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

      const cart = await handleAddToCart(item);
      if (!cart) {
        return;
      }

      const addedItem = (cart.items || []).find(
        (cartItem) => cartItem.costumeItemId === item.costumeItemId
      );
      const autoSelectId = addedItem ? getCartGroupId(addedItem) : null;

      addToast(`Đang chuyển hướng đến trang thanh toán cho "${item.name}"...`);
      handleNavigate(
        'checkout',
        null,
        autoSelectId ? { state: { autoSelectId } } : undefined
      );
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
    [cartItems, currentUser?.id, dispatch, addToast]
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
      <Suspense fallback={<PageLoader />}>
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
        <Route path="/catalog/yearbook" element={<YearbookPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/catalog/cosplay" element={<CosplayPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/catalog/events" element={<EventsPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/events" element={<ProgramsPage />} />
        <Route path="/events/:eventSlug" element={<EventDetailPage />} />
        <Route path="/catalog/traditional" element={<TraditionalPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />} />
        <Route path="/yearbook" element={<Navigate to="/catalog/yearbook" replace />} />
        <Route path="/cosplay" element={<Navigate to="/catalog/cosplay" replace />} />
        <Route path="/traditional" element={<Navigate to="/catalog/traditional" replace />} />
        <Route path="/care" element={<CustomerCarePage onNavigate={handleNavigate} />} />
        <Route path="/account" element={<UserAccountPage currentUser={currentUser} onAuthChange={handleAuthChange} onNavigate={handleNavigate} />} />
        <Route
          path="/products/:productId"
          element={<CostumeDetailPage currentUser={currentUser} onNavigate={handleNavigate} onAddToCart={handleAddToCart} onRentNow={handleRentNow} />}
        />
        <Route path="/success" element={<RentalOrderSuccessPage cartItems={cartItems} onNavigate={handleNavigate} />} />
        <Route path="/policy" element={<PolicyPage onNavigate={handleNavigate} />} />
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
        <Route
          path="/payment"
          element={
            currentUser ? (
              <PaymentPage
                cartItems={cartItems}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            ) : (
              <Navigate to="/account" replace />
            )
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      {!hidesStylistWidget && <StylistChatWidget />}
      <BackToTop />
    </>
  );
}

export default App;
