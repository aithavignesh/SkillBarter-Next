import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type AppPageShellProps = { title: string; eyebrow?: string; description?: string; icon?: ReactNode; actions?: ReactNode; children: ReactNode };

export function AppPageShell({ title, eyebrow, description, icon, actions, children }: AppPageShellProps) {
  return (
    <main className="sb-page-shell">
      <div className="sb-page-shell__inner">
        <div className="sb-page-shell__breadcrumb" aria-label="Breadcrumb">
          <span>Workspace</span><ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sb-page-shell__breadcrumb-current">{title}</span>
        </div>
        <header className="sb-page-heading">
          <div className="min-w-0">
            {eyebrow && <div className="sb-page-heading__eyebrow">{icon}<span>{eyebrow}</span></div>}
            <h1 className="sb-page-heading__title">{title}</h1>
            {description && <p className="sb-page-heading__description">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <div className="pt-6">{children}</div>
      </div>
    </main>
  );
}
