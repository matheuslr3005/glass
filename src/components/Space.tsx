import { useState } from "react";
import { CalendarBlank, Check, Play, UsersThree, VideoCamera, SquaresFour } from "@phosphor-icons/react";
import { KIND_COLOR, RENTAL_TYPES, SITE, SPACE_VIDEO, ZONES } from "../content";
import { contactLink } from "../lib";
import { track } from "../analytics";
import { Button } from "./Button";
import { Reveal } from "./Reveal";

type Tab = "video" | "ambientes";

function VideoPanel() {
  const { mp4, youtube, poster } = SPACE_VIDEO;
  if (youtube) {
    return (
      <iframe
        title="Vídeo do espaço Glass"
        src={`https://www.youtube-nocookie.com/embed/${youtube}?rel=0`}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (mp4) {
    return <video src={mp4} poster={poster} controls playsInline preload="metadata" className="aspect-video w-full bg-ink object-cover" />;
  }
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-[radial-gradient(70%_80%_at_30%_20%,rgba(127,227,255,0.16),transparent),radial-gradient(60%_70%_at_80%_90%,rgba(183,156,255,0.18),transparent)]">
      <div className="text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
          <Play size={30} weight="fill" />
        </span>
        <p className="mt-5 font-display text-3xl font-light">Vídeo do espaço em breve</p>
        <p className="mt-1 text-sm text-steel">Em quanto isso, gire o mapa 3D e veja cada ambiente.</p>
      </div>
    </div>
  );
}

function AmbientesPanel() {
  const groups = [
    { label: "Camarotes", kind: "camarote" as const },
    { label: "Mesas VIP", kind: "mesa" as const },
    { label: "Sidestages", kind: "sidestage" as const },
    { label: "Palco do DJ", kind: "palco" as const },
    { label: "Bar", kind: "bar" as const },
    { label: "Backstage", kind: "backstage" as const },
  ].map((g) => ({ ...g, count: ZONES.filter((z) => z.kind === g.kind).length }));
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-7">
      {groups.map((g) => (
        <a
          key={g.kind}
          href="#mapa"
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition-colors hover:border-white/40"
        >
          <span className="flex items-center gap-3 font-semibold">
            <span className="size-2.5 rounded-full" style={{ background: KIND_COLOR[g.kind], boxShadow: `0 0 10px ${KIND_COLOR[g.kind]}` }} />
            {g.label}
          </span>
          <span className="font-display text-3xl font-light tabular-nums">{String(g.count).padStart(2, "0")}</span>
        </a>
      ))}
      <p className="text-sm text-steel sm:col-span-2">Toque num ambiente para vê-lo no mapa 3D.</p>
    </div>
  );
}

function RentalForm() {
  const [type, setType] = useState(RENTAL_TYPES[0]!);
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const message = () => {
    const parts = [`Oi! Quero alugar a ${SITE.name}.`];
    if (name) parts.push(`Meu nome é ${name}.`);
    parts.push(`Tipo de evento: ${type}.`);
    if (date) parts.push(`Data: ${new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")}.`);
    if (people) parts.push(`Convidados: ${people}.`);
    return parts.join(" ");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    track("rental_submit", { type, has_date: Boolean(date), destination: SITE.whatsapp ? "whatsapp" : "instagram" });
    const text = message();
    if (!SITE.whatsapp) {
      // sem WhatsApp, a mensagem vai para a área de transferência e o direct do Instagram abre
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 4000);
      } catch {
        /* sem permissão para copiar */
      }
    }
    window.open(contactLink(text), "_blank", "noopener,noreferrer");
  };

  const field =
    "h-12 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 text-[15px] text-mist outline-none transition-colors placeholder:text-steel/70 focus:border-ice [color-scheme:dark]";

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-steel sm:col-span-2">
        Seu nome
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Como podemos te chamar?" />
      </label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-steel">
        Tipo de evento
        <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
          {RENTAL_TYPES.map((t) => (
            <option key={t} value={t} className="bg-obsidian">
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-steel">
        Data prevista
        <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-steel sm:col-span-2">
        Número de convidados
        <input
          type="number"
          inputMode="numeric"
          min={1}
          className={field}
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          placeholder="Aproximado"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-full bg-mist px-7 text-[15px] font-semibold text-ink shadow-[0_14px_40px_-12px_rgba(127,227,255,0.7)] transition active:scale-[0.97] hover:bg-white"
        >
          Pedir orçamento
        </button>
        {copied && (
          <span className="flex items-center gap-2 text-sm text-ice">
            <Check size={18} /> Mensagem copiada. Cole no direct do Instagram.
          </span>
        )}
      </div>
    </form>
  );
}

export function Space() {
  const [tab, setTab] = useState<Tab>("video");
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "video", label: "Vídeo do espaço", icon: <VideoCamera size={18} /> },
    { id: "ambientes", label: "Ambientes", icon: <SquaresFour size={18} /> },
  ];

  return (
    <section id="espaco" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-ice">Aluguel</p>
          <h2 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] font-light leading-none">
            Faça a sua noite na <span className="prism-text italic">Glass</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-steel">
            A casa também é sua. Alugue o espaço para aniversários, formaturas, eventos corporativos e confraternizações, com pista, palco,
            camarotes e bar.
          </p>
          <ul className="mt-6 grid gap-3 text-mist/90">
            <li className="flex items-center gap-3">
              <UsersThree size={22} className="text-ice" /> Do jeito do seu evento: conte a ideia e a gente monta junto.
            </li>
            <li className="flex items-center gap-3">
              <CalendarBlank size={22} className="text-ice" /> Diga a data e o número de convidados para receber o orçamento.
            </li>
          </ul>
          <div className="mt-10">
            <RentalForm />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass overflow-hidden rounded-card">
            <div role="tablist" aria-label="Conteúdo do espaço" className="flex gap-1 border-b border-white/10 p-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
                    tab === t.id ? "bg-mist text-ink" : "text-steel hover:text-white"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            <div role="tabpanel">{tab === "video" ? <VideoPanel /> : <AmbientesPanel />}</div>
          </div>
          <div className="mt-5">
            <Button variant="ghost" href="#mapa">
              Ver o mapa 3D da casa
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
