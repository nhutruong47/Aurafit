import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const mockItems = [
  { id: 1, name: 'Áo dài trắng truyền thống', rentalFee: 350000, deposit: 500000, days: 2, gradient: 'from-pink-500 to-rose-300' },
  { id: 2, name: 'Vest đen classic slim-fit', rentalFee: 500000, deposit: 800000, days: 2, gradient: 'from-gray-700 to-gray-500' },
  { id: 3, name: 'Phụ kiện nơ + cài áo', rentalFee: 50000, deposit: 100000, days: 2, gradient: 'from-amber-400 to-yellow-300' },
];

const paymentMethods = [
  { id: 'vnpay', name: 'VNPay', icon: '💳', desc: 'Thanh toán qua VNPay' },
  { id: 'momo', name: 'Momo', icon: '📱', desc: 'Ví điện tử Momo' },
  { id: 'cash', name: 'Tiền mặt', icon: '💵', desc: 'Thanh toán khi nhận' },
];

export default function Checkout() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    startDate: '',
    endDate: '',
  });
  const [selectedPayment, setSelectedPayment] = useState('vnpay');

  const totalDeposit = mockItems.reduce((sum, item) => sum + item.deposit, 0);
  const totalRental = mockItems.reduce((sum, item) => sum + item.rentalFee * item.days, 0);
  const grandTotal = totalDeposit + totalRental;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Thanh toán</h1>
          <p className="text-gray-400">Xác nhận đơn hàng và hoàn tất thanh toán</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left - Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">1</span>
                Thông tin khách hàng
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901 234 567"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all duration-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ngày bắt đầu thuê</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all duration-300 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ngày trả</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all duration-300 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">2</span>
                Phương thức thanh toán
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                      selectedPayment === method.id
                        ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/40 shadow-lg shadow-primary-500/10'
                        : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
                    }`}
                  >
                    {selectedPayment === method.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="text-sm font-semibold text-white">{method.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-6">Đơn hàng của bạn</h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {mockItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.days} ngày</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deposit Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Tiền cọc (Deposit)</h3>
                </div>
                <div className="space-y-2 pl-4 border-l border-amber-400/20">
                  {mockItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-400 truncate mr-2">{item.name}</span>
                      <span className="text-gray-300 whitespace-nowrap">{formatCurrency(item.deposit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/[0.06]">
                    <span className="text-amber-400">Tổng tiền cọc</span>
                    <span className="text-amber-300">{formatCurrency(totalDeposit)}</span>
                  </div>
                </div>
              </div>

              {/* Rental Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">Tiền thuê (Rental Fee)</h3>
                </div>
                <div className="space-y-2 pl-4 border-l border-primary-400/20">
                  {mockItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-400 truncate mr-2">{item.name} × {item.days} ngày</span>
                      <span className="text-gray-300 whitespace-nowrap">{formatCurrency(item.rentalFee * item.days)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/[0.06]">
                    <span className="text-primary-400">Tổng tiền thuê</span>
                    <span className="text-primary-300">{formatCurrency(totalRental)}</span>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-white/[0.08] mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Tổng cộng</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Bao gồm tiền cọc + tiền thuê</p>
              </div>

              {/* Submit Button */}
              <button className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-white text-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/25 active:scale-[0.98]">
                Xác nhận đặt hàng
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                Bằng việc xác nhận, bạn đồng ý với{' '}
                <span className="text-primary-400 hover:underline cursor-pointer">điều khoản sử dụng</span>{' '}
                của chúng tôi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
