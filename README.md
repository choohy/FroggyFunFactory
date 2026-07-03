# Froggy Fun Factory

An event management app for tracking contacts, venues, and vendor details.

- **Contacts** — people you work with for events (name, role, email, phone, notes), optionally linked to a venue or vendor.
- **Venues** — locations (address, capacity, cost notes), each with a list of linked contacts.
- **Vendors** — caterers, photographers, decorators, etc. (service type, pricing notes), each with a list of linked contacts.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Prisma](https://www.prisma.io) + SQLite for persistence
- [Tailwind CSS](https://tailwindcss.com) for styling

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database file lives at `prisma/dev.db` and is not committed to version control.
