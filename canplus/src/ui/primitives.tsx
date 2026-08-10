import {
  useEffect,
  useRef,
  type ElementType,
  type ReactNode,
} from "react";
import { observeReveal } from "../lib/reveal";

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ Reveal */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => observeReveal(ref.current), []);
  return (
    <Tag
      ref={ref}
      // min-w-0 matters: Reveal is used as a grid/flex child all over the
      // site, and a grid item's default min-width:auto refuses to shrink
      // below its content, which produced real overflow at 320px.
      className={cx("reveal min-w-0", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------- Logo */
export function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  // Single swap point: drop the official asset at these paths and every
  // instance across the site updates. Never set the wordmark as live text.
  return (
    <img
      src={variant === "light" ? "/brand/canplus-logo-light.svg" : "/brand/canplus-logo.svg"}
      alt="CanPlus"
      width={168}
      height={40}
      className={cx("h-8 w-auto sm:h-9", className)}
    />
  );
}

/* ------------------------------------------------------------------ Button */
type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "onDark";
  className?: string;
};

export function Button({ href, children, variant = "primary", className }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[0.9375rem] font-medium " +
    "min-h-[44px] transition duration-200 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform";

  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-navy-900 text-white shadow-[0_1px_2px_rgba(11,18,52,.15)] hover:bg-navy-800 hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgba(11,18,52,.5)]",
    secondary:
      "bg-white text-ink ring-1 ring-line-strong hover:ring-brand-400 hover:-translate-y-px hover:shadow-soft",
    ghost: "text-body hover:text-ink",
    onDark:
      "bg-white text-navy-900 hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,.6)]",
  };

  return (
    <a href={href} className={cx(base, styles[variant], className)}>
      {children}
    </a>
  );
}

/* ----------------------------------------------------------------- Eyebrow */
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em]",
        tone === "dark" ? "text-brand-200" : "text-brand-600",
      )}
    >
      <span
        className={cx(
          "inline-block h-1.5 w-1.5 rounded-full",
          tone === "dark" ? "bg-accent-200" : "bg-accent-600",
        )}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------- Section */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  tone = "white",
  align = "left",
  titleWrap = "balance",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  tone?: "white" | "mist" | "navy";
  align?: "left" | "center";
  /** Pass "manual" when the title contains an explicit <br/>. */
  titleWrap?: "balance" | "manual";
  className?: string;
}) {
  const tones = {
    white: "bg-white",
    mist: "bg-mist-50",
    navy: "bg-navy-900 text-brand-100",
  } as const;

  return (
    <section
      id={id}
      className={cx("scroll-mt-24 py-20 sm:py-24 lg:py-32", tones[tone], className)}
    >
      <div className="container-page">
        {(eyebrow || title || lede) && (
          <Reveal
            className={cx(
              "max-w-2xl",
              align === "center" && "mx-auto text-center",
            )}
          >
            {eyebrow && <Eyebrow tone={tone === "navy" ? "dark" : "light"}>{eyebrow}</Eyebrow>}
            {title && (
              <h2
                className={cx(
                  "mt-4 text-[1.75rem] leading-[1.15] sm:text-4xl lg:text-[2.75rem]",
                  titleWrap === "manual" && "hd-manual",
                  tone === "navy" && "text-white",
                )}
              >
                {title}
              </h2>
            )}
            {lede && (
              <p
                className={cx(
                  "mt-5 text-base leading-relaxed sm:text-lg",
                  tone === "navy" ? "text-brand-200" : "text-body",
                )}
              >
                {lede}
              </p>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- App chrome */
/** A restrained window frame so product mock-ups read as software, not slides. */
export function AppWindow({
  children,
  label,
  className,
  tone = "light",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-2xl ring-1",
        tone === "dark"
          ? "bg-navy-950 ring-white/10"
          : "bg-white ring-line shadow-panel",
        className,
      )}
    >
      <div
        className={cx(
          "flex items-center gap-2 border-b px-4 py-3",
          tone === "dark" ? "border-white/10 bg-navy-900" : "border-line bg-mist-50",
        )}
      >
        <span className="flex gap-1.5" aria-hidden="true">
          {["#E5E9F4", "#E5E9F4", "#E5E9F4"].map((_, i) => (
            <span
              key={i}
              className={cx(
                "h-2.5 w-2.5 rounded-full",
                tone === "dark" ? "bg-white/15" : "bg-line-strong",
              )}
            />
          ))}
        </span>
        {label && (
          <span
            className={cx(
              "ml-2 truncate font-mono text-[0.6875rem]",
              tone === "dark" ? "text-brand-200/70" : "text-muted",
            )}
          >
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- Tag / Pill */
export function Tag({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "accent" | "neutral" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    accent: "bg-accent-50 text-accent-700 ring-accent-100",
    neutral: "bg-mist-100 text-body ring-line",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-medium ring-1 ring-inset",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ progress ring */
export function ProgressRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E8F4" strokeWidth="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#3D63F0"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
