import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "@/components/icons";

type Variant =
  | "gold"
  | "outline"
  | "navy"
  | "ghost"
  | "outlineLight"
  | "navyOutline";

const variants: Record<Variant, string> = {
  gold: "bg-gold-400 text-navy-900 hover:bg-gold-500 shadow-[0_6px_16px_-8px_rgba(234,174,20,0.9)]",
  outline:
    "border border-navy-900/35 text-navy-900 hover:border-navy-900 hover:bg-navy-50",
  navyOutline: "border border-white/30 text-white hover:border-white hover:bg-white/10",
  outlineLight: "border border-white/45 text-white hover:bg-white/10",
  navy: "bg-navy-900 text-white hover:bg-navy-950",
  ghost: "text-navy-900 hover:text-navy-500",
};

const sizes = {
  md: "h-11 px-5 text-[13px]",
  sm: "h-9 px-4 text-[12.5px]",
  lg: "h-12 px-6 text-[13.5px]",
} as const;

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  withArrow?: boolean;
  className?: string;
  external?: boolean;
};

export function ButtonLink({
  href,
  children,
  variant = "gold",
  size = "md",
  withArrow = true,
  className,
  external = false,
}: ButtonLinkProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg text-center font-semibold tracking-[0.01em] whitespace-nowrap transition-colors duration-200 ${
    sizes[size]
  } ${variants[variant]} ${className ?? ""}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        <span>{children}</span>
        {withArrow ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      <span>{children}</span>
      {withArrow ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: keyof typeof sizes;
};

export function Button({
  variant = "navy",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[0.01em] whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        sizes[size]
      } ${variants[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
