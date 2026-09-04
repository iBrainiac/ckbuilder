import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import FiberChip from "@/components/FiberChip";
import { FIBERS } from "@/lib/types";
import PhoneBoard from "./PhoneBoard";

const STEPS = [
  {
    title: "Create a squad",
    body: "Connect a wallet, name the squad, share the invite. The roster is a lock, not a chat.",
  },
  {
    title: "Lock the same stake",
    body: "Every member locks the same integer CKB. Your wallet sends it to the pot.",
  },
  {
    title: "Seal the day",
    body: "Hit the bar — steps, km, sessions, or show up. Seal stamps the time. Miss is blood.",
  },
  {
    title: "Confirm the board",
    body: "Last day, majority confirms. Completers get stake back plus an equal split of what missers leave.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-void text-paper">
      <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-[18%] top-0 hidden h-full w-px bg-lime/80 md:block"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex max-w-[1080px] items-center justify-between px-5 py-5">
        <Link href="/" className="block">
          <Wordmark />
        </Link>
        <Link
          href="/app"
          className="rounded-full bg-lime px-4 py-2 text-[13px] font-semibold text-void"
        >
          Open app
        </Link>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-[1080px] items-center gap-12 px-5 pb-20 pt-6 md:grid-cols-[1fr_auto] md:pt-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">Private squad pacts</p>
            <h1 className="mt-4 max-w-[14ch] text-[44px] font-semibold leading-[1.05] tracking-tight text-paper md:text-[56px]">
              Same stake.
              <br />
              Same fiber.
            </h1>
            <p className="mt-5 max-w-[36ch] text-[16px] leading-relaxed text-fog">
              Friends lock integer CKB on one exercise. Seal every day. Completers split what missed members leave behind. The board is the record.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="seal-btn inline-flex h-14 items-center rounded-full bg-lime px-8 text-[15px] font-semibold text-void"
              >
                Open app
              </Link>
              <p className="text-[12px] text-fog">CKB testnet · JoyID and CCC wallets</p>
            </div>
          </div>
          <PhoneBoard />
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto max-w-[1080px] px-5 py-16 md:pl-[calc(18%+24px)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">How a pact runs</p>
            <ol className="mt-8 space-y-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className={`mt-1.5 inline-block h-3 w-3 shrink-0 rounded-[4px] ${
                      i < 2 ? "bg-lime" : i === 2 ? "border border-lime pending-pulse" : "border border-hairline"
                    }`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-[17px] font-semibold tracking-tight text-paper">{step.title}</p>
                    <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-fog">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto max-w-[1080px] px-5 py-16 md:pl-[calc(18%+24px)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">Fibers</p>
            <p className="mt-3 max-w-[42ch] text-[15px] text-fog">
              Pick one exercise. The bar is daily. Custom is a written rule and a yes or no.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {FIBERS.map((f) => (
                <FiberChip key={f} fiber={f} selected={f === "Move"} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto max-w-[1080px] px-5 py-16 md:pl-[calc(18%+24px)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-fog">Vault</p>
            <p className="mt-4 font-serif text-[48px] leading-none text-mint tabular-nums md:text-[64px]">CKB</p>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-fog">
              Available is your live chain balance. Opening a pact sends your stake to the squad pot. Settlement pays completers who have an address. Integer CKB only — no dust.
            </p>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-end md:justify-between md:pl-[calc(18%+24px)]">
            <div>
              <p className="text-[22px] font-semibold tracking-tight text-paper">Create a squad. Send the invite.</p>
              <p className="mt-2 text-[14px] text-fog">Wallet sign-in is who you are. Challenges still live on this device until the next slice.</p>
            </div>
            <Link
              href="/app"
              className="seal-btn inline-flex h-14 items-center rounded-full bg-lime px-8 text-[15px] font-semibold text-void"
            >
              Open app
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-hairline">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12px] text-fog md:pl-[calc(18%+24px)]">
          <Link href="/">
            <Wordmark size="sm" />
          </Link>
          <p>
            Testnet ·{" "}
            <a href="https://faucet.nervos.org/" className="text-lime" target="_blank" rel="noreferrer">
              Faucet
            </a>
            {" · "}
            <Link href="/app" className="text-paper">
              App
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
