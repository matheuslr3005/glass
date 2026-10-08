import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { InstagramLogo, List, X } from "@phosphor-icons/react";
import { SITE } from "../content";
import { upcomingEvents } from "../lib";
import { track } from "../analytics";
import { Logo } from "./Logo";
import { TicketButton } from "./TicketButton";

const LINKS = [
  { id: "eventos", label: "Eventos" },
  { id: "aftermovies", label: "After Movies" },
  { id: "mapa", label: "Mapa 3D" },
  { id: "espaco", label: "Aluguel" },
  { id: "contato", label: "Contato" },
];

export function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const next = upcomingEvents()[0];

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // com o menu aberto no celular, a página atrás não rola
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-3 flex justify-center px-3" style={{ zIndex: "var(--z-nav)" }}>
        <nav
          aria-label="Principal"
          className="glass flex h-14 w-full max-w-4xl items-center justify-between gap-2 rounded-full py-2 pl-5 pr-2"
        >
          <a href="#top" aria-label="Glass, início" className="text-[1.65rem]" onClick={() => setOpen(false)}>
            <Logo className="text-[1.65rem]" />
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  aria-current={active === l.id ? "true" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active === l.id ? "bg-white/15 text-white" : "text-steel hover:text-white"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {next && <TicketButton event={next} location="nav" size="sm" className="max-sm:hidden" />}
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="flex size-10 items-center justify-center rounded-full border border-white/20 md:hidden"
            >
              {open ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 flex flex-col justify-center gap-2 bg-ink/90 px-8 backdrop-blur-2xl md:hidden"
            style={{ zIndex: "calc(var(--z-nav) - 1)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {LINKS.map((l, i) => (
              <motion.a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="font-display text-5xl font-light"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {l.label}
              </motion.a>
            ))}
            <div className="mt-8 flex items-center gap-4">
              {next && <TicketButton event={next} location="menu" />}
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("instagram_click", { location: "menu" })}
                aria-label="Instagram da Glass"
                className="flex size-12 items-center justify-center rounded-full border border-white/25"
              >
                <InstagramLogo size={22} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
