# Fiber Fit

Private squad pacts on Nervos CKB. Friends pick one exercise, lock the same integer CKB, and seal every day. Completers split what missers leave. The board is the record.

Same stake. Same fiber.

## What it is

A squad is a small group that already knows each other. It is a roster, not a chat. The squad lasts. A squad can open many challenges.

A challenge is one fiber (Move, Train, Lift, Run, Ride, Show up, or a custom yes/no rule), a daily bar, a number of days, and one stake in integer CKB. Everyone who joins locks that same amount.

Identity is a CKB wallet. You connect, sign one message, and the address is who you are. There is no email.

The app runs on **CKB testnet** today (JoyID and other CCC wallets). Landing is `/`. The product is `/app`. An invite looks like `/app/join/CODE`.

## How a pact works

1. **Create a squad.** Name it. Share the invite. People join with their wallet and a display name.
2. **Open a challenge.** Pick the fiber, the daily bar, the days, and the stake (at least 62 CKB, the minimum for a live cell). **Lock and open** sends your stake to the squad pot.
3. **Seal the day.** Enter today’s proof. If the bar is met, Seal stamps the time. Miss is a miss. The board is one row per member and one column per day.
4. **Confirm.** After the last day, the squad confirms the board. Majority of those who vote settles it. Completers get their stake back plus an equal split of what missers leave.

The chain cannot see a workout. The squad is the oracle. CKB only moves the money.

## Fibers

Pick one exercise. The bar is daily.

| Fiber | Typical bar |
|---|---|
| Move | steps |
| Train / Lift | sessions or workouts |
| Run / Ride | km or minutes |
| Show up | check in |
| Custom | a written rule, yes or no |

## Money

- Stake is integer CKB only. No dust.
- Vault **Available** is your live wallet balance, not a number the app made up.
- Opening a pact sends CKB to the **squad pot**. Right now that pot is the creator’s address. A contract will hold it later.
- Settlement pays members who have a CKB address. A payout to yourself is skipped (the coins are already at that wallet if you are the pot).
- If you abandon or delete a pact in the app, CKB already sent stays at the pot.

## Who gets paid

- **Completer:** every day sealed.
- **Miss:** any missed day, or any day still unsealed when the board is confirmed.
- Each completer receives `stake + floor(missedStakes / completerCount)`.
- Leftover `missedStakes % completerCount` CKB goes to the first completer (stable member order).
- If nobody completes, or nobody misses, everyone is refunded their stake.

## The screens

- **Home** — your open pact and what to do today.
- **Board** — the heat sheet. Seal, miss, then confirm.
- **Squads** — roster and invite link.
- **Vault** — live CKB balance and what the pot is.

## Run it

```bash
cd apps/fiber-fit
cp .env.example .env.local
npm install
npm run dev
```

[http://localhost:3002](http://localhost:3002) — landing  
[http://localhost:3002/app](http://localhost:3002/app) — app  

Testnet faucet: [faucet.nervos.org](https://faucet.nervos.org/)
