import type { Squad } from "@/lib/types";
import type { members, squads } from "@/lib/db/schema";

type SquadRow = typeof squads.$inferSelect;
type MemberRow = typeof members.$inferSelect;

export function toClientSquad(
  squad: SquadRow,
  roster: MemberRow[],
  selfAddress: string
): Squad {
  return {
    id: squad.id,
    name: squad.name,
    inviteCode: squad.inviteCode,
    potAddress: squad.potAddress,
    members: roster.map((m) => ({
      id: m.id,
      name: m.displayName,
      createdAt: m.createdAt.getTime(),
      isSelf: m.address === selfAddress,
      ckbAddress: m.address,
    })),
  };
}
