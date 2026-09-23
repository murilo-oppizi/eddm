# eddm.com

Marketing site for EDDM (Every Door Direct Mail), built by Oppizi.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Lucide icons

## Run it locally

```bash
npm install      # first time only
npm run dev -- --port 3100
```

Open http://localhost:3100. The styleguide is at http://localhost:3100/styleguide.

## Where things live

| What | File |
|------|------|
| Oppizi Design System tokens (source of truth, don't hand-edit) | `src/styles/oppizi-tokens.css` |
| How those tokens map onto shadcn names | `src/app/globals.css` (`:root` block) |
| Fonts | `src/app/layout.tsx` |
| All homepage copy | `src/content/site.ts` |
| Homepage sections (hero, pricing, FAQ…) | `src/components/sections/` |
| Header, footer, logo | `src/components/site/` |
| shadcn components | `src/components/ui/` (add more with `npx shadcn@latest add <name>`) |
| Pages | `src/app/` (a folder = a URL, e.g. `src/app/about/page.tsx` → `/about`) |

## Design system

Colors, radius and dark mode come from the Oppizi Design System export (`oppizi-tokens.css`, from the Component Library Navigator). To update, replace that file with a newer export. Dark mode: set `data-theme="dark"` on `<html>`.

## Notes for backend devs

- Front-end only for now. The ZIP form in `src/components/sections/cta.tsx` doesn't submit anywhere yet.
- Prices, stats and claims in `src/content/site.ts` are placeholders.
