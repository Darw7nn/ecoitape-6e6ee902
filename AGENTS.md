<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Maps use Leaflet + OpenStreetMap tiles, loaded lazily behind ClientOnly (LazyMap) — Leaflet touches window at import.
- Geocoding uses OpenStreetMap Nominatim, only on explicit user action — free, no key; respect its low-volume policy.
- Public reads go through server functions with a publishable client (points.functions.ts); admin writes use the browser client under admin RLS.
- Public submissions go through the `submit_point` DB function, always inserted as pending — anonymous users never write tables directly.
- Demo points are flagged `is_demo` and hidden from the real catalog unless the visitor opens demo mode.
