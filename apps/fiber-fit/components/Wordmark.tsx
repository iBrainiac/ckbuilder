export default function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-[17px]" : "text-[22px]";
  return (
    <p
      className={`font-sans font-semibold tracking-[-0.06em] text-paper ${cls}`}
      aria-label="Fiber Fit"
    >
      F
      <span className="relative inline-block">
        I
        <span className="pointer-events-none absolute left-1/2 top-[-2px] h-[1.15em] w-px -translate-x-1/2 bg-lime" />
      </span>
      BER&nbsp;FIT
    </p>
  );
}
