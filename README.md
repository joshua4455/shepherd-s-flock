# ChurchHub

Modern church management platform to manage members, visitors, and converts.

## Getting Started

Prerequisites:

- Node.js 18+ and npm

Install and run:

```sh
npm install
npm run dev
```

Open http://localhost:8080 in your browser.

## Build

```sh
npm run build
npm run preview
```

## Tech Stack

- Vite + React + TypeScript
- shadcn/ui (Radix primitives)
- Tailwind CSS
- TanStack Query

## CSV Templates & Import

The app supports CSV export/import for Members, Visitors, and Converts.

- Members CSV headers:
  - `Full Name, Gender, Date of Birth, Phone, Parent/Guardian, Service Category, Care Group, Created At, Updated At`
  - Notes:
    - `Parent/Guardian` is optional, but required in the UI when Service Category is Children/Teens.
    - Service Category accepts these values: `Victory Land (children)`, `Teens`, `Youth`, `Adults`.

- Visitors CSV headers:
  - `Full Name, Phone, Email, Service Attended, First Visit Date, How Heard, Areas of Interest, Follow-up, Created At, Updated At`
  - Notes:
    - Service Attended accepts: `Victory Land (children)`, `Teens`, `Youth`, `Adults`.

- Converts CSV headers:
  - `Full Name, Phone, Email, Service, Date of Conversion, Follow-up Status, Assigned Leader, Created At, Updated At`
  - Notes:
    - Service accepts: `Victory Land (children)`, `Teens`, `Youth`, `Adults`.

Import tips:

- In Settings → Import Data (CSV), you can enable Column Mapping to align imperfect headers. Required fields are shown; optional fields (like Parent/Guardian) are supported when present.
- The importer recognizes `Victory Land` and maps it to the internal `children` service group.

## Icons & PWA

- App icons are in `public/` (e.g., `logo12.png`, `favicon.ico`).
- Web App Manifest is `public/manifest.webmanifest` and linked from `index.html`.

## Project Structure

- `src/pages/`: App pages (Members, Visitors, Converts, Settings, etc.)
- `src/components/`: Reusable UI components
- `src/services/`: Data hooks and services
- `public/`: Static assets

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — lint the codebase

## Deployment

Deploy the contents of `dist/` to your static hosting provider (e.g., Netlify, Vercel, Cloudflare Pages, S3/CloudFront).

# shepherd-s-flock
