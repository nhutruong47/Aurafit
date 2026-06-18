// Timeline trang thai cua mot don hang theo tung moc xu ly.
export default function OrderTimeline({ timeline }) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-[20px] top-4 h-[calc(100%-2rem)] w-px bg-[#cfc4c5]" />

      <div className="space-y-8">
        {timeline.map((event, index) => {
          const isPast = event.completed && !event.current;
          const isCanceled = event.isCanceled;
          const isCurrent = event.current;

          let circleClass = 'bg-[#eeeeee] border border-[#cfc4c5]';
          let iconClass = 'text-[#cfc4c5]';
          let textClass = 'text-[#999999]';

          if (event.isWarning) {
            circleClass = 'bg-[#ba1a1a] border-[#ba1a1a] shadow-[0_0_0_4px_rgba(186,26,26,0.2)]';
            iconClass = 'text-white';
            textClass = 'text-[#ba1a1a] font-bold';
          } else if (isCanceled) {
            circleClass = 'bg-gray-400 border-gray-400';
            iconClass = 'text-white';
            textClass = 'text-gray-400 font-medium line-through';
          } else if (isPast) {
            circleClass = 'bg-black border-black';
            iconClass = 'text-white';
            textClass = 'text-black';
          } else if (isCurrent) {
            circleClass = 'bg-[#99854e] border-[#99854e] shadow-[0_0_0_4px_rgba(153,133,78,0.2)]';
            iconClass = 'text-white';
            textClass = 'text-[#99854e] font-medium';
          }

          return (
            <div key={`${event.status}-${index}`} className="relative flex items-start gap-6">
              <div
                className={`absolute -left-[36px] z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500 ${circleClass}`}
              >
                <span className={`material-symbols-outlined text-[14px] ${iconClass}`}>{event.icon}</span>
              </div>
              <div className="pl-4 pt-1">
                <p className={`text-sm uppercase tracking-widest ${textClass}`}>{event.status}</p>
                <p className="mt-1 text-xs text-[#5f5e5e]">{event.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
