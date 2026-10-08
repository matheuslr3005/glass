import { EVENTS, SITE, type GlassEvent } from "./content";

const HOUR = 3_600_000;
/** Depois de 8h da abertura a edição conta como "já rolou". */
const EVENT_LENGTH = 8 * HOUR;

export function isUpcoming(event: GlassEvent, now = Date.now()): boolean {
  return new Date(event.startsAt).getTime() + EVENT_LENGTH > now;
}

/** Próximos eventos, do mais perto para o mais longe. */
export function upcomingEvents(now = Date.now()): GlassEvent[] {
  return EVENTS.filter((e) => isUpcoming(e, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Eventos passados, do mais recente para o mais antigo. */
export function pastEvents(now = Date.now()): GlassEvent[] {
  return EVENTS.filter((e) => !isUpcoming(e, now)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** WhatsApp quando houver número; senão o Instagram da casa. */
export function contactLink(message: string): string {
  return SITE.whatsapp ? whatsappLink(message) : SITE.instagram;
}

export function ticketLink(event: GlassEvent, location = "site"): string {
  if (!event.ticketUrl) return contactLink(`Oi! Quero ingressos para o ${event.title}.`);
  try {
    const url = new URL(event.ticketUrl);
    url.searchParams.set("utm_source", "site");
    url.searchParams.set("utm_medium", "botao");
    url.searchParams.set("utm_campaign", event.id);
    url.searchParams.set("utm_content", location);
    return url.toString();
  } catch {
    return event.ticketUrl;
  }
}

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.address}, ${SITE.city}`,
)}`;

const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" });

export function eventDate(event: GlassEvent): { weekday: string; day: string } {
  const d = new Date(event.startsAt);
  const weekday = weekdayFmt.format(d);
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day: dayFmt.format(d) };
}
