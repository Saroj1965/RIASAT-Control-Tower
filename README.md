# RIASAT EXECUTIVE CONTROL TOWER

Enterprise Decision Support & Multi-Vertical Operations Management Cockpit for:  
**Ramaiah Institute for Advanced Skills & Technology (RIASAT)**

---

## 🌟 Architecture & Core Flow
`USER AUTHENTICATION → VERTICAL WORKSTREAM FORM → SUPABASE DATABASE → EXECUTIVE CONTROL TOWER`

1. **3-Second Responsive Loading Screen**:
   - High-fidelity white branded entry portal featuring the official Ramaiah insignia.
   - Blue, black, pink, and orange thematic typography with animated progress synchronization.
2. **Clean Minimal Login Portal**:
   - Pure white aesthetic with dedicated official fields (Email & Password).
   - Instant credential selector via the **"See Credentials"** modal — click any institutional role to automatically fill and enter.
   - Zero database indicators or visual clutter on the login screen.
3. **Supabase Enterprise Cloud Database**:
   - Single source of truth powered by Supabase PostgreSQL and `@supabase/supabase-js`.
   - Full DDL schema and complete seed dataset available in [`supabase_schema.sql`](./supabase_schema.sql).
4. **Executive Control Tower Dashboard**:
   - Consolidated leadership view presenting the 5 top strategic KPIs, 9 department operational cards, and live Management Attention escalation tracker.
5. **Role-Based Access Control (RBAC)**:
   - Department Heads are restricted strictly to their vertical (`403 Forbidden` on cross-department requests).
   - Executives and Vice Chairman have read-only visibility over all 9 verticals with strategic action sign-off authority.

---

## 🏛 The 9 Strategic Vertical Departments
1. **Semicon** (`SEMICON`)
2. **Aerospace & Defence** (`AERO_DEFENCE`)
3. **Space** (`SPACE`)
4. **Cybersecurity** (`CYBER`)
5. **MedTech** (`MEDTECH`)
6. **Advanced Manufacturing** (`ADV_MFG`)
7. **HR & Recruitment** (`HR_REC`)
8. **Communications** (`COMM`)
9. **Strategy & Operations** (`STRATEGY_OPS`)

---

## 👥 Institutional Accounts & Credentials (Available in "See Credentials")

| Role | Name | Official Email | Password | Access Scope |
|---|---|---|---|---|
| **Vice Chairman** | Vice Chairman Office | `vicechairman@riasat.ac.in` | `ViceChairman@123` | Complete Executive Control & Action Sign-off |
| **Admin** | System Administrator | `admin@riasat.ac.in` | `Admin@123` | Full access, user directory & schema configuration |
| **Executive** | Executive Director | `executive@riasat.ac.in` | `Exec@123` | Executive Control Tower (Read-Only) |
| **Form Admin** | Form Configuration Admin | `forms.admin@riasat.ac.in` | `Forms@123` | Dynamic Form Builder & Field Schema |
| **User Admin** | User Management Admin | `users.admin@riasat.ac.in` | `Users@123` | User Access & Credential Administration |
| **Dept Admin** | Departments Master Admin | `dept.admin@riasat.ac.in` | `Dept@123` | Department Master Verticals Configuration |
| **Dept Head** | Dr. Arun Kumar | `semicon.head@riasat.ac.in` | `Semicon@123` | Semicon Vertical Operational Workspace |
| **Dept Head** | Wg Cdr R. Sharma | `aero.head@riasat.ac.in` | `Aero@123` | Aerospace & Defence Workspace |
| **Dept Head** | Dr. P. Sundaram | `space.head@riasat.ac.in` | `Space@123` | Space Technology Workspace |
| **Dept Head** | Col. K. Menon | `cyber.head@riasat.ac.in` | `Cyber@123` | Cybersecurity Systems Workspace |
| **Dept Head** | Dr. Neha Varma | `medtech.head@riasat.ac.in` | `MedTech@123` | MedTech & Healthcare Workspace |
| **Dept Head** | Prof. Rajesh Iyer | `mfg.head@riasat.ac.in` | `Mfg@123` | Advanced Manufacturing Workspace |
| **Dept Head** | Sumanth Rao | `hr.head@riasat.ac.in` | `Hr@123` | HR & Talent Acquisition Pipeline |
| **Dept Head** | Ananya Sen | `comm.head@riasat.ac.in` | `Comm@123` | Communications & Brand Workspace |
| **Dept Head** | Dr. Venkat Raman | `ops.head@riasat.ac.in` | `Ops@123` | Strategy & Operations Workspace |

---

## 🛠 Technology Stack
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript 5
- **Design System**: Tailwind CSS 3.4 with custom Ramaiah Blue, Black, Pink, and Orange theme
- **Database**: Supabase PostgreSQL + `@supabase/supabase-js`
- **Security**: HttpOnly Signed JWT Session Cookies, bcrypt password hashing, server-side RBAC
- **Audit Ledger**: Comprehensive audit trail recording user logins, departmental updates, and action item status changes

---

## 🚀 Supabase Setup Guide

### 1. Configure `.env`
Fill in your Supabase project credentials in `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
```

### 2. Execute SQL Schema in Supabase
Open your **Supabase Dashboard → SQL Editor**, paste the contents of [`supabase_schema.sql`](./supabase_schema.sql), and click **Run**.  
This creates all 10 tables, performance indexes, dynamic form schemas, and pre-seeds all 15 institutional accounts.
