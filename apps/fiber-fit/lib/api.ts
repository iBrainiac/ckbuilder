import type { Squad } from "@/lib/types";
import type { Signer } from "@ckb-ccc/core";

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchMe(): Promise<{ address: string } | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) return null;
  return parseJson(res);
}

export async function logoutRemote(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function signInWithSigner(signer: Signer): Promise<string> {
  const address = await signer.getRecommendedAddress();
  const nonceRes = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const { message } = await parseJson<{ message: string }>(nonceRes);
  const signature = await signer.signMessage(message);
  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      address,
      message,
      signature: {
        signature: signature.signature,
        identity: signature.identity,
        signType: signature.signType,
      },
    }),
  });
  const data = await parseJson<{ address: string }>(verifyRes);
  return data.address;
}

export async function fetchSquads(): Promise<Squad[]> {
  const res = await fetch("/api/squads", { credentials: "include" });
  const data = await parseJson<{ squads: Squad[] }>(res);
  return data.squads;
}

export async function createSquadRemote(name: string, displayName: string): Promise<Squad> {
  const res = await fetch("/api/squads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, displayName }),
  });
  const data = await parseJson<{ squad: Squad }>(res);
  return data.squad;
}

export async function joinSquadRemote(code: string, displayName: string): Promise<Squad> {
  const res = await fetch("/api/squads/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code, displayName }),
  });
  const data = await parseJson<{ squad: Squad }>(res);
  return data.squad;
}

export async function fetchInvite(code: string): Promise<{ name: string; memberCount: number; code: string }> {
  const res = await fetch(`/api/invite/${encodeURIComponent(code)}`);
  return parseJson(res);
}
