import { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const mockCostumes = [
  {
    id: 1,
    name: 'Áo dài trắng',
    price: 350000,
    gradient: 'from-pink-500 to-rose-300',
    tag: 'Phổ biến',
  },
  {
    id: 2,
    name: 'Vest đen classic',
    price: 500000,
    gradient: 'from-gray-700 to-gray-500',
    tag: 'Sang trọng',
  },
  {
    id: 3,
    name: 'Kimono hoa anh đào',
    price: 650000,
    gradient: 'from-pink-400 to-purple-400',
    tag: 'Độc đáo',
  },
  {
    id: 4,
    name: 'Hanbok xanh pastel',
    price: 600000,
    gradient: 'from-cyan-400 to-blue-400',
    tag: 'Nổi bật',
  },
  {
    id: 5,
    name: 'Áo cử nhân',
    price: 200000,
    gradient: 'from-indigo-600 to-blue-500',
    tag: 'Kỷ yếu',
  },
  {
    id: 6,
    name: 'Váy dạ hội đỏ',
    price: 800000,
    gradient: 'from-red-500 to-orange-400',
    tag: 'Premium',
  },
];

export default function Home({ onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-[#0f0f1a] to-accent-900/40" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/5 to-accent-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-400">AI-Powered Costume Recommendation</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              AuraFit
            </span>
            <br />
            <span className="text-white/90 text-3xl sm:text-4xl lg:text-5xl font-semibold">
              Thuê trang phục thông minh
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Khám phá bộ sưu tập trang phục đa dạng với công nghệ AI gợi ý phù hợp nhất cho bạn.
            Từ kỷ yếu, cosplay đến dạ hội — tất cả trong một nền tảng.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate && onNavigate('catalog')}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-white text-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105"
            >
              <span className="relative z-10">Khám phá ngay</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button className="px-8 py-4 rounded-xl font-semibold text-white text-lg border border-white/20 hover:bg-white/5 hover:border-white/40 transition-all duration-300 backdrop-blur-sm">
              Tìm hiểu thêm
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Trang phục' },
              { value: '2K+', label: 'Khách hàng' },
              { value: '4.9★', label: 'Đánh giá' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommended Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              AI Gợi ý cho bạn
            </h2>
          </div>
          <p className="text-gray-400 mb-12 ml-[52px]">
            Được lựa chọn bởi trí tuệ nhân tạo dựa trên xu hướng và sở thích
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCostumes.map((costume) => (
              <div
                key={costume.id}
                className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2"
                onMouseEnter={() => setHoveredId(costume.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image Placeholder */}
                <div className="relative h-64 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${costume.gradient} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700`} />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

                  {/* Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                      {costume.tag}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${hoveredId === costume.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors duration-300">
                    {costume.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                      {formatCurrency(costume.price)}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-sm font-medium text-white hover:from-primary-600 hover:to-accent-600 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95">
                      Thuê ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] " />
            <div className="relative p-12 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Sẵn sàng tỏa sáng?
              </h3>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Đăng ký ngay để nhận ưu đãi giảm 20% cho lần thuê đầu tiên
              </p>
              <button
                onClick={() => onNavigate && onNavigate('catalog')}
                className="px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Bắt đầu ngay
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
