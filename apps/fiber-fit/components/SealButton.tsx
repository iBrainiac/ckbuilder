"use client";

export default function SealButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="seal-btn h-14 w-full rounded-full bg-lime text-[15px] font-semibold text-void disabled:opacity-40"
    >
      {children}
    </button>
  );
}
