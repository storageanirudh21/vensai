export function VensaiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d="M24 24 L26.6 6 L24 12.5 L21.4 6 Z"
          fill="currentColor"
          transform={`rotate(${i * 45} 24 24)`}
        />
      ))}
    </svg>
  );
}
