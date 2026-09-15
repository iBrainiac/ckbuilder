"use client";

import { faucetUrl, getWalletUrl } from "@/lib/ckb";

export function FaucetLink({
  className = "font-medium text-lime underline-offset-2 hover:underline",
}: {
  className?: string;
}) {
  const href = faucetUrl();
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      Get testnet CKB
    </a>
  );
}

export function GetWalletButton({ children = "Sign up" }: { children?: string }) {
  return (
    <a
      href={getWalletUrl()}
      target="_blank"
      rel="noreferrer"
      className="flex h-12 w-full items-center justify-center rounded-full border border-lime text-[14px] font-semibold text-lime"
    >
      {children}
    </a>
  );
}

export function WalletHelp({
  needWallet,
  needFaucet,
}: {
  needWallet?: boolean;
  needFaucet?: boolean;
}) {
  const faucet = faucetUrl();
  if (needWallet) {
    return (
      <div className="mt-4 space-y-3">
        <GetWalletButton />
        <p className="text-center text-[12px] leading-relaxed text-fog">
          JoyID is a passkey wallet. No seed phrase.
          {faucet ? (
            <>
              {" "}
              After you connect, <FaucetLink /> if you need tokens.
            </>
          ) : null}
        </p>
      </div>
    );
  }
  if (needFaucet && faucet) {
    return (
      <p className="mt-3 text-[13px] leading-relaxed text-fog">
        Need CKB for a stake? <FaucetLink />
      </p>
    );
  }
  return null;
}
