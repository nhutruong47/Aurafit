import { useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../store/useCheckoutStore';
import { useState } from 'react';
import { getOrderCode, getOrderTimeline, mapOrderStatus } from './orderUtils';
import OrderTimeline from './OrderTimeline';
import OrderSummaryCard from './OrderSummaryCard';
import CustomerOrderDetailSkeleton from './CustomerOrderDetailSkeleton';
import RentalExtensionModal from './RentalExtensionModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToastStore } from '../../store/useToastStore';

// GHN tracking URL builder
const GHN_TRACKING_BASE = 'https://tracking.ghn.dev/?order_code=';

// Statuses at or past a given step in GHN flow
const GHN_SHOW_OUTBOUND = ['SHIPPING', 'RENTED', 'RETURNING', 'RETURNED', 'PENDING_REFUND', 'COMPLETED'];
const GHN_SHOW_INBOUND  = ['RETURNING', 'RETURNED', 'PENDING_REFUND', 'COMPLETED'];
const REFUND_STATUSES    = ['PENDING_REFUND', 'COMPLETED'];

function TrackingCodeLink({ label, code }) {
  const addToast = useToastStore((s) => s.addToast);

  if (!code) return null;

  const handleCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(code);
      addToast('Đã sao chép mã vận đơn!');
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      addToast('Đã sao chép mã vận đơn!');
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#5f5e5e]">{label}</span>
      <div className="flex items-center gap-2">
        <a
          href={`${GHN_TRACKING_BASE}${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm font-bold text-[#1c6b9a] underline underline-offset-2 transition hover:text-[#7f7041]"
        >
          {code}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center rounded-sm border border-[#d7d2c8] p-1 text-[#5f5e5e] transition hover:bg-[#f4f4f2] hover:text-[#111111]"
          title="Sao chép mã vận đơn"
        >
          <span className="material-symbols-outlined text-[14px]">content_copy</span>
        </button>
        <a
          href={`${GHN_TRACKING_BASE}${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-sm border border-[#d7d2c8] p-1 text-[#5f5e5e] transition hover:bg-[#f4f4f2] hover:text-[#111111]"
          title="Tra cứu trên GHN"
        >
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>
    </div>
  );
}

export default function OrderDetailsPanel({ order, isDetailLoading, onCancel, currentUser, onReload }) {
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const statusInfo = mapOrderStatus(order.status, order);
  const timeline = getOrderTimeline(order);
  const navigate = useNavigate();
  const setPendingOrderId = useCheckoutStore((state) => state.setPendingOrderId);

  const handlePayNow = () => {
    setPendingOrderId(order.id);
    navigate('/payment');
  };

  const isGHN = order.deliveryMethod !== 'STORE_PICKUP';
  const showOutboundTracking = isGHN && order.ghnOrderCode && GHN_SHOW_OUTBOUND.includes(order.status);
  const showInboundTracking  = isGHN && order.ghnReturnOrderCode && GHN_SHOW_INBOUND.includes(order.status);
  const showTrackingBlock = showOutboundTracking || showInboundTracking;
  const showRefundBlock = REFUND_STATUSES.includes(order.status);

  // Calculate refund amount for display
  const depositAmount = Number(order.totalDeposit) || 0;
  const lateFee = Number(order.totalLateFee) || 0;
  const damageFee = Number(order.totalDamageFee) || 0;
  const refundedAmount = order.totalRefundedAmount != null
    ? Number(order.totalRefundedAmount) || 0
    : Math.max(0, depositAmount - lateFee - damageFee);

  return (
    <>
      <div className="sticky top-28 border border-[#cfc4c5] bg-white p-8 md:p-10">
        <div className="mb-8 flex items-baseline justify-between border-b border-[#cfc4c5] pb-6">
          <h2 className="font-serif text-3xl font-normal">Chi tiết: {getOrderCode(order.id)}</h2>
          <div className="flex items-center gap-4">
            {(order.status === 'RENTED' || order.status === 'CONFIRMED') && (
              <button 
                onClick={() => setIsExtensionModalOpen(true)} 
                className="text-[10px] font-bold uppercase tracking-wider text-black border-b border-black hover:text-[#99854e] hover:border-[#99854e] transition"
              >
                Gia hạn thuê
              </button>
            )}
            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && onCancel && (
              <button onClick={() => onCancel(order.id)} className="text-[10px] font-bold uppercase tracking-wider text-red-600 transition hover:text-red-800">
                Hủy đơn
              </button>
            )}
            {order.status === 'PENDING' && (
              <button 
                onClick={handlePayNow}
                className="bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#99854e]"
              >
                Thanh toán ngay
              </button>
            )}
            <span className={`text-[12px] font-bold uppercase tracking-[0.2em] ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
        
        {(order.status === 'RENTED' || order.status === 'RETURNING' || order.status === 'PENDING_REFUND') && (!currentUser?.bankName || !currentUser?.bankAccountNumber || !currentUser?.bankAccountName) && (
          <div className="mb-8 border border-yellow-300 bg-yellow-50 p-4 rounded-md">
            <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <span className="material-symbols-outlined">lightbulb</span>
              💡 Cập nhật Thông tin Ngân hàng ngay để AuraFit hoàn cọc siêu tốc cho bạn nhé!
            </p>
            <button 
              onClick={() => navigate('/account')}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-yellow-900 underline hover:text-yellow-700"
            >
              Cập nhật ngay
            </button>
          </div>
        )}

      <div
        className={`transition-opacity duration-300 ${isDetailLoading ? 'opacity-40' : 'opacity-100'}`}
      >
        {isDetailLoading && !order.details ? (
          <CustomerOrderDetailSkeleton />
        ) : (
          <>
            {/* Timeline */}
            <div className="mb-12">
              <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                Tiến trình đơn hàng
              </h3>
              <OrderTimeline timeline={timeline} />
            </div>

            {/* GHN Tracking Block */}
            {showTrackingBlock && (
              <div className="mb-12 border border-[#d7d2c8] bg-[#fafaf8] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                  <span className="material-symbols-outlined text-[16px] text-[#7f7041]">local_shipping</span>
                  Thông tin Vận chuyển
                </h3>
                <div className="divide-y divide-[#ebe7df]">
                  {showOutboundTracking && (
                    <TrackingCodeLink label="Mã vận đơn giao hàng" code={order.ghnOrderCode} />
                  )}
                  {showInboundTracking && (
                    <TrackingCodeLink label="Mã vận đơn thu hồi" code={order.ghnReturnOrderCode} />
                  )}
                </div>
              </div>
            )}

            {/* Receiver Info + Payment */}
            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                  Thông tin nhận hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Người nhận:</span> {order.receiverName}</p>
                  <p><span className="font-medium">Số điện thoại:</span> {order.receiverPhone}</p>
                  {order.deliveryMethod === 'STORE_PICKUP' ? (
                    <p><span className="font-medium">Địa chỉ cửa hàng:</span> 102/9/12 100 Bình Thới</p>
                  ) : (
                    <p><span className="font-medium">Địa chỉ nhận hàng:</span> {order.deliveryAddress}</p>
                  )}
                  <p><span className="font-medium">Phương thức:</span> {order.deliveryMethod === 'STORE_PICKUP' ? 'Lấy tại cửa hàng' : 'Giao hàng tận nơi'}</p>
                </div>
              </div>
              <div>
                <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                  Thanh toán
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#5f5e5e]">Tiền thuê:</span>
                    <span className="font-semibold text-black">{formatCurrency(order.totalRentalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#5f5e5e]">Tiền cọc:</span>
                    <span className="font-semibold text-black">{formatCurrency(order.totalDeposit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#5f5e5e]">Phí giao hàng:</span>
                    <span className="font-semibold text-black">{formatCurrency(order.shippingFee)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-[#087b3f]">
                      <span className="font-medium">Giảm giá:</span>
                      <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold border-t border-[#cfc4c5] pt-4 mt-2">
                    <span className="text-[11px] uppercase tracking-wider text-black">Tổng cộng:</span>
                    <span className="text-base text-black">{formatCurrency(order.finalAmount)}</span>
                  </div>
                </div>

                {/* Refund Breakdown for COMPLETED / PENDING_REFUND */}
                {showRefundBlock && (
                  <div className="mt-6 border-t border-[#d7d2c8] pt-4">
                    <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">
                      <span className="material-symbols-outlined text-[14px] text-[#7f7041]">account_balance</span>
                      Nghiệm thu & Hoàn cọc
                    </h4>
                    <div className="space-y-2 text-sm">
                      {lateFee > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Phí phạt trễ:</span>
                          <span>- {formatCurrency(lateFee)}</span>
                        </div>
                      )}
                      {damageFee > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Phí hư hỏng/thất lạc:</span>
                          <span>- {formatCurrency(damageFee)}</span>
                        </div>
                      )}
                      {(lateFee === 0 && damageFee === 0) && (
                        <div className="flex justify-between text-[#087b3f]">
                          <span>Không có phí phạt</span>
                          <span>0 đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-[#d7d2c8] pt-2 mt-2 text-[#087b3f]">
                        <span>Hoàn cọc cho khách:</span>
                        <span>{formatCurrency(refundedAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <OrderSummaryCard details={order.details} />
          </>
        )}
      </div>
      <RentalExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        order={order}
        onSuccess={onReload}
      />
    </div>
    </>
  );
}
