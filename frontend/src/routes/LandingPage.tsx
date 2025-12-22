import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Menu, X, Star, Shield, Zap, Brain } from "lucide-react";


export default function LandingPage() {
  const [open, setOpen] = React.useState(false);
  const features = [
    {
      icon: <Zap className="w-6 h-6" aria-hidden />,
      title: "Fast micro‑exercises",
      desc: "Bite‑sized drills you can finish in under 60 seconds to keep your streak alive.",
    },
    {
      icon: <Shield className="w-6 h-6" aria-hidden />,
      title: "Secure by design",
      desc: "OAuth2, JWT and HttpOnly cookies keep your account safe across devices.",
    },
    {
      icon: <Star className="w-6 h-6" aria-hidden />,
      title: "Adaptive difficulty",
      desc: "Challenges scale with your level: fewer hints at higher tiers, more support at lower tiers.",
    },
  ];

  const tiers = [
    {
      name: "Starter",
      price: "Free",
      badge: "Get going",
      features: [
        "Daily exercises",
        "Image‑link & vocab drills",
        "1 device sync",
        "Community support",
      ],
      cta: "Start free",
    },
    {
      name: "Pro",
      price: "$6/mo",
      badge: "Most popular",
      features: [
        "All Starter features",
        "Unlimited exercises",
        "Progress analytics",
        "Priority support",
        "Multi‑device sync",
      ],
      cta: "Go Pro",
      highlighted: true,
    },
    {
      name: "Team",
      price: "$12/mo",
      badge: "Teachers & groups",
      features: [
        "Classroom dashboards",
        "Shared word banks",
        "Bulk invites",
        "SAML/SSO (coming soon)",
      ],
      cta: "Contact sales",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 antialiased dark:from-slate-950 dark:to-slate-900 dark:text-slate-50">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight">Memorio</span>
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="hover:opacity-80">Features</a>
              <a href="#product" className="hover:opacity-80">Product</a>
              <a href="#pricing" className="hover:opacity-80">Pricing</a>
              <a href="#faq" className="hover:opacity-80">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button className="px-3 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm"><a href="/login">Sign in</a></button>
              <button className="px-4 py-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-medium flex items-center gap-2 shadow">
                <a href="/signup">Get started</a> <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              className="md:hidden p-2 rounded-lg border border-slate-300/70 dark:border-slate-700"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {/* Mobile menu */}
          {open && (
            <div className="md:hidden py-3 border-t border-slate-200/70 dark:border-slate-800 text-sm">
              <div className="flex flex-col gap-2">
                <a className="py-2" href="#features" onClick={() => setOpen(false)}>Features</a>
                <a className="py-2" href="#product" onClick={() => setOpen(false)}>Product</a>
                <a className="py-2" href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
                <a className="py-2" href="#faq" onClick={() => setOpen(false)}>FAQ</a>
                <div className="flex items-center gap-2 pt-2">
                  <button className="flex-1 px-3 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700">Sign in</button>
                  <button className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">Get started</button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main id="home" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight"
              >
                Learn languages your way — fast, fun, and focused.
              </motion.h1>
              <p className="mt-4 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                Memorio turns minutes into mastery with adaptive exercises that meet you where you are — on your phone, tablet, or laptop.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-indigo-600 text-white font-medium shadow">
                  Try Pro free <ArrowRight className="w-4 h-4" />
                </a>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 border border-slate-300/70 dark:border-slate-700 font-medium">
                  Continue with Google
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">No credit card needed • Cancel anytime</p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              {/* Device mockups */}
              <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                <div className="aspect-[9/19] rounded-3xl border bg-white/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                  <DeviceScreen label="Phone" />
                </div>
                <div className="hidden sm:block aspect-[4/3] rounded-3xl border bg-white/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                  <DeviceScreen label="Tablet" />
                </div>
                <div className="col-span-2 lg:col-span-1 aspect-video rounded-3xl border bg-white/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                  <DeviceScreen label="Laptop" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* LOGOS / TRUST */}
        <section aria-label="Trusted by" className="py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 sm:h-8 w-28 bg-slate-200/70 dark:bg-slate-800 rounded" aria-hidden />
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Everything you need to stay consistent</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Short sessions, smart reviews, and instant feedback — optimized for any screen.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white/70 dark:bg-slate-900/60 shadow-sm"
              >
                <div className="h-11 w-11 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRODUCT PREVIEW */}
        <section id="product" className="py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
                <ProductPreview />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Built for busy people</h2>
              <ul className="mt-5 space-y-3 text-slate-600 dark:text-slate-300">
                {[
                  "Quick-start: jump into an exercise in two taps.",
                  "Cross‑device sync: start on phone, finish on laptop.",
                  "Progress visibility: points, streaks, and badges.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3">
                <a href="#pricing" className="px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium inline-flex items-center gap-2">
                  See pricing <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#faq" className="px-5 py-3 rounded-2xl border border-slate-300/70 dark:border-slate-700 font-medium">Learn more</a>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Loved by learners</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Real feedback from early users.</p>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { name: "Alex", text: "Perfect for quick breaks — I’ve doubled my weekly practice." },
              { name: "Maya", text: "Exercises adapt to me. It’s like a personal tutor in my pocket." },
              { name: "Tomas", text: "The image‑link drills are surprisingly fun and effective." },
            ].map((t) => (
              <figure key={t.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white/70 dark:bg-slate-900/60 shadow-sm">
                <blockquote className="text-sm text-slate-700 dark:text-slate-200">“{t.text}”</blockquote>
                <figcaption className="mt-4 text-xs text-slate-500">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Simple, fair pricing</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Start free. Upgrade when you’re ready.</p>
          </div>
          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div key={t.name} className={`rounded-2xl border p-6 shadow-sm ${t.highlighted ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900/40" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{t.badge}</span>
                </div>
                <div className="mt-3 text-3xl font-extrabold">{t.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`mt-6 w-full px-4 py-2 rounded-xl font-medium ${t.highlighted ? "bg-indigo-600 text-white" : "border border-slate-300/70 dark:border-slate-700"}`}>{t.cta}</button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Questions & answers</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Everything you need to know.</p>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {[
              {
                q: "How does adaptive difficulty work?",
                a: "Memorio tracks your accuracy and speed. As you improve, hints decrease and item counts increase automatically.",
              },
              { q: "Will it work offline?", a: "A lightweight offline mode caches your latest drills; progress syncs when back online." },
              { q: "What languages are supported?", a: "Start with English↔Polish; more pairs roll out monthly based on demand." },
              { q: "Can I import custom word lists?", a: "Yes — upload CSVs or paste text; Memorio creates exercises from them." },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white/70 dark:bg-slate-900/60">
                <summary className="cursor-pointer font-medium">{item.q}</summary>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="py-10">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-10 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Ready to build your streak?</h3>
                <p className="text-white/80">Join thousands learning smarter with Memorio.</p>
              </div>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 font-medium">
                Get started <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-slate-200/70 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">Memorio</span>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Minutes to mastery.</p>
          </div>
          <div>
            <p className="font-semibold">Product</p>
            <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
              <li><a className="hover:opacity-80" href="#features">Features</a></li>
              <li><a className="hover:opacity-80" href="#pricing">Pricing</a></li>
              <li><a className="hover:opacity-80" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Company</p>
            <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
              <li><a className="hover:opacity-80" href="#">About</a></li>
              <li><a className="hover:opacity-80" href="#">Blog</a></li>
              <li><a className="hover:opacity-80" href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Legal</p>
            <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
              <li><a className="hover:opacity-80" href="#">Terms</a></li>
              <li><a className="hover:opacity-80" href="#">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 pb-8">© {new Date().getFullYear()} Memorio. All rights reserved.</div>
      </footer>
    </div>
  );
}

function DeviceScreen({ label }: { label: string }) {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>12:34</span>
        </div>
        <div className="mt-2 h-40 sm:h-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 space-y-2">
          <div className="h-3 rounded bg-slate-200 dark:bg-slate-800 w-5/6" />
          <div className="h-3 rounded bg-slate-200 dark:bg-slate-800 w-2/3" />
          <div className="h-10 rounded-xl bg-slate-900/90 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="bg-white dark:bg-slate-900">
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-rose-500" />
          <div className="h-4 w-4 rounded bg-amber-500" />
          <div className="h-4 w-4 rounded bg-emerald-500" />
        </div>
        <div className="text-sm text-slate-500">app.memorio</div>
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        <div>
          <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="mt-4 h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}