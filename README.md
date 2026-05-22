# Car Rental SaaS - Enterprise Fleet Management System

## Overview
Complete Production-Ready Multi-Tenant Car Rental Management System with Laravel Backend + Next.js Frontend + Supabase PostgreSQL

## Tech Stack

### Backend
- **Framework**: Laravel 11.x (PHP 8.2+)
- **API**: RESTful API with JWT Authentication
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth + Laravel JWT
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Custom Design System + Tailwind CSS
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│  ├── Manage Tenants/Companies                                  │
│  ├── System Settings                                           │
│  ├── Global Reports                                            │
│  └── Subscription Management                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TENANT COMPANY                              │
│  ├── Owner                                                          │
│  ├── Branch Manager                                               │
│  ├── Employee                                                     │
│  ├── Accountant                                                   │
│  ├── Reception                                                    │
│  └── Driver                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER PORTAL                               │
│  ├── Browse Fleet                                                │
│  ├── Make Bookings                                               │
│  ├── View Contracts                                              │
│  └── Payment History                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Core Modules
1. **Multi-Tenant System** - Complete tenant isolation with RLS
2. **Authentication** - Supabase Auth + JWT for API
3. **Role-Based Access** - Granular permissions per role
4. **Fleet Management** - Complete vehicle lifecycle
5. **Booking System** - Full reservation workflow
6. **Customer Management** - CRM with blacklist
7. **Contract System** - Digital contracts with signatures
8. **Invoice & Billing** - VAT compliant invoices
9. **Financial Reports** - Revenue, profit, analytics
10. **Maintenance Tracking** - Scheduled maintenance
11. **GPS Tracking** - Vehicle location integration
12. **Document Storage** - Secure file management

### User Roles
- `super_admin` - Platform administrator
- `owner` - Company owner
- `branch_manager` - Branch supervisor
- `employee` - Staff member
- `accountant` - Finance team
- `reception` - Front desk
- `driver` - Vehicle driver
- `customer` - End customer portal

## Database Schema

### Core Tables
- `tenants` - Company/organization records
- `users` - User accounts with roles
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mapping
- `branches` - Branch/depot locations
- `vehicles` - Fleet vehicles
- `vehicle_images` - Vehicle media
- `bookings` - Reservations
- `booking_addons` - Additional services
- `customers` - Customer profiles
- `contracts` - Rental agreements
- `invoices` - Billing documents
- `payments` - Payment transactions
- `maintenance_records` - Service history
- `accidents` - Incident reports
- `violations` - Traffic violations
- `documents` - File storage
- `activity_logs` - Audit trail

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user
- `POST /api/auth/refresh` - Refresh token

### Tenants
- `GET/POST /api/tenants` - List/Create tenants
- `GET/PUT/DELETE /api/tenants/{id}` - CRUD operations

### Fleet
- `GET/POST /api/vehicles` - List/Create vehicles
- `GET/PUT/DELETE /api/vehicles/{id}` - CRUD operations
- `GET /api/vehicles/{id}/availability` - Check availability
- `POST /api/vehicles/{id}/maintenance` - Add maintenance record

### Bookings
- `GET/POST /api/bookings` - List/Create bookings
- `GET/PUT/DELETE /api/bookings/{id}` - CRUD operations
- `POST /api/bookings/{id}/extend` - Extend booking
- `POST /api/bookings/{id}/cancel` - Cancel booking

### Customers
- `GET/POST /api/customers` - List/Create customers
- `GET/PUT/DELETE /api/customers/{id}` - CRUD operations
- `POST /api/customers/{id}/blacklist` - Add to blacklist

### Contracts
- `GET/POST /api/contracts` - List/Create contracts
- `GET/PUT /api/contracts/{id}` - View/Update contract
- `POST /api/contracts/{id}/sign` - Digital signature
- `GET /api/contracts/{id}/pdf` - Export PDF

### Invoices
- `GET/POST /api/invoices` - List/Create invoices
- `GET/PUT /api/invoices/{id}` - View/Update invoice
- `POST /api/invoices/{id}/pay` - Record payment
- `GET /api/invoices/{id}/pdf` - Export PDF

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/fleet` - Fleet utilization
- `GET /api/reports/bookings` - Booking analytics
- `GET /api/reports/profit` - Profit/Loss report

### Branches
- `GET/POST /api/branches` - List/Create branches
- `GET/PUT/DELETE /api/branches/{id}` - CRUD operations

### Employees
- `GET/POST /api/employees` - List/Create employees
- `GET/PUT/DELETE /api/employees/{id}` - CRUD operations

## Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- Supabase account
- PostgreSQL client

### Installation

1. Clone the repository
2. Setup environment variables
3. Run database migrations
4. Start the services

See `docs/SETUP.md` for detailed setup instructions.

## License
Proprietary - All Rights Reserved