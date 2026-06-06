export function truncateAddress(address: string, front = 10, end = 6): string {
  if (address.length <= front + end) return address;
  return `${address.slice(0, front)}...${address.slice(-end)}`;
}

export function truncateHash(hash: string, front = 10, end = 6): string {
  if (hash.length <= front + end) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-end)}`;
}

export function formatTokenAmount(amount: bigint): string {
  return amount.toLocaleString();
}
