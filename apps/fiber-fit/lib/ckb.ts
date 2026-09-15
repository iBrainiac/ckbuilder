import { ccc } from "@ckb-ccc/connector-react";

/** Minimum viable secp256k1 cell, rounded up. */
export const MIN_CELL_CKB = 62;

const TESTNET_FAUCET = "https://faucet.nervos.org/";
const JOYID_WALLET = "https://joy.id";

export function isMainnet(): boolean {
  return process.env.NEXT_PUBLIC_IS_MAINNET === "true";
}

export function faucetUrl(): string | null {
  if (isMainnet()) return null;
  return TESTNET_FAUCET;
}

export function getWalletUrl(): string {
  return JOYID_WALLET;
}

export function shannonToIntCkb(shannon: bigint): number {
  const text = ccc.fixedPointToString(shannon);
  const whole = text.split(".")[0] ?? "0";
  const n = Number(whole);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function shortAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function explorerTxUrl(txHash: string, address?: string | null): string {
  const main = Boolean(address?.startsWith("ckb1"));
  const host = main ? "https://explorer.nervos.org" : "https://testnet.explorer.nervos.org";
  return `${host}/transaction/${txHash}`;
}

export function txErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Transaction failed";
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}

export async function sendCkb(
  signer: ccc.Signer,
  toAddress: string,
  amountCkb: number
): Promise<string> {
  const amount = Math.trunc(amountCkb);
  if (amount < MIN_CELL_CKB) {
    throw new Error(`Amount must be at least ${MIN_CELL_CKB} CKB.`);
  }
  const { script: lock } = await ccc.Address.fromString(toAddress, signer.client);
  const tx = ccc.Transaction.from({
    outputs: [{ capacity: ccc.fixedPointFrom(String(amount)), lock }],
  });
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer);
  return signer.sendTransaction(tx);
}

export async function sendPayouts(
  signer: ccc.Signer,
  payments: { address: string; amountCkb: number }[]
): Promise<string> {
  const outputs: { capacity: bigint; lock: ccc.Script }[] = [];
  for (const p of payments) {
    const amount = Math.trunc(p.amountCkb);
    if (amount < MIN_CELL_CKB) continue;
    const { script: lock } = await ccc.Address.fromString(p.address, signer.client);
    outputs.push({ capacity: ccc.fixedPointFrom(String(amount)), lock });
  }
  if (outputs.length === 0) {
    throw new Error("No payable on-chain outputs.");
  }
  const tx = ccc.Transaction.from({ outputs });
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer);
  return signer.sendTransaction(tx);
}
