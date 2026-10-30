const highlights = [
  { title: "Share what you know", detail: "Offer skills you have practiced and can confidently teach." },
  { title: "Discover your next skill", detail: "Find people whose skills complement what you want to learn." },
  { title: "Grow through exchange", detail: "Agree on an exchange, schedule sessions, and review the experience." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a className="text-xl font-bold tracking-tight" href="/">SkillBarter</a>
        <nav className="flex items-center gap-5 text-sm">
          <a className="text-slate-600 hover:text-slate-950" href="#how-it-works">How it works</a>
          <a className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700" href="mailto:hello@skillbarter.example">Get started</a>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Learn together. Exchange fairly.</p>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">Your skills are worth sharing.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">SkillBarter connects people who want to teach what they know with people ready to learn something new—without making money the centre of the exchange.</p>
          <a href="#how-it-works" className="mt-9 inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500">Explore how it works</a>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">THE SKILL EXCHANGE LOOP</p>
          <ol className="mt-6 space-y-5">
            {["Create your skill profile", "Find a complementary match", "Agree on an exchange", "Learn, teach, and review"].map((step, index) => (
              <li className="flex items-center gap-4" key={step}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700">{index + 1}</span>
                <span className="font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-bold">A better way to learn from each other</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
