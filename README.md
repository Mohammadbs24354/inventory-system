# InvenTrack – Inventory Management System

A full-stack ERP-lite inventory management system built with Next.js 14, Prisma, SQLite, and NextAuth.js.

## Quick Start

```bash
cd inventory-system
npm install
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Role        | Email                        | Password       |
|-------------|------------------------------|----------------|
| Super Admin | superadmin@inventory.com     | superadmin123  |
| Admin       | admin@inventory.com          | admin123       |
| Employee    | employee@inventory.com       | employee123    |
| Customer    | customer@inventory.com       | customer123    |

## Features

- **Dashboard** – Stats, low-stock alerts, recent movements, order overview
- **Products** – CRUD with SKU, price, warehouse assignment
- **Inventory** – SKU-based stock update form (auto-creates if new), movement log
- **Warehouses** – Multi-warehouse management
- **Orders** – Full order lifecycle (Pending → Paid → Shipped / Cancelled), stock auto-deduction
- **Users** – Role-based user management (Super Admin is protected)
- **Storefront** – Product listing, cart, checkout, order tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma ORM
- **Auth**: NextAuth.js (credentials + JWT)
- **UI**: Tailwind CSS + Radix UI
- **Language**: TypeScript

## Reset Database

```bash
npx prisma migrate reset
```
