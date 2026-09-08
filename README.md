# Namma Transit — WhatsApp Commuter Survey

A WhatsApp chatbot that runs a bilingual (English/Kannada) commuter survey for Bengaluru Transit Corporation, plus an admin dashboard for viewing the responses it collects.

## Structure

```
backend/          Express + Prisma + Postgres — the WhatsApp bot and admin API
admin-frontend/   React + Vite + shadcn/ui — the dashboard that reads survey data
docs/             Full developer documentation (Docusaurus)
```

## Start here

```bash
cd docs
npm install
npm start
```

Opens the full documentation at `http://localhost:3100` — setup instructions, architecture, database schema, API reference, and known limitations for both apps.
