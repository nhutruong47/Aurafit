import { useEffect, useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';
import { getShopByProductCategory } from '../utils/shopMock';

const initialMockReviews = [
  {
    id: 1,
    author: 'Nguyễn Minh Anh',
    rating: 5,
    date: '10/05/2026',
    comment: 'Trang phục rất đẹp, chất liệu vải cao cấp và lên form cực chuẩn. Dịch vụ tư vấn nhiệt tình, giao hàng nhanh chóng.',
  },
  {
    id: 2,
    author: 'Trần Hải Đăng',
    rating: 4,
    date: '02/06/2026',
    comment: 'Đồ lên form chuẩn, màu sắc y như hình chụp. Có một chút vết nhăn nhỏ do vận chuyển nhưng ủi sơ là đẹp ngay.',
  },
  {
    id: 3,
    author: 'Lê Ngọc Diệp',
    rating: 5,
    date: '12/06/2026',
    comment: 'Tuyệt vời! Mình thuê đồ đi dự dạ hội ai cũng khen. Sẽ tiếp tục ủng hộ AuraFit trong những sự kiện tới.',
  },
  {
    id: 4,
    author: 'Phạm Thu Hà',
    rating: 3,
    date: '15/06/2026',
    comment: 'Đồ tạm ổn nhưng form hơi rộng so với bảng size. Phải dùng thêm kẹp phía sau mới vừa.',
  },
  {
    id: 5,
    author: 'Hoàng Văn Thái',
    rating: 5,
    date: '20/06/2026',
    comment: 'Quá ưng ý. Đồ giặt thơm tho sạch sẽ, bọc trong túi xách rất chuyên nghiệp.',
  }
];

export default function ProductDetail({ product, onAddToCart, onNavigate, currentUser }) {
  const [reviews, setReviews] = useState(initialMockReviews);
  const [filterRating, setFilterRating] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [newReviewData, setNewReviewData] = useState({ rating: 5, comment: '' });

  const shop = useMemo(() => getShopByProductCategory(product?.rawCategory || product?.category), [product]);
  
  const isAdmin = useMemo(() => currentUser?.role?.split(',').some((role) => role.trim() === 'ADMIN'), [currentUser]);

  useEffect(() => {
    if (!product) {
      onNavigate?.('catalog');
    }
  }, [product, onNavigate]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => counts[r.rating]++);
    return { total, avg, counts };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let filtered = reviews;
    if (filterRating !== 'all') {
      filtered = reviews.filter(r => r.rating === Number(filterRating));
    }
    return filtered.sort((a, b) => b.id - a.id);
  }, [reviews, filterRating]);

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReviewData.comment.trim()) return;
    
    const newReview = {
      id: Date.now(),
      author: 'Bạn (Khách hàng)', // Giả lập user hiện tại
      rating: newReviewData.rating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: newReviewData.comment
    };
    
    setReviews([newReview, ...reviews]);
    setNewReviewData({ rating: 5, comment: '' });
    setShowReviewForm(false);
    setFilterRating('all');
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <button
          onClick={() => onNavigate?.('catalog')}
          className="mb-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] hover:text-black transition"
        >
          <span className="material-symbols-outlined text-[16px]">west</span>
          Quay lại
        </button>

        <div className="flex flex-col md:flex-row gap-12 bg-white border border-[#cfc4c5] p-6 md:p-12">
          {/* Product Image */}
          <div className="w-full md:w-1/2 aspect-[3/4] overflow-hidden border border-[#cfc4c5]/20 bg-[#f9f9f9]">
            <img
              src={product.image}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src = fallbackProductImage;
              }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-[#f0f0f0] text-xs font-semibold text-black uppercase tracking-wider mr-2">
                {product.category}
              </span>
              {product.tag && (
                <span className="px-3 py-1 rounded-full bg-[#99854e] text-xs font-semibold text-white uppercase tracking-wider">
                  {product.tag}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl md:text-5xl mb-2 text-black">
              {product.name}
            </h1>
            <p className="text-sm text-[#777777] mb-8">{product.subcategory}</p>

            <div className="grid grid-cols-2 gap-6 mb-10 py-6 border-y border-[#cfc4c5]/30">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#999999]">
                    Giá thuê
                  </span>
                  <span className="border border-[#99854e] text-[#99854e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                    Ưu đãi 20%
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl text-black">
                    {formatCurrency(product.priceValue)}
                  </span>
                  <span className="font-serif text-xl text-[#cfc4c5] line-through">
                    {formatCurrency(Math.round(product.priceValue * 1.25))}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#999999] block mb-2">
                  Tiền cọc
                </span>
                <span className="font-serif text-3xl text-[#99854e]">
                  {formatCurrency(product.depositValue)}
                </span>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-black mb-3">
                Mô tả sản phẩm
              </h3>
              <p className="text-base leading-7 text-[#5f5e5e]">
                {product.description || 'Trang phục cao cấp mang đến trải nghiệm tuyệt vời cho sự kiện của bạn. Thiết kế tỉ mỉ, chất liệu cao cấp và kiểu dáng ấn tượng giúp bạn tỏa sáng ở mọi góc nhìn.'}
              </p>
            </div>

            {/* Shop Card */}
            <div className="mb-8 p-5 border border-[#cfc4c5] bg-[#f9f9f9] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={shop.avatar}
                  alt={shop.name}
                  className="w-14 h-14 rounded-full object-cover border border-[#cfc4c5]/50 cursor-pointer"
                  onClick={() => onNavigate?.('shopDetail', shop)}
                />
                <div>
                  <h4
                    className="font-serif text-lg font-bold hover:text-[#99854e] cursor-pointer transition"
                    onClick={() => onNavigate?.('shopDetail', shop)}
                  >
                    {shop.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#5f5e5e]">
                    <span className="flex items-center text-[#99854e]">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {shop.rating}
                    </span>
                    <span>•</span>
                    <span>{shop.address.split(',').slice(-2).join(', ').trim()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('shopDetail', shop)}
                className="px-5 py-2.5 border border-black text-[11px] font-semibold uppercase tracking-[0.15em] text-black hover:bg-black hover:text-white transition-all duration-300"
              >
                Xem Cửa hàng
              </button>
            </div>

            <div className="mt-auto">
              <div className="mb-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    product.available
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {product.available ? 'Tình trạng: Còn hàng' : 'Tình trạng: Hết hàng'}
                </span>
              </div>

              {isAdmin ? (
                <div className="border border-[#d7d2c8] bg-[#fdfdfb] p-4 text-xs font-semibold uppercase tracking-wider text-[#7f7041] leading-relaxed">
                  Tài khoản Admin chỉ hỗ trợ quản trị và theo dõi số liệu, không có tính năng đặt thuê đồ.
                </div>
              ) : (
                <>
                  <button
                    disabled={!product.available}
                    onClick={() => onAddToCart?.(toCartItem(product))}
                    className={`w-full py-5 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 mb-4 ${
                      product.available
                        ? 'bg-black text-white hover:bg-[#99854e]'
                        : 'bg-[#eeeeee] text-[#999999] cursor-not-allowed'
                    }`}
                  >
                    {product.available ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                  </button>
                  <button
                    onClick={() => onNavigate?.('chat', product)}
                    className="w-full py-5 border border-black text-black text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-black hover:text-white"
                  >
                    Chat với cửa hàng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 bg-white border border-[#cfc4c5] p-6 md:p-12">
          <div className="mb-8 border-b border-[#cfc4c5]/30 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="font-serif text-3xl text-black">Đánh giá từ người thuê</h2>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-black text-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-[#99854e]"
            >
              Viết đánh giá
            </button>
          </div>

          {/* Form đánh giá mới */}
          {showReviewForm && (
            <div className="mb-10 bg-[#f9f9f9] p-6 border border-[#cfc4c5]/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-black mb-4">Đánh giá của bạn</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-[#5f5e5e] mr-2">Chất lượng:</span>
                  <div className="flex text-[#99854e] cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setNewReviewData({...newReviewData, rating: star})}
                        className="material-symbols-outlined text-[24px]"
                        style={star <= newReviewData.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReviewData.comment}
                  onChange={(e) => setNewReviewData({...newReviewData, comment: e.target.value})}
                  className="w-full border border-[#cfc4c5] p-4 text-sm outline-none focus:border-black mb-4 min-h-[100px]"
                  placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này nhé..."
                  required
                />
                <div className="flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowReviewForm(false)}
                    className="border border-[#cfc4c5] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f5e5e] hover:border-black hover:text-black"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="bg-black text-white px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] hover:bg-[#99854e]"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shopee Style Filter */}
          <div className="bg-[#fffbf8] border border-[#f9ede5] p-6 mb-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="text-center md:w-1/4">
              <div className="text-5xl font-serif text-[#99854e] mb-2">
                {stats.avg} <span className="text-2xl text-[#99854e]/60">/ 5</span>
              </div>
              <div className="flex justify-center text-[#99854e] mb-1">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className="material-symbols-outlined text-[20px]" 
                    style={i < Math.round(stats.avg) ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex-1 flex flex-wrap gap-3">
              <button 
                onClick={() => setFilterRating('all')}
                className={`px-5 py-2 text-sm border ${filterRating === 'all' ? 'border-[#99854e] text-[#99854e] bg-white' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
              >
                Tất cả ({stats.total})
              </button>
              {[5, 4, 3, 2, 1].map(star => (
                <button 
                  key={star}
                  onClick={() => setFilterRating(star)}
                  className={`px-5 py-2 text-sm border ${filterRating === star ? 'border-[#99854e] text-[#99854e] bg-white' : 'border-[#cfc4c5]/50 bg-white text-[#5f5e5e]'}`}
                >
                  {star} Sao ({stats.counts[star]})
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-10 text-[#5f5e5e] italic">
              Chưa có đánh giá nào cho bộ lọc này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedReviews.map((review) => (
                <div key={review.id} className="bg-[#f9f9f9] p-6 border border-[#cfc4c5]/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-serif text-xl">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">{review.author}</p>
                        <p className="text-xs text-[#999999]">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex text-[#99854e]">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className="material-symbols-outlined text-[14px]" 
                          style={i < review.rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[#5f5e5e] italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          )}

          {!showAllReviews && filteredReviews.length > 3 && (
            <div className="mt-10 text-center">
              <button 
                onClick={() => setShowAllReviews(true)}
                className="border border-black px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
              >
                Xem tất cả {filteredReviews.length} đánh giá
              </button>
            </div>
          )}
          {showAllReviews && filteredReviews.length > 3 && (
            <div className="mt-10 text-center">
              <button 
                onClick={() => setShowAllReviews(false)}
                className="border border-[#cfc4c5] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
              >
                Thu gọn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
