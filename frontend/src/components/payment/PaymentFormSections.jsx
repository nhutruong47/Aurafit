function CheckoutSection({ number, title, meta, icon, children }) {
  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-normal italic">
          {number}. {title}
        </h2>
        {icon ? (
          <span className="material-symbols-outlined text-[#999999]">{icon}</span>
        ) : (
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-[#e8e2e3] pb-4">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
        {label}
      </p>
      <p className="text-sm leading-6 text-[#1a1c1c]">{value || 'Dang cap nhat'}</p>
    </div>
  );
}

function GoldDivider() {
  return <hr className="h-px border-none bg-gradient-to-r from-transparent via-[#99854e] to-transparent" />;
}

function formatDateRange(start, end) {
  if (!start || !end) return 'Dang cap nhat';

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

export default function PaymentFormSections({ order, paymentInit }) {
  const displayOrderId = order?.id || '----';

  return (
    <div className="space-y-16 lg:max-w-3xl">
      <CheckoutSection number="01" title="Thong tin giao hang" meta="Da tao tu checkout">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailRow label="Nguoi nhan" value={order?.receiverName} />
          <DetailRow label="So dien thoai" value={order?.receiverPhone} />
          <div className="md:col-span-2">
            <DetailRow label="Dia chi giao hang" value={order?.deliveryAddress} />
          </div>
        </div>
      </CheckoutSection>

      <GoldDivider />

      <CheckoutSection number="02" title="Thong tin don thue" meta="Doc tu backend">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DetailRow label="Ma don" value={`RO-${String(displayOrderId).padStart(4, '0')}`} />
          <DetailRow label="Trang thai hien tai" value={order?.status || 'PENDING'} />
          <DetailRow label="Thoi gian thue" value={formatDateRange(order?.rentalStartDate, order?.rentalEndDate)} />
          <DetailRow
            label="So san pham"
            value={order?.details?.length ? `${order.details.length} item` : 'Dang cap nhat'}
          />
        </div>
      </CheckoutSection>

      <GoldDivider />

      <CheckoutSection number="03" title="Thanh toan chuyen khoan" icon="verified_user">
        <div className="space-y-6">
          <div className="border border-[#cfc4c5] bg-white p-5">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
              Payment flow
            </p>
            <p className="font-serif text-3xl italic">RO-{String(displayOrderId).padStart(4, '0')}</p>
            <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">
              Frontend chi tao ma VietQR tu backend. Don hang chi chuyen sang CONFIRMED sau khi
              backend nhan webhook thanh toan thanh cong.
            </p>
          </div>
          <div className="border border-[#cfc4c5] bg-[#f7f7f7] p-5 text-sm leading-7">
            <p>
              <strong>Phuong thuc:</strong> Banking / VietQR
            </p>
            <p>
              <strong>Request body:</strong> {'{ orderId }'}
            </p>
            <p>
              <strong>Response:</strong> qrImageUrl, paymentContent, amount, orderId
            </p>
          </div>
          {paymentInit && (
            <div className="border border-[#cfc4c5] bg-white p-5 text-sm leading-7">
              <p>
                <strong>Noi dung chuyen khoan:</strong> {paymentInit.paymentContent}
              </p>
              <p>
                <strong>So tien can chuyen:</strong>{' '}
                {Number(paymentInit.amount || 0).toLocaleString('vi-VN')} VND
              </p>
            </div>
          )}
        </div>
      </CheckoutSection>
    </div>
  );
}
