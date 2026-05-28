import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const allCostumes = [
  {
    id: 1,
    name: 'Áo dài trắng truyền thống',
    price: 350000,
    category: 'Kỷ yếu',
    gradient: 'from-pink-500 to-rose-300',
    available: true,
  },
  {
    id: 2,
    name: 'Vest đen classic slim-fit',
    price: 500000,
    category: 'Dạ hội',
    gradient: 'from-gray-700 to-gray-500',
    available: true,
  },
  {
    id: 3,
    name: 'Kimono hoa anh đào',
    price: 650000,
    category: 'Cosplay',
    gradient: 'from-pink-400 to-purple-400',
    available: false,
  },
  {
    id: 4,
    name: 'Hanbok xanh pastel',
    price: 600000,
    category: 'Cosplay',
    gradient: 'from-cyan-400 to-blue-400',
    available: true,
  },
  {
    id: 5,
    name: 'Áo cử nhân đại học',
    price: 200000,
    category: 'Kỷ yếu',
    gradient: 'from-indigo-600 to-blue-500',
    available: true,
  },
  {
    id: 6,
    name: 'Váy dạ hội đỏ ruby',
    price: 800000,
    category: 'Dạ hội',
    gradient: 'from-red-500 to-orange-400',
    available: true,
  },
  {
    id: 7,
    name: 'Áo dài cưới thêu phượng',
    price: 900000,
    category: 'Tiệc cưới',
    gradient: 'from-yellow-400 to-amber-500',
    available: true,
  },
  {
    id: 8,
    name: 'Váy cưới trắng công chúa',
    price: 1200000,
    category: 'Tiệc cưới',
    gradient: 'from-white to-gray-200',
    available: false,
  },
];

const categories = ['Tất cả', 'Kỷ yếu', 'Cosplay', 'Tiệc cưới', 'Dạ hội'];

export default function Catalog({ onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const filteredCostumes =
    activeFilter === 'Tất cả'
      ? allCostumes
      : allCostumes.filter((c) => c.category === activeFilter);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Bộ sưu tập{' '}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              trang phục
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Khám phá hàng trăm mẫu trang phục cho mọi dịp — từ kỷ yếu, cosplay đến tiệc cưới và dạ hội.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeFilter === cat
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Hiển thị <span className="text-white font-medium">{filteredCostumes.length}</span> trang phục
            {activeFilter !== 'Tất cả' && (
              <span> trong danh mục <span className="text-primary-400">{activeFilter}</span></span>
            )}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCostumes.map((costume) => (
            <div
              key={costume.id}
              className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1"
            >
              {/* Image Placeholder */}
              <div className="relative h-56 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${costume.gradient} opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700`} />
                <div className="absolute inset-0 bg-black/10" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
                    {costume.category}
                  </span>
                </div>

                {/* Availability Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                    costume.available
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {costume.available ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </div>

                {/* Quick View on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                  <button className="px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium border border-white/30 hover:bg-white/30 transition-colors duration-200">
                    Xem chi tiết
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-base font-semibold text-white mb-3 group-hover:text-primary-300 transition-colors duration-300 line-clamp-1">
                  {costume.name}
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">Giá thuê / ngày</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                      {formatCurrency(costume.price)}
                    </span>
                  </div>
                  <button
                    disabled={!costume.available}
                    onClick={() => onNavigate && onNavigate('checkout')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 active:scale-95 ${
                      costume.available
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 hover:shadow-lg hover:shadow-primary-500/25'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Thuê ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCostumes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy trang phục</h3>
            <p className="text-gray-500">Thử chọn danh mục khác để xem thêm</p>
          </div>
        )}
      </div>
    </div>
  );
}
