import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">SkillBarter</h4>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              A fair, collaborative skill exchange platform connecting knowledge seekers and sharers.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/discover" className="hover:text-slate-900">Discover Skills</Link></li>
              <li><Link href="/about" className="hover:text-slate-900">How It Works</Link></li>
              <li><Link href="/community" className="hover:text-slate-900">Community Feed</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Trust & Safety</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/safety" className="hover:text-slate-900">Safety & Moderation</Link></li>
              <li><Link href="/about#guidelines" className="hover:text-slate-900">Exchange Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/login" className="hover:text-slate-900">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-slate-900">Join Community</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-8 flex flex-col sm:flex-row justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SkillBarter. Open collaboration without money.</p>
          <p>Built with Next.js App Router, Express, TypeScript, and MongoDB.</p>
        </div>
      </div>
    </footer>
  );
}
