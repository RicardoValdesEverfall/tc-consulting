# T.C Consulting

Marketing site for T.C Consulting — a Canadian advisory firm helping business owners write fundable business plans, build defensible cashflow projections, and secure capital from BDC, CSBFP, Futurpreneur, and bank lenders.

## Stack

Static HTML + CSS + JS. No build step. Deploys directly to Vercel.

## Files

- `index.html` — single landing page
- `styles.css` — design tokens and component styles
- `script.js` — sticky nav, mobile menu, card-stack toggle, scroll reveals
- `assets/` — logo concepts and any future imagery

## Local preview

```
npx http-server -p 8765 -c-1
```

Then open http://127.0.0.1:8765/

## Design system

Synthesis of editorial restraint (Cohere) + dark CTA discipline (HashiCorp) +
codified rules from `power-design`: modular type scale 1.25, 8pt spacing grid,
60-30-10 color split, single navy accent, ≥40% whitespace ratio per section.
