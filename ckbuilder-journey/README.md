# CKBuilder Journey

A running record of what I have been building on the Nervos CKB ecosystem — apps deployed, concepts explored, and lessons learned.

## Goals

- Build practical applications on CKB using the Cell Model.
- Learn how CCC, JoyID, and the CKB indexer work together in a real frontend.
- Progress toward more advanced CKB primitives: custom lock scripts, type scripts, xUDT, and Rust contracts.
- Keep a public record of shipped work, design decisions, and open questions.

## Folder Structure

```text
ckbuilder-journey/
  README.md
  reports/
    week-01.md                      ← Setup, Cell Model, first testnet tx
    week-02.md                      ← CKB NoteBoard built and deployed
    week-03.md                      ← xUDT theory, token encoding, mint flow
    week-04.md                      ← xUDT Issuer completed, transfer, debugging
    project-01-ckb-noteboard.md     ← Deep dive: NoteBoard architecture
    project-02-xudt-issuer.md       ← Deep dive: xUDT Issuer architecture
    project-03-fiber-fit.md         ← Deep dive: Fiber Fit (squad stakes)
    august-sept/                    ← Aug–Sep 2026 builder track
      week-01.md                    ← Fiber study, Fiber Fit v1 (landing, local pact, CCC lock)
      week-02.md                    ← Sign-in, invite squads, PGlite, product README
      week-03.md                    ← In progress: shared challenges, hosting, then contract
```

## What Goes Where

- `reports/week-XX.md` — May 2026 weekly reports (weeks 1–4)
- `reports/august-sept/week-XX.md` — Aug–Sep 2026 weekly reports (courses, key learnings, practical work)
- `reports/project-XX.md` — deep-dive project reports per shipped app

## Primary References

- [Nervos CKB Documentation](https://docs.nervos.org/)
- [CCC Documentation](https://docs.ckbccc.com/)
- [CKB Explorer (Testnet)](https://pudge.explorer.nervos.org/)
