import { ccc } from "@ckb-ccc/connector-react";

// Secp256k1 lock with all-zero args — no one holds this key, acts as a collector/burn address
const NOTE_BOARD_ARGS = "0x0000000000000000000000000000000000000000";
const MAX_NOTES = 50;
// Cell base overhead: capacity(8) + code_hash(32) + hash_type(1) + args(20) = 61 bytes
const CELL_OVERHEAD_BYTES = 61;

export interface NoteData {
  a: string; // author address
  c: string; // content
  t: number; // unix timestamp ms
}

export interface Note extends NoteData {
  txHash: string;
  ckbLocked: string;
}

async function getNoteBoardLock(client: ccc.Client): Promise<ccc.Script> {
  return ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.Secp256k1Blake160,
    NOTE_BOARD_ARGS
  );
}

function encodeNote(data: NoteData): string {
  return "0x" + Buffer.from(JSON.stringify(data), "utf8").toString("hex");
}

function decodeNote(hex: string): NoteData | null {
  try {
    if (!hex || hex === "0x") return null;
    const json = Buffer.from(hex.slice(2), "hex").toString("utf8");
    const parsed = JSON.parse(json);
    if (
      typeof parsed.a === "string" &&
      typeof parsed.c === "string" &&
      typeof parsed.t === "number"
    ) {
      return parsed as NoteData;
    }
    return null;
  } catch {
    return null;
  }
}

export function estimateCkb(content: string, authorAddress: string): number {
  const data: NoteData = { a: authorAddress, c: content, t: Date.now() };
  const dataBytes = Buffer.from(JSON.stringify(data), "utf8").length;
  return CELL_OVERHEAD_BYTES + dataBytes;
}

export async function submitNote(
  signer: ccc.Signer,
  content: string,
  authorAddress: string
): Promise<string> {
  const noteBoardLock = await getNoteBoardLock(signer.client);
  const noteData: NoteData = { a: authorAddress, c: content, t: Date.now() };
  const outputData = encodeNote(noteData);
  const dataBytes = Buffer.from(JSON.stringify(noteData), "utf8").length;

  const tx = ccc.Transaction.from({
    outputs: [{ lock: noteBoardLock }],
    outputsData: [outputData],
  });

  // Minimum capacity: 1 CKB per byte of cell size
  tx.outputs[0].capacity = ccc.fixedPointFrom(
    (CELL_OVERHEAD_BYTES + dataBytes).toString()
  );

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  return signer.sendTransaction(tx);
}

export async function fetchNotes(client: ccc.Client): Promise<Note[]> {
  const noteBoardLock = await getNoteBoardLock(client);
  const notes: Note[] = [];

  for await (const cell of client.findCells({
    script: noteBoardLock,
    scriptType: "lock",
    scriptSearchMode: "exact",
    withData: true,
  })) {
    if (notes.length >= MAX_NOTES) break;
    const data = decodeNote(cell.outputData ?? "0x");
    if (!data) continue;
    notes.push({
      ...data,
      txHash: cell.outPoint.txHash,
      ckbLocked: ccc.fixedPointToString(cell.cellOutput.capacity),
    });
  }

  return notes.sort((a, b) => b.t - a.t);
}
