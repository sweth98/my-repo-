import { FOOTER } from "../content/site";
import { Logo } from "../ui/primitives";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 pt-16 pb-10 text-brand-200 sm:pt-20">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-[0.9375rem] leading-relaxed text-brand-200/80">
              Modern Learning. Without Losing Control.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(FOOTER).map(([heading, links]) => (
              <div key={heading}>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-widest text-white">
                  {heading}
                </h2>
                <ul className="mt-3 grid lg:mt-4 lg:gap-2.5">
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#top"
                        className="flex min-h-[44px] items-center text-[0.875rem] text-brand-200/75 transition-colors hover:text-white lg:min-h-[36px]"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.75rem] text-brand-200/60">
            © {year} CanPlus. All rights reserved.
          </p>
          <p className="text-[0.75rem] text-brand-200/60">
            Canvas-compatible · AI-powered · Deployed your way
          </p>
        </div>
      </div>
    </footer>
  );
}
