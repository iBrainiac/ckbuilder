import { ccc } from "@ckb-ccc/connector-react";

// xUDT stores token amounts as 16-byte little-endian uint128 in outputsData
export function encodeAmount(amount: bigint): string {
  const bytes = new Uint8Array(16);
  let val = amount;
  for (let i = 0; i < 16; i++) {
    bytes[i] = Number(val & 0xffn);
    val >>= 8n;
  }
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function decodeAmount(hex: string): bigint {
  if (!hex || hex === "0x" || hex.length < 34) return 0n;
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = clean.match(/.{2}/g) ?? [];
  if (bytes.length < 16) return 0n;
  let val = 0n;
  for (let i = 15; i >= 0; i--) {
    val = (val << 8n) | BigInt(parseInt(bytes[i], 16));
  }
  return val;
}

// xUDT args = 32-byte owner lock hash + 4 zero bytes (extension flags, unused)
export async function getXudtArgs(signer: ccc.Signer): Promise<string> {
  const address = await signer.getRecommendedAddress();
  const { script } = await ccc.Address.fromString(address, signer.client);
  return script.hash() + "00000000";
}

export async function getXudtType(
  client: ccc.Client,
  args: string
): Promise<ccc.Script> {
  return ccc.Script.fromKnownScript(client, ccc.KnownScript.XUdt, args);
}

// Minimum capacity for one xUDT cell:
// capacity(8) + lock secp256k1blake160(53) + type xUDT(69) + data(16) = 146 bytes = 146 CKB
export const XUDT_CELL_MIN_CKB = 146;

export async function issueTokens(
  signer: ccc.Signer,
  amount: bigint
): Promise<string> {
  const address = await signer.getRecommendedAddress();
  const { script: lock } = await ccc.Address.fromString(address, signer.client);
  const args = lock.hash() + "00000000";
  const xudtType = await getXudtType(signer.client, args);

  const tx = ccc.Transaction.from({
    outputs: [{ lock, type: xudtType }],
    outputsData: [encodeAmount(amount)],
  });

  await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  return signer.sendTransaction(tx);
}

export async function fetchMyBalance(
  client: ccc.Client,
  lock: ccc.Script,
  xudtArgs: string
): Promise<bigint> {
  const xudtType = await getXudtType(client, xudtArgs);
  const typeHash = xudtType.hash();
  let total = 0n;

  for await (const cell of client.findCells({
    script: lock,
    scriptType: "lock",
    scriptSearchMode: "exact",
    withData: true,
  })) {
    if (!cell.cellOutput.type) continue;
    if (cell.cellOutput.type.hash() !== typeHash) continue;
    total += decodeAmount(cell.outputData ?? "0x");
  }

  return total;
}

export async function transferTokens(
  signer: ccc.Signer,
  xudtArgs: string,
  toAddress: string,
  amount: bigint
): Promise<string> {
  const fromAddress = await signer.getRecommendedAddress();
  const { script: fromLock } = await ccc.Address.fromString(fromAddress, signer.client);
  const { script: toLock } = await ccc.Address.fromString(toAddress, signer.client);
  const xudtType = await getXudtType(signer.client, xudtArgs);
  const typeHash = xudtType.hash();

  // Collect token input cells owned by the signer
  let inputAmount = 0n;
  const tokenCells: ccc.Cell[] = [];

  for await (const cell of signer.client.findCells({
    script: fromLock,
    scriptType: "lock",
    scriptSearchMode: "exact",
    withData: true,
  })) {
    if (!cell.cellOutput.type) continue;
    if (cell.cellOutput.type.hash() !== typeHash) continue;
    inputAmount += decodeAmount(cell.outputData ?? "0x");
    tokenCells.push(cell);
    if (inputAmount >= amount) break;
  }

  if (inputAmount < amount) {
    throw new Error(
      `Insufficient token balance: have ${inputAmount.toString()}, need ${amount.toString()}`
    );
  }

  const change = inputAmount - amount;

  const outputs: { lock: ccc.Script; type: ccc.Script }[] = [
    { lock: toLock, type: xudtType },
  ];
  const outputsData: string[] = [encodeAmount(amount)];

  if (change > 0n) {
    outputs.push({ lock: fromLock, type: xudtType });
    outputsData.push(encodeAmount(change));
  }

  const tx = ccc.Transaction.from({ outputs, outputsData });

  for (const cell of tokenCells) {
    tx.inputs.push(
      ccc.CellInput.from({ previousOutput: cell.outPoint, since: "0x0" })
    );
    tx.witnesses.push("0x");
  }

  await tx.addCellDepsOfKnownScripts(signer.client, ccc.KnownScript.XUdt);
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  return signer.sendTransaction(tx);
}
