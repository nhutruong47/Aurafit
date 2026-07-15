import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useStaffRentalOrders } from '../hooks/useStaffRentalOrders';
import AlertMessage from '../components/ui/AlertMessage';
import ImageUploadField from '../components/ui/ImageUploadField';
import { changePassword } from '../services/userService';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN');
};

const detailStatusLabels = {
  PICKED_UP: 'Đã nhận hàng',
  CONFIRMED: 'Chờ nhận',
  RETURNED: 'Đã trả',
  CANCELLED: 'Đã hủy',
};

const getDetailStatusLabel = (status) => detailStatusLabels[status] || status;

const canShowPickupInfo = (status) => ['PICKED_UP', 'RETURNED', 'COMPLETED', 'DAMAGED', 'LOST'].includes(status);

const getEvidenceImageUrl = (handover) => (
  handover?.imageUrl || handover?.image_url || handover?.handoverImageUrl || handover?.secureUrl || handover?.secure_url || handover?.url || ''
).trim();

const getStaffPickupInfo = (order) => {
  const pickupHandovers = (Array.isArray(order?.handovers) ? order.handovers : []).filter((handover) => {
    const handoverType = String(handover?.handoverType || '').toUpperCase();
    return handoverType === 'PICKUP';
  });
  const pickupHandover = pickupHandovers[0];
  const pickupImages = pickupHandovers
    .map(getEvidenceImageUrl)
    .filter(Boolean)
    .map((imageUrl) => String(imageUrl).trim())
    .filter(Boolean)
    .filter((imageUrl, index, images) => images.indexOf(imageUrl) === index);
  const pickupNote = pickupHandovers
    .map((handover) => handover?.note)
    .find((note) => note && String(note).trim()) ?? '';

  return {
    pickedUpAt: pickupHandover?.createdAt || '',
    pickedUpBy: pickupHandover?.staffUserName || '',
    pickupNote,
    pickupImages,
    canUpdateImage: pickupHandovers.length > 0,
  };
};

const getStaffReturnInfo = (order) => {
  const returnHandovers = (Array.isArray(order?.handovers) ? order.handovers : []).filter((handover) => {
    const handoverType = String(handover?.handoverType || '').toUpperCase();
    return handoverType === 'RETURN';
  });
  const returnHandover = returnHandovers[0];
  const returnImages = returnHandovers
    .map(getEvidenceImageUrl)
    .filter(Boolean)
    .map((imageUrl) => String(imageUrl).trim())
    .filter(Boolean)
    .filter((imageUrl, index, images) => images.indexOf(imageUrl) === index);
  const returnNote = returnHandovers
    .map((handover) => handover?.note)
    .find((note) => note && String(note).trim()) ?? '';

  return {
    returnedAt: returnHandover?.createdAt || '',
    returnedBy: returnHandover?.staffUserName || '',
    returnNote,
    returnImages,
    canUpdateImage: returnHandovers.length > 0,
  };
};

const StatusBadge = ({ status, label }) => {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PICKED_UP: 'bg-indigo-100 text-indigo-800',
    RETURNED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    DAMAGED: 'bg-orange-100 text-orange-800',
    LOST: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {label || status}
    </span>
  );
};

export default function StaffDashboardPage({ currentUser, onNavigate }) {
  const navigate = useNavigate();
  const { currentTab } = useOutletContext() || { currentTab: 'dashboard' };
  
  const {
    canUseStaffTools,
    orders,
    activeOrder,
    mode,
    selectedDetailId,
    selectedDetail,
    returnStatus,
    handoverImageUrl,
    note,
    previewImage,
    isLoading,
    isSubmitting,
    updatingHandoverImageType,
    message,
    error,
    activeTotals,
    loadOrders,
    openOrder,
    setMode,
    setSelectedDetailId,
    setReturnStatus,
    setHandoverImageUrl,
    setNote,
    setPreviewImage,
    handleHandoverImageUploaded,
    updateHandoverEvidenceImage,
    submitHandover,
    lateFee,
    setLateFee,
    damageFee,
    setDamageFee,
    maxDeposit,
    isPenaltyValid,
    priorityOrders,
  } = useStaffRentalOrders(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Profile states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

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
    
    if (currentTab === 'pickup') {
      filtered = filtered.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
    } else if (currentTab === 'return') {
      filtered = filtered.filter(o => o.status === 'PICKED_UP');
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

    if (currentTab === 'orders' || currentTab === 'history') {
      filtered = [...filtered].sort((a, b) => {
        if (sortOption === 'NEWEST') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortOption === 'OLDEST') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortOption === 'PRICE_DESC') return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (sortOption === 'PRICE_ASC') return (a.totalAmount || 0) - (b.totalAmount || 0);
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setProfileErr('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setProfileErr('');
    setProfileMsg('');
    setIsChangingPwd(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setProfileMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setProfileErr(err.message || 'Lỗi đổi mật khẩu.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng đơn', value: activeTotals.totalOrders, icon: 'inventory_2' },
          { label: 'Chờ chuẩn bị', value: activeTotals.pending, icon: 'hourglass_empty' },
          { label: 'Chờ bàn giao', value: activeTotals.confirmed, icon: 'inventory' },
          { label: 'Đang thuê', value: activeTotals.renting, icon: 'local_shipping' },
          { label: 'Chờ trả', value: activeTotals.overdue, icon: 'warning', color: 'text-red-600' },
          { label: 'Đã hoàn thành', value: activeTotals.returned, icon: 'check_circle', color: 'text-green-600' },
        ].map((metric, idx) => (
          <div key={idx} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className={`material-symbols-outlined text-3xl ${metric.color || 'text-gray-400'}`}>
                    {metric.icon}
                  </span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{metric.label}</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{metric.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white shadow p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Công việc cần xử lý</h3>
        {priorityOrders?.length === 0 ? (
          <p className="text-sm text-gray-500">Tuyệt vời! Không có công việc nào cần xử lý khẩn cấp.</p>
        ) : (
          <div className="space-y-4">
            {priorityOrders?.map(order => (
               <div key={order.id} className="flex flex-wrap items-center justify-between py-3 border-b last:border-0 text-sm gap-4">
                  <div>
                    <span className="font-medium text-gray-900 block mb-1">RO-{String(order.id).padStart(4, '0')} - {order.customerName}</span>
                    <span className="text-xs text-gray-500 block">Ngày giao: {formatDate(order.rentalStartDate)} | Ngày trả: {formatDate(order.rentalEndDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <button onClick={() => { openOrder(order.id); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900 font-medium text-xs">Xem chi tiết</button>
                    {order.status === 'CONFIRMED' && (
                      <button onClick={() => { navigate('/staff?tab=pickup'); setTimeout(() => openOrder(order.id), 100); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Đi tới Pickup</button>
                    )}
                    {order.status === 'PICKED_UP' && (
                      <button onClick={() => { navigate('/staff?tab=return'); setTimeout(() => openOrder(order.id), 100); }} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700">Đi tới Return</button>
                    )}
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderOrderList = () => (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ chuẩn bị (Pending)</option>
            <option value="CONFIRMED">Chờ bàn giao (Confirmed)</option>
            <option value="PICKED_UP">Đang thuê (Picked Up)</option>
            <option value="RETURNED">Đã trả (Returned)</option>
            <option value="CANCELLED">Đã hủy (Cancelled)</option>
            <option value="COMPLETED">Hoàn thành (Completed)</option>
          </select>
          <select
            value={sortOption}
            onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
            className="block rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3 bg-white"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="PRICE_DESC">Tổng tiền cao nhất</option>
            <option value="PRICE_ASC">Tổng tiền thấp nhất</option>
          </select>
        </div>
        <button
          onClick={() => loadOrders()}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm border whitespace-nowrap ${isLoading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Tải lại
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg bg-white shadow flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày thuê</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày trả</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tiền cọc</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      RO-{String(order.id).padStart(4, '0')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs">{order.customerPhone}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.rentalStartDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.rentalEndDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(order.depositAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => { openOrder(order.id); setIsModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6 shrink-0">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">Trước</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100">Tiếp</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Đang hiển thị trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100">
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderActionTab = (actionMode) => {
    const isOrderValidForTab = activeOrder && filteredOrders.some(o => o.id === activeOrder.id);

    return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input
               type="text"
               placeholder="Tìm mã đơn, tên khách..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
             />
           </div>
        </div>
        <div className="flex-1 overflow-auto rounded-lg bg-white shadow-sm border border-gray-200 divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Không có đơn hàng cần xử lý.</div>
          ) : (
            filteredOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setMode(actionMode);
                  openOrder(order.id);
                }}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${activeOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">RO-{String(order.id).padStart(4, '0')}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm text-gray-600 truncate">{order.customerName}</div>
                <div className="text-xs text-gray-400 mt-1">{formatDate(order.rentalStartDate)}</div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 overflow-auto">
        {error && <AlertMessage text={error} />}
        {message && <AlertMessage tone="success" text={message} />}
        
        {!isOrderValidForTab ? (
          <div className="flex-1 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-500">
            Chọn một đơn hàng bên trái để xử lý
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalStartDate)}</span></div>
                <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalEndDate)}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600">{formatCurrency(activeOrder.depositAmount)}</span></div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 flex-1 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Biên bản xử lý {actionMode}</h3>
              <div className="flex-1 flex gap-6">
                <div className="w-1/2 flex flex-col gap-4 overflow-auto pr-2">
                  <h4 className="font-medium text-sm text-gray-700">Danh sách sản phẩm</h4>
                  {activeOrder.details?.map(detail => (
                    <button
                      key={detail.id}
                      onClick={() => setSelectedDetailId(detail.id)}
                      className={`p-3 border rounded-md text-left transition-colors ${String(selectedDetailId) === String(detail.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="font-medium text-gray-900 truncate">{detail.costumeName}</div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Cọc: {formatCurrency(detail.depositPrice)}</span>
                        <span>{detail.returnStatus || 'PENDING'}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="w-1/2 flex flex-col gap-4 border-l pl-6">
                  {selectedDetail ? (
                    <form onSubmit={(e) => { e.preventDefault(); submitHandover(); }} className="space-y-4">
                      {actionMode === 'RETURN' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng trả</label>
                          <select
                            value={returnStatus}
                            onChange={(e) => setReturnStatus(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
                          >
                            <option value="RETURNED">Bình thường (Returned)</option>
                            <option value="DAMAGED">Hư hỏng (Damaged)</option>
                            <option value="LOST">Mất mát (Lost)</option>
                          </select>
                        </div>
                      )}
                      
                      {actionMode === 'RETURN' && (returnStatus === 'DAMAGED' || returnStatus === 'LOST') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phí hư hỏng</label>
                            <input
                              type="number"
                              min="0"
                              value={damageFee}
                              onChange={(e) => setDamageFee(e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phí trả trễ</label>
                            <input
                              type="number"
                              min="0"
                              value={lateFee}
                              onChange={(e) => setLateFee(e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
                            />
                          </div>
                          {!isPenaltyValid && (
                            <div className="col-span-2 text-xs text-red-600">
                              Tổng phí phạt ({formatCurrency(Number(damageFee) + Number(lateFee))}) không được vượt quá tiền cọc ({formatCurrency(maxDeposit)}).
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh chứng</label>
                        <ImageUploadField
                          label=""
                          value={handoverImageUrl}
                          disabled={isSubmitting}
                          readyLabel="Ảnh đã được tải lên Cloudinary."
                          autoUpload={actionMode === 'PICKUP' || actionMode === 'RETURN'}
                          onUploaded={handleHandoverImageUploaded}
                        />
                        {handoverImageUrl && (
                           <button
                             type="button"
                             onClick={() => setPreviewImage(handoverImageUrl)}
                             className="mt-2 aspect-video w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200"
                           >
                             <img src={handoverImageUrl} className="w-full h-full object-cover" alt="Minh chứng" />
                           </button>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-3"
                          placeholder="Ghi chú thêm..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || ((actionMode === 'PICKUP' || actionMode === 'RETURN') && !handoverImageUrl.trim()) || (actionMode === 'RETURN' && !isPenaltyValid)}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                      >
                        {isSubmitting ? 'Đang xử lý...' : `Xác nhận ${actionMode}`}
                      </button>
                    </form>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                      Chọn một sản phẩm để thao tác
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-3">Thông tin cá nhân</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">{currentUser.fullName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">{currentUser.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-blue-700 font-bold">{currentUser.role}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-3">Đổi mật khẩu</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {profileMsg && <AlertMessage tone="success" text={profileMsg} />}
          {profileErr && <AlertMessage text={profileErr} />}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPwd || !oldPassword || !newPassword}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isChangingPwd ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );

  const modalPickupInfo = getStaffPickupInfo(activeOrder);
  const showModalPickupInfo = canShowPickupInfo(activeOrder?.status);
  const modalReturnInfo = getStaffReturnInfo(activeOrder);
  const showModalReturnInfo = modalReturnInfo.returnedAt || modalReturnInfo.returnedBy || modalReturnInfo.returnNote || modalReturnInfo.returnImages.length > 0;

  return (
    <div className="h-full relative">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {currentTab === 'dashboard' && renderDashboard()}
          {currentTab === 'orders' && renderOrderList()}
          {currentTab === 'pickup' && renderActionTab('PICKUP')}
          {currentTab === 'return' && renderActionTab('RETURN')}
          {currentTab === 'history' && renderOrderList()}
          {currentTab === 'profile' && renderProfile()}
        </>
      )}
      
      {/* Detail Modal Overlay for Orders tab when "Chi tiết" is clicked */}
      {isModalOpen && activeOrder && (currentTab === 'dashboard' || currentTab === 'orders' || currentTab === 'history') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900">Chi tiết đơn hàng RO-{String(activeOrder.id).padStart(4, '0')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50 p-4 rounded-lg">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Trạng thái:</span> <StatusBadge status={activeOrder.status} label={getDetailStatusLabel(activeOrder.status)} /></div>
                <div><span className="text-gray-500">Tổng tiền:</span> <span className="font-medium text-blue-600">{formatCurrency(activeOrder.totalAmount)}</span></div>
              </div>
              {showModalPickupInfo && (
                <section className="mb-6 rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin Pickup</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    {modalPickupInfo.pickedUpAt && (
                      <div>
                        <span className="text-gray-500">Thời gian Pickup:</span>
                        <p className="mt-1 font-medium">{formatDateTime(modalPickupInfo.pickedUpAt)}</p>
                      </div>
                    )}
                    {modalPickupInfo.pickedUpBy && (
                      <div>
                        <span className="text-gray-500">Nhân viên Pickup:</span>
                        <p className="mt-1 font-medium">{modalPickupInfo.pickedUpBy}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Ghi chú Pickup:</span>
                      <p className="mt-1 font-medium whitespace-pre-line">{modalPickupInfo.pickupNote || 'Chưa có ghi chú'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Ảnh minh chứng Pickup:</span>
                      {modalPickupInfo.pickupImages.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {modalPickupInfo.pickupImages.map((imageUrl, index) => (
                            <button
                              key={imageUrl}
                              type="button"
                              onClick={() => setPreviewImage(imageUrl)}
                              className="block h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                            >
                              <img src={imageUrl} alt={`Ảnh minh chứng Pickup ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 font-medium">Không có ảnh minh chứng</p>
                      )}
                      {modalPickupInfo.canUpdateImage && (
                        <div className="mt-4 rounded-md border border-dashed border-gray-300 p-3">
                          <ImageUploadField
                            label={modalPickupInfo.pickupImages.length > 0 ? 'Cập nhật ảnh Pickup' : 'Bổ sung ảnh Pickup'}
                            value={modalPickupInfo.pickupImages[0] || ''}
                            disabled={Boolean(updatingHandoverImageType)}
                            readyLabel="Ảnh Pickup hiện tại."
                            autoUpload
                            showPreview={false}
                            onUploaded={(asset) => updateHandoverEvidenceImage('PICKUP', asset)}
                          />
                          {updatingHandoverImageType === 'PICKUP' && (
                            <p className="mt-2 text-sm text-blue-700">Đang cập nhật ảnh Pickup...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
              {showModalReturnInfo && (
                <section className="mb-6 rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin Return</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    {modalReturnInfo.returnedAt && (
                      <div>
                        <span className="text-gray-500">Thời gian Return:</span>
                        <p className="mt-1 font-medium">{formatDateTime(modalReturnInfo.returnedAt)}</p>
                      </div>
                    )}
                    {modalReturnInfo.returnedBy && (
                      <div>
                        <span className="text-gray-500">Nhân viên Return:</span>
                        <p className="mt-1 font-medium">{modalReturnInfo.returnedBy}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Ghi chú Return:</span>
                      <p className="mt-1 font-medium whitespace-pre-line">{modalReturnInfo.returnNote || 'Chưa có ghi chú'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">Ảnh minh chứng Return:</span>
                      {modalReturnInfo.returnImages.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {modalReturnInfo.returnImages.map((imageUrl, index) => (
                            <button
                              key={imageUrl}
                              type="button"
                              onClick={() => setPreviewImage(imageUrl)}
                              className="block h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                            >
                              <img src={imageUrl} alt={`Ảnh minh chứng Return ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 font-medium">Không có ảnh minh chứng</p>
                      )}
                      {modalReturnInfo.canUpdateImage && (
                        <div className="mt-4 rounded-md border border-dashed border-gray-300 p-3">
                          <ImageUploadField
                            label={modalReturnInfo.returnImages.length > 0 ? 'Cập nhật ảnh Return' : 'Bổ sung ảnh Return'}
                            value={modalReturnInfo.returnImages[0] || ''}
                            disabled={Boolean(updatingHandoverImageType)}
                            readyLabel="Ảnh Return hiện tại."
                            autoUpload
                            showPreview={false}
                            onUploaded={(asset) => updateHandoverEvidenceImage('RETURN', asset)}
                          />
                          {updatingHandoverImageType === 'RETURN' && (
                            <p className="mt-2 text-sm text-blue-700">Đang cập nhật ảnh Return...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
              <h4 className="font-medium text-gray-900 mb-3">Danh sách sản phẩm</h4>
              <div className="space-y-3">
                {activeOrder.details?.map(detail => (
                  <div key={detail.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{detail.costumeName}</p>
                      <p className="text-sm text-gray-500 mt-1">Giá thuê: {formatCurrency(detail.rentalPrice)} | Cọc: {formatCurrency(detail.depositPrice)}</p>
                    </div>
                    <StatusBadge status={detail.returnStatus || 'PENDING'} label={getDetailStatusLabel(detail.returnStatus || 'PENDING')} />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end rounded-b-lg">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-5" role="dialog">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 text-white hover:text-gray-300"
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <img src={previewImage} alt="Preview" className="max-h-full max-w-full rounded shadow-xl" />
        </div>
      )}
    </div>
  );
}
