// Luoi skeleton dung chung khi dang tai danh sach san pham.
export default function LoadingGrid({ count = 8, itemClassName = 'h-[420px]' }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${itemClassName} animate-pulse border border-[#cfc4c5] bg-white`} />
      ))}
    </div>
  );
}
