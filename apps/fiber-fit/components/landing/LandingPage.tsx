import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import PhoneBoard from "./PhoneBoard";

const FAUCET = "https://faucet.nervos.org/";
const JOYID = "https://joy.id";

const STEPS = [
  {
    title: "Sign in with a CKB wallet",
    body: "Your address is your account. No email. If you do not have a wallet yet, sign up with JoyID, then come back.",
  },
  {
    title: "Create a squad or open an invite",
    body: "A squad is the small group you already know. Share a code. People who join later sit on the next challenge, not a live one.",
  },
  {
    title: "Open a challenge and lock the same stake",
    body: "Pick one fiber, a daily bar, a length, and an integer CKB stake (at least 62). Each member sends their own stake to the pot. You cannot seal until you have locked.",
  },
  {
    title: "Seal your own day",
    body: "Enter today's proof. If the bar is met, Seal stamps the time. Miss is a miss. You only mark your row. Everyone in the pact sees the same board.",
  },
  {
    title: "Confirm. Completers get paid.",
    body: "After the last day, majority confirm. Completers get their stake back plus an equal split of what missers leave. Unsealed days count as misses. The chain cannot see a workout. The squad is the oracle.",
  },
];

function SignInLink({
  className,
  children = "Sign in",
}: {
  className: string;
  children?: string;
}) {
  return (
    <Link href="/app" className={className}>
      {children}
    </Link>
  );
}

function SignUpLink({
  className,
  children = "Sign up",
}: {
  className: string;
  children?: string;
}) {
  return (
    <a href={JOYID} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

export default function LandingPage() {
  const faucet = process.env.NEXT_PUBLIC_IS_MAINNET === "true" ? null : FAUCET;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-void text-paper">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="app-orb app-orb-a" />
        <div className="app-orb app-orb-b" />
        <div className="landing-grain absolute inset-0" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-5 py-5">
        <Link href="/" className="block">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <SignInLink className="rounded-full bg-lime px-4 py-2 text-[13px] font-semibold text-void" />
          <SignUpLink className="rounded-full border border-lime px-4 py-2 text-[13px] font-semibold text-lime" />
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-[1080px] items-center gap-12 px-5 pb-16 pt-4 md:grid-cols-[1fr_auto] md:pb-24 md:pt-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">Private squad pacts on Nervos CKB</p>
            <h1 className="mt-4 max-w-[16ch] text-[40px] font-semibold leading-[1.05] tracking-tight text-paper md:text-[56px]">
              Same stake. Same fiber.
            </h1>
            <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-fog">
              Fiber Fit is a fitness pact for a small group of friends. You pick one exercise, lock the same integer CKB, and seal every day. Completers split what missers leave. The board is the record.
            </p>
            <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-fog">
              Testnet today. Identity is a wallet, not an email. Each person locks and seals only themselves.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SignInLink className="seal-btn inline-flex h-14 items-center rounded-full bg-lime px-8 text-[15px] font-semibold text-void" />
              <SignUpLink className="inline-flex h-14 items-center rounded-full border border-lime px-8 text-[15px] font-semibold text-lime" />
            </div>
            <p className="mt-3 text-[12px] text-fog">
              Sign in opens the app and your CKB wallet. Sign up creates a JoyID passkey wallet.
              {faucet ? (
                <>
                  {" "}
                  Then{" "}
                  <a href={faucet} className="text-lime" target="_blank" rel="noreferrer">
                    get testnet CKB
                  </a>
                  .
                </>
              ) : null}
            </p>
          </div>
          <PhoneBoard />
        </section>

        <section className="border-t border-hairline/80">
          <div className="mx-auto max-w-[1080px] px-5 py-16 md:py-20">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">How it works</p>
            <h2 className="mt-3 max-w-[22ch] text-[26px] font-semibold tracking-tight text-paper md:text-[32px]">
              Five steps from invite to payout
            </h2>
            <ol className="mt-10 grid gap-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="glass-card flex gap-4 rounded-[20px] p-4 md:p-5">
                  <span className="font-serif text-[28px] leading-none text-lime tabular-nums">{i + 1}</span>
                  <div>
                    <p className="text-[16px] font-semibold tracking-tight text-paper">{step.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-fog">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-[56ch] text-[13px] leading-relaxed text-fog">
              Money is integer CKB only. The pot sits on the squad creator address until a contract holds it. Completer means every day sealed. If nobody completes, or nobody misses, everyone is refunded their stake.
            </p>
          </div>
        </section>

        <section className="border-t border-hairline/80">
          <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[22px] font-semibold tracking-tight text-paper">Try it on testnet</p>
              <p className="mt-2 max-w-[40ch] text-[14px] leading-relaxed text-fog">
                Sign in if you already have a CKB wallet. Sign up if you need one. Stake starts at 62 CKB.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SignInLink className="seal-btn inline-flex h-14 items-center rounded-full bg-lime px-8 text-[15px] font-semibold text-void" />
              <SignUpLink className="inline-flex h-14 items-center rounded-full border border-lime px-8 text-[15px] font-semibold text-lime" />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-hairline/80">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12px] text-fog">
          <Link href="/">
            <Wordmark size="sm" />
          </Link>
          <p>
            {faucet ? (
              <>
                <a href={faucet} className="text-lime" target="_blank" rel="noreferrer">
                  Faucet
                </a>
                {" · "}
              </>
            ) : null}
            <SignInLink className="text-paper" />
            {" · "}
            <SignUpLink className="text-paper" />
          </p>
        </div>
      </footer>
    </div>
  );
}
