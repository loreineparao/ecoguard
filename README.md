This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Supabase database

The project now includes a local Supabase schema migration for authentication profiles, resident complaints and permits, uploaded documents, collection schedules, trip tickets, and admin reports.

1. Install and start Docker Desktop. Wait for Docker Desktop to show that its engine is running.
2. From the project folder, start the local Supabase services:

```bash
npm run db:start
npm run db:status
```

3. Copy the local API URL and `anon`/publishable key shown by `db:status` into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

4. Restart Next.js with `npm run dev`. The Supabase Studio dashboard is available at [http://127.0.0.1:54323](http://127.0.0.1:54323).
5. Create an account in EcoGuard. New accounts are residents by default. To grant admin access for local development, open the Studio SQL editor and run:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

The database starts empty; existing hosted records are not copied into the local database. Stop the local services with `npm run db:stop`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
