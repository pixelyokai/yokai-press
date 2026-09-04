# Brand assets

Drop-in locations. Next.js App Router picks the `app/` ones up automatically —
no code change needed, just the file with the right name.

| What                | Put it here                  | Size          |
| ------------------- | ---------------------------- | ------------- |
| Favicon             | `app/icon.png` (or `.svg`)   | 512 × 512     |
| Apple touch icon    | `app/apple-icon.png`         | 180 × 180     |
| Open Graph image    | `app/opengraph-image.png`    | 1200 × 630    |
| Twitter card        | `app/twitter-image.png`      | 1200 × 630    |
| Logo used in the UI | `public/brand/logo.svg`      | any           |

`app/icon.png` replaces the default favicon and emits the `<link>` tags itself.
The same goes for `opengraph-image` and `twitter-image` — the moment the file
exists, the tags appear. `metadataBase` in `app/layout.tsx` is what turns them
into the absolute URLs crawlers require, so set `NEXT_PUBLIC_SITE_URL` in
production.

The wordmark in the top-left of the stage is live text (Bodoni Moda), not an
image. To swap in `logo.svg`, replace the `<h1>` in `components/Stage.tsx`.
