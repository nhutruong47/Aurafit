import { useState } from 'react';
import { useAdminAds } from '../../hooks/useAdminAds';

export default function AdminAdsSection({ currentUser }) {
  const {
    ads,
    isLoading,
    isSaving,
    createAd,
    updateAd,
    deleteAd,
    toggleAdStatus,
    moveAd,
  } = useAdminAds(currentUser);

  const sortedAds = [...ads].sort((a, b) => {
    if (a.position !== b.position) return a.position.localeCompare(b.position);
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    position: 'LEFT',
    isActive: true,
    displayOrder: 0,
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      targetUrl: '',
      position: 'LEFT',
      isActive: true,
      displayOrder: 0,
    });
    setEditingAd(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ad) => {
    setFormData({
      name: ad.name,
      description: ad.description || '',
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl || '',
      position: ad.position,
      isActive: ad.isActive,
      displayOrder: ad.displayOrder || 0,
    });
    setEditingAd(ad);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAd) {
      const success = await updateAd(editingAd.id, formData);
      if (success) closeModal();
    } else {
      const success = await createAd(formData);
      if (success) closeModal();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-[#111111]">Quản lý Banner Quảng Cáo</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#111111] px-4 py-2 text-sm text-white transition hover:bg-[#222222]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm Banner
        </button>
      </div>

      <div className="bg-white p-6 shadow-sm border border-[#ebe7df]">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-[#5f5e5e]">Đang tải...</div>
        ) : ads.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#5f5e5e]">Chưa có banner quảng cáo nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#ebe7df] text-xs uppercase text-[#5f5e5e]">
                <tr>
                  <th className="px-4 py-3 font-medium">Banner</th>
                  <th className="px-4 py-3 font-medium">Tên chiến dịch</th>
                  <th className="px-4 py-3 font-medium">Vị trí</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df]">
                {sortedAds.map((ad, index) => {
                  const isFirstInPosition = index === 0 || sortedAds[index - 1].position !== ad.position;
                  const isLastInPosition = index === sortedAds.length - 1 || sortedAds[index + 1].position !== ad.position;
                  
                  return (
                  <tr key={ad.id} className="transition hover:bg-[#f9f9f9]">
                    <td className="px-4 py-3">
                      <div className="h-16 w-12 overflow-hidden border border-[#ebe7df] bg-[#f4f4f2]">
                        <img src={ad.imageUrl} alt={ad.name} className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111111]">
                      {ad.name}
                      {ad.targetUrl && (
                        <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="block text-[11px] text-blue-600 hover:underline font-normal mt-1">
                          {ad.targetUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-[#f4f4f2] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e]">
                        {ad.position === 'LEFT' ? 'Trái' : 'Phải'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAdStatus(ad)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                          ad.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {ad.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isFirstInPosition && (
                          <button
                            onClick={() => moveAd(ad, -1)}
                            disabled={isSaving}
                            className="text-[#5f5e5e] transition hover:text-[#111111]"
                            title="Đẩy lên"
                          >
                            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                          </button>
                        )}
                        {!isLastInPosition && (
                          <button
                            onClick={() => moveAd(ad, 1)}
                            disabled={isSaving}
                            className="text-[#5f5e5e] transition hover:text-[#111111]"
                            title="Đẩy xuống"
                          >
                            <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(ad)}
                          disabled={isSaving}
                          className="text-[#5f5e5e] transition hover:text-[#111111] ml-2"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          disabled={isSaving}
                          className="text-red-500 transition hover:text-red-700"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-[#fdfdfb] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#ebe7df] pb-4">
              <h3 className="font-serif text-xl">
                {editingAd ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
              </h3>
              <button onClick={closeModal} className="text-[#5f5e5e] hover:text-black">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                  Tên chiến dịch *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none"
                  placeholder="Ví dụ: Khuyến mãi tháng 9"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                  Mô tả quảng cáo
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none resize-none"
                  placeholder="Ví dụ: Giảm giá 50% cho người mới..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                  Link Ảnh (Image URL) *
                </label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                  Link Đích (Target URL)
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none"
                  placeholder="https://example.com/khuyen-mai"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                    Vị trí hiển thị *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none"
                  >
                    <option value="LEFT">Cạnh Trái</option>
                    <option value="RIGHT">Cạnh Phải</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#5f5e5e]">
                    Trạng thái
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full border border-[#d7d2c8] bg-white px-3 py-2 text-sm focus:border-[#7f7041] focus:outline-none"
                  >
                    <option value="true">Đang hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
              </div>

              {formData.imageUrl && (
                <div className="mt-2 text-center">
                  <p className="mb-1 text-xs text-[#5f5e5e]">Xem trước ảnh:</p>
                  <img src={formData.imageUrl} alt="Preview" className="mx-auto h-32 object-contain border border-[#ebe7df]" />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-[#d7d2c8] px-4 py-2 text-sm text-[#5f5e5e] transition hover:bg-[#f4f4f2]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#111111] px-6 py-2 text-sm text-white transition hover:bg-[#222222] disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
