import { asset } from "./asset";

/**
 * Todo o conteúdo editável do site mora aqui.
 * Troque textos, links, eventos e o mapa sem mexer nos componentes.
 */

export const SITE = {
  name: "Glass",
  tagline: "Funk, pagode e noites que ficam na memória.",
  address: "Avenida São Paulo, 359",
  city: "Porto Alegre, RS",
  instagram: "https://www.instagram.com/glass.poa/",
  instagramHandle: "@glass.poa",
  // TODO: WhatsApp da casa só com números, com DDI. Ex: "5551999999999".
  // Vazio = os botões de contato abrem o Instagram.
  whatsapp: "",
  // TODO: ID do Google Analytics 4 (ex: "G-ABC123XYZ"). Vazio = cliques só vão ao dataLayer.
  analyticsId: "",
  // Bilheteria oficial dos eventos.
  ticketing: "Bilheteria Digital",
  // Quem produz o site, citado no rodapé ("Produzido por LAX").
  producer: { name: "LAX", instagram: "https://www.instagram.com/laxassessoria/" },
};

export const SPONSORS = ["Jägermeister", "Chandon", "Bilheteria Digital", "Belvedere Vodka", "Red Bull"];

export interface GlassEvent {
  id: string;
  title: string;
  subtitle: string;
  /** Data e hora de abertura com fuso. O status (próximo/já rolou) é calculado a partir daqui. */
  startsAt: string;
  /** Texto curto da hora, ex: "23h". */
  time: string;
  flyer: string;
  blurb: string;
  lineup: string[];
  /** Cor de destaque do evento (a mesma do cartaz). */
  accent: string;
  /** Link da página de venda. Vazio = o botão abre o Instagram da casa. */
  // TODO: Nostalgia 10/10 -> link completo da Bilheteria Digital (o do perfil termina em "...10-de-outubr…").
  ticketUrl: string;
}

export const EVENTS: GlassEvent[] = [
  {
    id: "nostalgia-10-out",
    title: "Nostalgia",
    subtitle: "O melhor do funk dos anos 2000",
    startsAt: "2026-10-10T23:00:00-03:00",
    time: "23h",
    flyer: asset("media/flyer-nostalgia.webp"),
    blurb: "A noite que tu ama relembrar do passado. Funk e pagode de 2000 a 2016.",
    lineup: [],
    accent: "#ff5fc8",
    ticketUrl: "",
  },
  {
    id: "baile-26-set",
    title: "Baile da Glass",
    subtitle: "O verdadeiro baile funk",
    startsAt: "2026-09-26T23:30:00-03:00",
    time: "23h30",
    flyer: asset("media/flyer-baile.webp"),
    blurb: "O verdadeiro baile funk, com Jordan e Shayron.",
    lineup: ["Jordan", "Shayron"],
    accent: "#5aa9ff",
    ticketUrl: "",
  },
  {
    id: "inferninho-19-set",
    title: "Inferninho Funk",
    subtitle: "O seu funk é na Glass",
    startsAt: "2026-09-19T23:00:00-03:00",
    time: "23h",
    flyer: asset("media/flyer-inferninho.webp"),
    blurb: "Atrações confirmadas de funk e open format: Léo Jacques e Shayron.",
    lineup: ["Léo Jacques", "Shayron"],
    accent: "#ff2a1f",
    ticketUrl: "",
  },
];

/**
 * After Movies de festas que já rolaram. Cada item usa `eventId` (um evento de EVENTS: dá título, data e capa)
 * e um vídeo: `youtube` (ID do vídeo) ou `mp4` (arquivo em public/media/videos/). Sem vídeo, mostra "em breve".
 * Para mudar a capa, use `poster`. A galeria mostra no mínimo 6 lugares; os vazios aparecem como "Em breve".
 */
export interface AfterMovie {
  id: string;
  eventId?: string;
  title?: string;
  dateLabel?: string;
  youtube?: string;
  mp4?: string;
  poster?: string;
}

export const AFTER_MOVIE_SLOTS = 6;

export const AFTER_MOVIES: AfterMovie[] = [
  // TODO: colocar o vídeo de cada edição (youtube ou mp4).
  { id: "baile-26-set", eventId: "baile-26-set" },
  { id: "inferninho-19-set", eventId: "inferninho-19-set" },
  // Depois da Nostalgia (10/10), é só descomentar:
  // { id: "nostalgia-10-out", eventId: "nostalgia-10-out", youtube: "ID_DO_VIDEO" },
];

/** O vídeo do espaço. Preencha `mp4` (arquivo em public/media/) ou `youtube` (ID do vídeo). Vazio = "em breve". */
export const SPACE_VIDEO: { mp4?: string; youtube?: string; poster?: string } = {
  // mp4: asset("media/espaco.mp4"),
  // youtube: "ID_DO_VIDEO",
};

export const RENTAL_TYPES = ["Aniversário", "Formatura", "Evento corporativo", "Confraternização", "Outro"];

/**
 * Planta da casa, na mesma disposição do mapa oficial.
 * Posições (x, y, w, d) em unidades de um tabuleiro de 100 x 108; `h` é a altura em 3D.
 * TODO: confirmar com a equipe o texto e as regras de cada área.
 */
export type ZoneKind = "entrada" | "pista" | "palco" | "camarote" | "mesa" | "sidestage" | "backstage" | "bar";

export interface Zone {
  id: string;
  label: string;
  kind: ZoneKind;
  kindLabel: string;
  title: string;
  description: string;
}

export const KIND_COLOR: Record<ZoneKind, string> = {
  entrada: "#8affc1",
  pista: "#ffffff",
  palco: "#f2f6ff",
  camarote: "#b79cff",
  mesa: "#ffcf7a",
  sidestage: "#7fe3ff",
  backstage: "#b9c2d4",
  bar: "#ff7ad9",
};

export const ZONES: Zone[] = [
  {
    id: "entrada",
    label: "Entrada",
    kind: "entrada",
    kindLabel: "Acesso",
    title: "Entrada",
    description: "Acesso principal da casa. É por aqui que você entra e já enxerga a pista.",
  },
  {
    id: "pista",
    label: "Pista",
    kind: "pista",
    kindLabel: "Pista",
    title: "Pista",
    description: "O centro da noite. A pista fica em volta do palco do DJ, com o som e as luzes de frente.",
  },
  {
    id: "dj",
    label: "DJ Stage",
    kind: "palco",
    kindLabel: "Palco",
    title: "Palco do DJ",
    description: "Onde o DJ toca, bem no meio da casa. De qualquer ponto da pista dá para ver e ouvir.",
  },
  {
    id: "c1",
    label: "C1",
    kind: "camarote",
    kindLabel: "Camarote",
    title: "Camarote 1",
    description: "Área elevada e privativa para o seu grupo, com vista para a pista e para o palco.",
  },
  {
    id: "c2",
    label: "C2",
    kind: "camarote",
    kindLabel: "Camarote",
    title: "Camarote 2",
    description: "Área elevada e privativa para o seu grupo, com vista para a pista e para o palco.",
  },
  {
    id: "c3",
    label: "C3",
    kind: "camarote",
    kindLabel: "Camarote",
    title: "Camarote 3",
    description: "Área elevada e privativa para o seu grupo, com vista para a pista e para o palco.",
  },
  {
    id: "vip1",
    label: "VIP 1",
    kind: "mesa",
    kindLabel: "Mesa VIP",
    title: "Mesa VIP 1",
    description: "Mesa com sofá, ao lado da pista. Um lugar para sentar, ficar junto da galera e curtir a noite.",
  },
  {
    id: "vip2",
    label: "VIP 2",
    kind: "mesa",
    kindLabel: "Mesa VIP",
    title: "Mesa VIP 2",
    description: "Mesa com sofá, ao lado da pista. Um lugar para sentar, ficar junto da galera e curtir a noite.",
  },
  {
    id: "s1",
    label: "S1",
    kind: "sidestage",
    kindLabel: "Sidestage",
    title: "Sidestage 1",
    description: "Área ao lado do palco, para ver o DJ de pertinho.",
  },
  {
    id: "s2",
    label: "S2",
    kind: "sidestage",
    kindLabel: "Sidestage",
    title: "Sidestage 2",
    description: "Área ao lado do palco, com sofá, para ver o DJ de pertinho.",
  },
  {
    id: "b1",
    label: "B1",
    kind: "backstage",
    kindLabel: "Backstage",
    title: "Backstage",
    description: "Bastidores da casa. Área reservada, com acesso restrito.",
  },
  {
    id: "bar",
    label: "Bar",
    kind: "bar",
    kindLabel: "Bar",
    title: "Bar",
    description: "O bar principal da casa, de frente para a pista.",
  },
];
