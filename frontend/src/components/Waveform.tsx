const HEIGHTS = [40, 70, 100, 55, 85, 30, 95, 60, 45, 75, 35, 90];

export default function Waveform({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-1 h-10 ${className}`}>
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="bar w-1.5 rounded-full bg-[var(--color-signal)]"
          style={{
            height: `${h}%`,
            animationDelay: `${i * 90}ms`,
            opacity: 0.35 + h / 160,
          }}
        />
      ))}
    </div>
  );
}
