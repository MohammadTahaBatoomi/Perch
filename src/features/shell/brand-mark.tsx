export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        fill="currentColor"
        d="M7.5 16.2 12.8 11.2 21.2 13.4 19.4 19.6H11.6ZM22.2 6.85a3.35 3.35 0 1 1 0 6.7 3.35 3.35 0 0 1 0-6.7ZM25.1 9.5 28.6 10.5 25.1 11.8ZM7.5 16.2 3.2 12.8 4.6 16.2 3.2 19.6Z"
      />
      <path
        d="M12.6 19.6 11.9 23.4M16.6 19.6 17.4 23.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="23.1" cy="9.5" r="0.7" fill="#050508" />
      <rect
        x="5"
        y="24"
        width="22"
        height="1.7"
        rx="0.85"
        fill="currentColor"
        fillOpacity="0.75"
      />
    </svg>
  );
}
