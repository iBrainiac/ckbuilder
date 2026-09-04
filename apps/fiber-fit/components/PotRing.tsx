export default function PotRing({
  total,
  drained = 0,
  size = 88,
}: {
  total: number;
  drained?: number;
  size?: number;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const t = Math.min(1, Math.max(0, 1 - drained / Math.max(total, 1)));
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" aria-hidden>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#1E241E" strokeWidth="6" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="#E6C36A"
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - t)}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
    </svg>
  );
}
