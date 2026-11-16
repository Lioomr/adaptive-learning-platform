# Component contract

The shared shell provides responsive role navigation, selected course and student context, progress and a minimal text tour. `components/ui/card.tsx` provides a reusable semantic card; `components/ui/skeleton.tsx` supplies a shimmer primitive and page placeholder. Route loading files reuse the page placeholder. CSS tokens, responsive rules and reduced-motion behavior are in `app/globals.css`. Components should use the centralized store and service rather than duplicate scoring. Shared component contract changes require Integration Lead review.

The initial primitives are deliberately small; shadcn-compatible form/dialog components, additional layout-matched skeleton variants, charts, graphs, fully loaded specified fonts, RTL and tour focus/highlighting remain future work.
