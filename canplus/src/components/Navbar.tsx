import { useEffect, useState } from "react";
import { NAV } from "../content/site";
import { Button, Logo, cx } from "../ui/primitives";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stop the page scrolling behind the open mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          // The blur only appears once stuck, so the hero stays clean at rest.
          scrolled
            ? "bg-white/80 shadow-[0_1px_0_rgba(11,18,52,.07)] backdrop-blur-xl backdrop-saturate-150"
            : "bg-transparent",
        )}
      >
        <nav className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]" aria-label="Primary">
          <a href="#top" className="flex min-h-[44px] items-center" aria-label="CanPlus home">
            <Logo />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-mist-100 hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <Button href="#demo" className="px-4 py-2.5">
              Book a Demo
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 grid h-11 w-11 place-items-center rounded-xl text-ink transition-colors hover:bg-mist-100 lg:hidden"
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={cx(
                  "absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300",
                  open ? "top-1.5 rotate-45" : "top-0.5",
                )}
              />
              <span
                className={cx(
                  "absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cx(
                  "absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300",
                  open ? "top-1.5 -rotate-45" : "top-[0.875rem]",
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        className={cx(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cx(
            "absolute inset-0 bg-navy-950/25 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cx(
            "absolute inset-x-0 top-0 rounded-b-3xl bg-white pb-6 pt-20 shadow-panel transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
            open ? "translate-y-0" : "-translate-y-full",
          )}
        >
          <ul className="container-page grid gap-1">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[52px] items-center rounded-xl px-3 text-base font-medium text-ink transition-colors hover:bg-mist-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-3">
              <Button href="#demo" className="w-full" >
                Book a Demo
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
