import Link from "next/link"

const SECTIONS = [
  { id: "discount",  label: "How the group discount works" },
  { id: "payments",  label: "How payment works" },
  { id: "refunds",   label: "Refunds & cancellations" },
  { id: "closing",   label: "When and how a deal closes" },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 text-center" style={{ backgroundColor: "#002356" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-white/70 text-base md:text-lg">
            The full detail behind how group buys, discounts, and payments work on Groupal.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-14">

        {/* ── Table of contents ─────────────────────────────────────── */}
        <nav className="mb-12 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">On this page</p>
          <ul className="space-y-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm font-semibold text-[#1b4487] hover:text-[#002356] hover:underline underline-offset-2">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14 text-gray-700 leading-relaxed">

          {/* ── Discount mechanic ────────────────────────────────────── */}
          <section id="discount" className="scroll-mt-24 space-y-3">
            <h2 className="font-heading font-extrabold text-[#002356] text-2xl">How the group discount works</h2>
            <p>
              Every buyer who joins a deal adds an equal share of discount to the whole group — the discount
              grows linearly and continuously, not in fixed steps. The more people join, the lower the final
              price gets for everyone already in the group, including you.
            </p>
            <p>
              A deal always closes — either when it reaches its deadline or when the group reaches its maximum
              number of buyers, whichever happens first. There is no "failed" group buy: the only variable is
              how much discount the group ends up earning.
            </p>
          </section>

          {/* ── Payments — the detailed version of the checkout warning ─ */}
          <section id="payments" className="scroll-mt-24 space-y-4">
            <h2 className="font-heading font-extrabold text-[#002356] text-2xl">How payment works</h2>

            <div>
              <h3 className="font-bold text-[#e86300] mb-1">Today — securing your spot</h3>
              <p>
                You pay only 10% of the store price right now. That&apos;s your full commitment today —
                nothing else is charged at this step, and this amount is fixed once you check out. It never
                changes, no matter how many more buyers join afterward.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#e86300] mb-1">While the deal is open</h3>
              <p>
                As more people join, the group price drops for everyone — including you. You don&apos;t need to
                do anything; just watch your savings grow, and feel free to share the deal to help it along.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#e86300] mb-1">When the deal closes</h3>
              <p>
                We automatically charge the remaining balance — store price minus the discount your group
                earned, plus delivery — to the same payment method you used at checkout. There are no extra
                steps and no new checkout. You&apos;ll always pay less than the full store price, and never more.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#e86300] mb-1">If that charge doesn&apos;t go through</h3>
              <p>
                It happens — cards expire or get temporarily blocked. If we can&apos;t complete the charge, we
                won&apos;t cancel your spot right away. We&apos;ll automatically try again over the next few days
                and notify you each time, with a simple link to update your payment method or trigger an
                immediate retry yourself. You get a short grace period to sort it out — no pressure, no
                penalty during this window.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#e86300] mb-1">If it&apos;s still unresolved after the grace period</h3>
              <p>
                Your 10% reservation is forfeited and your spot is released back to the group. This is the
                only case in which you lose your reservation — it never happens just because &ldquo;not enough
                people joined.&rdquo; Deals always close, and the only thing that varies is how much you save.
              </p>
            </div>

            <p className="pt-2 border-t border-gray-100 text-sm text-gray-500">
              Our tip: keep your card details current and you&apos;ll never have to think about any of
              this — it just works in the background.
            </p>
          </section>

          {/* ── Refunds ──────────────────────────────────────────────── */}
          <section id="refunds" className="scroll-mt-24 space-y-3">
            <h2 className="font-heading font-extrabold text-[#002356] text-2xl">Refunds &amp; cancellations</h2>
            <p>
              Refunds are only issued if a seller cancels a deal — never because a group didn&apos;t reach its
              maximum number of buyers. A smaller group simply means a smaller discount, not a cancelled deal.
            </p>
          </section>

          {/* ── Closing ──────────────────────────────────────────────── */}
          <section id="closing" className="scroll-mt-24 space-y-3">
            <h2 className="font-heading font-extrabold text-[#002356] text-2xl">When and how a deal closes</h2>
            <p>
              A deal closes at its deadline, or as soon as it reaches its maximum number of buyers — whichever
              happens first. At that point the final discount is locked in for every buyer in the group, and
              the final payment process described above begins automatically.
            </p>
          </section>

        </div>

        <div className="mt-14 pt-8 border-t border-gray-100 text-center">
          <Link href="/how-it-works" className="text-sm font-semibold text-[#1b4487] hover:text-[#002356] hover:underline underline-offset-2">
            Want the friendlier walkthrough instead? Visit How It Works →
          </Link>
        </div>
      </div>
    </main>
  )
}
