import type { ReactNode } from "react";
import { track } from "../analytics";

interface Props {
  children: ReactNode;
  variant?: "primary" | "ghost";
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  external?: boolean;
  className?: string;
  /** Evento enviado ao rastreamento quando o botão é clicado. */
  trackEvent?: [name: string, params?: Record<string, string | number | boolean | undefined>];
}

const base =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[15px] font-semibold transition-[background-color,box-shadow,transform,border-color] duration-300 ease-out-expo active:scale-[0.97]";

export const buttonVariants = {
  primary:
    "bg-mist text-ink shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_14px_40px_-12px_rgba(127,227,255,0.7)] hover:bg-white hover:shadow-[0_0_0_1px_#fff,0_18px_50px_-10px_rgba(183,156,255,0.85)]",
  ghost:
    "border border-white/25 bg-white/[0.04] text-mist backdrop-blur-md hover:border-white/70 hover:bg-white/10",
};

export function Button({ children, variant = "primary", href, onClick, icon, external, className = "", trackEvent }: Props) {
  const cls = `${base} ${buttonVariants[variant]} ${className}`;
  const handle = () => {
    if (trackEvent) track(trackEvent[0], trackEvent[1]);
    onClick?.();
  };
  const content = (
    <>
      {children}
      {icon}
    </>
  );
  return href ? (
    <a href={href} className={cls} onClick={handle} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={handle} className={cls}>
      {content}
    </button>
  );
}
