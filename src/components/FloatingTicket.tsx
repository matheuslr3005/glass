import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { upcomingEvents } from "../lib";
import { TicketButton } from "./TicketButton";

/** Botão de ingressos fixo no celular, depois que o hero sai da tela. */
export function FloatingTicket() {
  const [show, setShow] = useState(false);
  const next = upcomingEvents()[0];

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!next) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:hidden"
          style={{ zIndex: "var(--z-float)" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
        >
          <TicketButton event={next} location="flutuante" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
