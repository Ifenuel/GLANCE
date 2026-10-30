export function BookCover({
  className,
  title = "Leading at 27",
  subtitle = "How Young Leaders Can Change the World",
}: {
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-[3px] rounded-l-[7px] bg-[linear-gradient(150deg,#0b3a70_0%,#04295a_46%,#011b3f_100%)] shadow-[0_28px_50px_-22px_rgba(2,20,44,0.95)] ${className ?? ""}`}
    >
      {/* spine */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[7px] bg-[linear-gradient(90deg,rgba(0,0,0,0.6),rgba(255,255,255,0.18))]"
      />
      <span aria-hidden="true" className="absolute inset-y-0 left-[7px] w-px bg-white/10" />

      {/* civic watermark */}
      <svg
        viewBox="0 0 100 140"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-[0.16]"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-6 118C26 132 74 122 106 66"
          fill="none"
          stroke="#EAAE14"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="18" cy="42" r="9" fill="#EAAE14" />
        <circle cx="50" cy="30" r="10" fill="#EAAE14" />
        <circle cx="80" cy="40" r="9" fill="#EAAE14" />
      </svg>

      <div className="relative flex h-full flex-col items-center px-4 pt-7 pb-5 text-center">
        <p className="text-[8px] font-semibold tracking-[0.22em] text-white/85">
          SEYI ADISA
        </p>

        <p className="mt-auto text-[15px] leading-[1.15] font-extrabold tracking-[0.02em] text-white">
          {title.toUpperCase()}
        </p>
        <p className="mt-2 text-[8.5px] leading-[1.6] font-semibold tracking-[0.08em] text-gold-400 uppercase">
          {subtitle}
        </p>

        <span
          aria-hidden="true"
          className="mt-4 block h-[3px] w-[54px] rounded-full bg-gold-500/80"
        />

        <p className="mt-auto pt-6 text-[6.5px] leading-[1.7] font-semibold tracking-[0.16em] text-white/75">
          LESSONS IN CHARACTER,
          <br />
          INFLUENCE AND PURPOSE
        </p>
      </div>
    </figure>
  );
}
