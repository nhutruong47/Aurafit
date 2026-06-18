// Thanh tab dieu huong tren mobile cho trang checkout.
import { mobileTabs } from './checkoutData';

export default function CheckoutMobileTabs() {
  return (
    <nav className="fixed bottom-0 left-0 z-[60] flex h-16 w-full items-center justify-around border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 md:hidden">
      {mobileTabs.map((tab) => (
        <button
          key={tab.label}
          className={`flex flex-col items-center justify-center p-2 text-[#5f5e5e] ${
            tab.active ? 'rounded-lg bg-[#eeeeee] px-4 text-black' : ''
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={tab.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {tab.icon}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
