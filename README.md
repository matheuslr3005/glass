# Glass

Site da Glass (festas e eventos, Porto Alegre): abertura com um vidro que se quebra, próximos eventos com contagem regressiva, **mapa 3D da casa** (camarotes, mesas VIP, sidestages, palco, bar), aluguel do espaço e contato.

Stack: Vite, React 19, TypeScript, Tailwind v4, Motion (`motion/react`) e Phosphor Icons. Mesma base do site do Sun, Bar & Love.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera a pasta dist/
npm run preview  # testa o build
```

O deploy no GitHub Pages está em `.github/workflows/pages.yml` (publica a cada push na `main`).

## Como editar o conteúdo

Tudo fica em `src/content.ts`.

- **Contato** (`SITE`): endereço, Instagram e **WhatsApp**. Com `whatsapp` vazio, os botões de contato e o formulário de aluguel abrem o Instagram (e o formulário copia a mensagem para colar no direct). Também tem o ID do Google Analytics.
- **Eventos** (`EVENTS`): `startsAt` define tudo. O evento vira "Já rolou" sozinho 8h depois da abertura, e o próximo evento aparece no hero, na barra e nos botões de ingresso. `ticketUrl` é o link da Bilheteria Digital (vazio = abre o Instagram). `accent` é a cor do cartaz, usada no brilho do evento. Cartazes em `public/media/`.
  - **Pendente:** colocar o link completo da Nostalgia (10/10) em `ticketUrl`.
- **After Movies** (`AFTER_MOVIES`): a galeria de vídeos das festas que já rolaram. Cada item aponta para um evento (`eventId`, que dá título, data e capa) e leva o vídeo em `youtube` (ID) ou `mp4` (arquivo em `public/media/videos/`). Sem vídeo, aparece "After Movie em breve". A galeria sempre mostra 6 lugares (`AFTER_MOVIE_SLOTS`); os vazios aparecem como "Em breve". Depois do primeiro play, trocar de aba já toca o próximo vídeo, e os mp4 passam sozinhos para o seguinte.
- **Vídeo do espaço** (`SPACE_VIDEO`): `mp4` (arquivo em `public/media/`) ou `youtube` (ID). Vazio mostra "Vídeo do espaço em breve" na aba **Vídeo do espaço** da seção de aluguel.
- **Tipos de aluguel** (`RENTAL_TYPES`): as opções do formulário.
- **Patrocinadores** (`SPONSORS`): a faixa que corre entre o hero e o texto.
- **Mapa** (`ZONES`): nome, tipo e descrição de cada área (Entrada, Pista, DJ Stage, C1 a C3, VIP 1 e 2, S1 e S2, B1, Bar). Os textos são genéricos: **confirme com a equipe** o que cada área inclui.

## Mapa 3D (`src/components/VenueMap.tsx`)

Feito só com CSS 3D, sem biblioteca. Arraste para girar, botões **3D** e **Planta**, clique ou passe o mouse numa área para ler o que é, e a lista ao lado filtra por tipo (camarote, mesa, sidestage...). Em camarote, mesa e sidestage aparece o botão "Reservar".

A disposição segue o mapa oficial. Para mexer em posição ou tamanho, edite `GEO` (e `DJ`) no topo do arquivo: `x`, `y`, `w` (largura), `d` (fundo) e `h` (altura 3D), numa grade de 100 x 108. Cores por tipo em `KIND_COLOR` (`content.ts`). O rótulo de cada área fica no fim do componente (`<Label ... />`).

O mapa da edição especial (vinil rosa) não foi usado de propósito: esta versão é a planta padrão da casa.

## Abertura (`src/components/Intro.tsx` e `src/shatter.ts`)

Um vidro escuro com o logo. Toque ou clique (ou espere ~3,4 s) e ele racha a partir do ponto tocado, quebra em cacos que caem em 3D e o site aparece por trás. `Pular` (ou Esc/Enter/Espaço) quebra na hora. Toca a cada abertura ou atualização da página (também com `#seção` no endereço: depois do vidro, o site vai para a seção). Só não toca com "reduzir movimento" ligado no sistema. Para mudar o tempo, veja `AUTO_BREAK_MS` e `CRACK_MS`.

## Rastreamento

`track()` (em `src/analytics.ts`) registra cliques de ingresso, Instagram, zonas do mapa, reservas e o formulário de aluguel. Com `analyticsId` vazio, os eventos vão só para o `dataLayer`.
