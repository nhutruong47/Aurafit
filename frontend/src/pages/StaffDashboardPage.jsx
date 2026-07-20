import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useStaffRentalOrders } from '../hooks/useStaffRentalOrders';
import ShippingTab from '../components/staff/ShippingTab';
import PickupTab from '../components/staff/PickupTab';
import ReturnTab from '../components/staff/ReturnTab';
import DashboardTab from '../components/staff/DashboardTab';
import OrdersTab from '../components/staff/OrdersTab';
import ProfileTab from '../components/staff/ProfileTab';
import StaffOrderDetailModal from '../components/staff/StaffOrderDetailModal';

export default function StaffDashboardPage({ currentUser, onNavigate }) {
  const navigate = useNavigate();
  const { currentTab } = useOutletContext() || { currentTab: 'dashboard' };
  
  const {
    canUseStaffTools,
    orders,
    activeOrder,
    handoverImageUrl,
    note,
    previewImage,
    isLoading,
    isSubmitting,
    error,
    message,
    activeTotals,
    loadOrders,
    openOrder,
    setMode,
    setHandoverImageFile,
    handoverImageFile,
    setNote,
    setPreviewImage,
    handleHandoverImageUploaded,
    submitHandover,
    submitShipping,
    markOrderRented,
    handleDeliveryFailed,
    handleLostPackage,
    returnOrder,
    markOrderReturned,
    priorityOrders,
  } = useStaffRentalOrders(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset filters and search when changing tabs
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === 'pickup') {
      setMode('PICKUP');
    } else if (currentTab === 'return') {
      setMode('RETURN');
    }
  }, [currentTab, setMode]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (currentTab === 'shipping') {
      filtered = filtered.filter(o => (o.status === 'CONFIRMED' || o.status === 'SHIPPING') && o.deliveryMethod === 'GHN_DELIVERY');
    } else if (currentTab === 'pickup') {
      filtered = filtered.filter(o => o.status === 'CONFIRMED' && o.deliveryMethod === 'STORE_PICKUP');
    } else if (currentTab === 'return') {
      filtered = filtered.filter(o => ((o.status === 'RENTED' || o.status === 'PICKED_UP') && o.deliveryMethod === 'STORE_PICKUP') || o.status === 'RETURNING' || o.status === 'RETURNED' || o.status === 'PENDING_REFUND' || (o.status === 'RENTED' && o.deliveryMethod === 'GHN_DELIVERY') || o.status === 'CANCELLED');
    } else if (currentTab === 'history') {
      filtered = filtered.filter(o => ['RETURNED', 'CANCELLED', 'COMPLETED', 'DAMAGED', 'LOST'].includes(o.status));
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        String(o.id).includes(lowerQ) || 
        o.customerName?.toLowerCase().includes(lowerQ) ||
        o.customerEmail?.toLowerCase().includes(lowerQ) ||
        o.customerPhone?.includes(lowerQ)
      );
    }

    if (currentTab === 'orders' || currentTab === 'dashboard' || currentTab === 'history') {
      filtered = [...filtered].sort((a, b) => {
        if (sortOption === 'NEWEST') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortOption === 'OLDEST') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortOption === 'PRICE_DESC') return (b.finalAmount || 0) - (a.finalAmount || 0);
        if (sortOption === 'PRICE_ASC') return (a.finalAmount || 0) - (b.finalAmount || 0);
        return 0;
      });
    }

    return filtered;
  }, [orders, currentTab, statusFilter, searchQuery, sortOption]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (!currentUser || !canUseStaffTools) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h2>
          <p className="mt-2 text-gray-600">Bạn cần quyền Staff để truy cập khu vực này.</p>
          <button
            onClick={() => onNavigate?.('account')}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {currentTab === 'dashboard' && (
            <DashboardTab 
              activeTotals={activeTotals} 
              priorityOrders={priorityOrders} 
              openOrder={openOrder} 
              setIsModalOpen={setIsModalOpen} 
              navigate={navigate} 
            />
          )}
          {(currentTab === 'orders' || currentTab === 'history') && (
            <OrdersTab 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortOption={sortOption}
              setSortOption={setSortOption}
              setCurrentPage={setCurrentPage}
              currentPage={currentPage}
              isLoading={isLoading}
              loadOrders={loadOrders}
              paginatedOrders={paginatedOrders}
              totalPages={totalPages}
              openOrder={openOrder}
              setIsModalOpen={setIsModalOpen}
            />
          )}
          {currentTab === 'shipping' && (
            <ShippingTab
              filteredOrders={filteredOrders}
              activeOrder={activeOrder}
              handoverImageUrl={handoverImageUrl}
              note={note}
              isSubmitting={isSubmitting}
              error={error}
              message={message}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openOrder={openOrder}
              setMode={setMode}
              setHandoverImageFile={setHandoverImageFile}
              handoverImageFile={handoverImageFile}
              setNote={setNote}
              handleHandoverImageUploaded={handleHandoverImageUploaded}
              submitShipping={submitShipping}
              markOrderRented={markOrderRented}
              handleDeliveryFailed={handleDeliveryFailed}
              handleLostPackage={handleLostPackage}
              setPreviewImage={setPreviewImage}
            />
          )}
          {currentTab === 'pickup' && (
            <PickupTab
              filteredOrders={filteredOrders}
              activeOrder={activeOrder}
              handoverImageUrl={handoverImageUrl}
              note={note}
              isSubmitting={isSubmitting}
              error={error}
              message={message}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openOrder={openOrder}
              setMode={setMode}
              setHandoverImageFile={setHandoverImageFile}
              handoverImageFile={handoverImageFile}
              setNote={setNote}
              handleHandoverImageUploaded={handleHandoverImageUploaded}
              submitHandover={submitHandover}
              setPreviewImage={setPreviewImage}
            />
          )}
          {currentTab === 'return' && (
            <ReturnTab
              filteredOrders={filteredOrders}
              activeOrder={activeOrder}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openOrder={openOrder}
              setMode={setMode}
              setPreviewImage={setPreviewImage}
              onOrderCompleted={loadOrders}
              returnOrder={returnOrder}
              markOrderReturned={markOrderReturned}
              handleLostPackage={handleLostPackage}
            />
          )}
          {currentTab === 'profile' && (
            <ProfileTab currentUser={currentUser} />
          )}
        </>
      )}
      
      {/* Detail Modal Overlay for Orders tab when "Chi tiết" is clicked */}
      {isModalOpen && activeOrder && (currentTab === 'dashboard' || currentTab === 'orders' || currentTab === 'history') && (
        <StaffOrderDetailModal 
          activeOrder={activeOrder} 
          setIsModalOpen={setIsModalOpen} 
          setPreviewImage={setPreviewImage} 
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-h-full max-w-full object-contain" />
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
