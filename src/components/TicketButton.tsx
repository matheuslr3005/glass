import { Ticket } from "@phosphor-icons/react";
import { track } from "../analytics";
import type { GlassEvent } from "../content";
import { ticketLink } from "../lib";
import { buttonVariants } from "./Button";

interface Props {
  event: GlassEvent;
  /** De onde veio o clique, para o rastreamento: hero, nav, flutuante, evento, modal, final. */
  location: string;
  size?: "md" | "sm";
  className?: string;
}

/** Botão único de ingressos: rastreia o clique e leva para a bilheteria. */
export function TicketButton({ event, location, size = "md", className = "" }: Props) {
  const sizing = size === "sm" ? "h-10 px-5 text-sm" : "h-12 px-6 text-[15px]";
  return (
    <a
      href={ticketLink(event, location)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track("ticket_click", { location, event_id: event.id, destination: event.ticketUrl ? "ingressos" : "instagram" })
      }
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,box-shadow,transform] duration-300 ease-out-expo active:scale-[0.97] ${sizing} ${buttonVariants.primary} ${className}`}
    >
      <Ticket size={size === "sm" ? 18 : 20} weight="fill" />
      Ingressos
    </a>
  );
}
