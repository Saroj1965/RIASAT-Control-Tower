# RIASAT EXECUTIVE CONTROL TOWER

Management Decision Support & Departmental Operations Dashboard for:
**Ramaiah Institute for Advanced Skills & Technology (RIASAT)**

---

## 🌟 Core Flow
`USER LOGIN → DEPARTMENT FORM → POSTGRESQL DATABASE → EXECUTIVE DASHBOARD`

1. **Role-Based Login**: Each user signs in and is automatically routed to their dedicated dashboard based on role and department assignment.
2. **PostgreSQL as Single Source of Truth**: All overview stats, workstreams, talent acquisition pipelines, and audit logs persist directly in PostgreSQL (Neon PostgreSQL compatible).
3. **Executive Control Tower**: Consolidated leadership view displaying the 5 top KPIs, 8 department operational cards (with `UPDATE REQUIRED` staleness warnings), and the live Management Attention escalation table.
4. **Strict Server-Enforced Security**: Department heads can only edit their assigned department; cross-department edits and unauthorized views return `403 Forbidden`. Executives are strictly read-only. Admins have complete user and department management rights.

---

## 🏛 The 8 Strategic Departments
1. **Semicon** (`SEMICON`)
2. **Aerospace & Defence** (`AERO_DEFENCE`)
3. **Space** (`SPACE`)
4. **Cybersecurity** (`CYBER`)
5. **MedTech** (`MEDTECH`)
6. **Advanced Manufacturing** (`ADV_MFG`)
7. **HR & Recruitment** (`HR_REC`)
8. **Communications** (`COMM`)

*Note: New departments can also be dynamically added by the Administrator at runtime without rebuilding.*

---

## 👥 Seed Test Accounts & Credentials

| Role | Name | Email | Password | Access |
|---|---|---|---|---|
| **Admin** | System Administrator | `admin@riasat.ac.in` | `Admin@123` | Full access, user & dept management |
| **Executive** | Vice Chairman Office | `executive@riasat.ac.in` | `Exec@123` | Executive Control Tower (Read-Only) |
| **Dept Head** | Dr. Arun Kumar | `semicon.head@riasat.ac.in` | `Semicon@123` | Semicon Department Dashboard & Form |
| **Dept Head** | Wg Cdr R. Sharma | `aero.head@riasat.ac.in` | `Aero@123` | Aerospace & Defence Dashboard & Form |
| **Dept Head** | Dr. P. Sundaram | `space.head@riasat.ac.in` | `Space@123` | Space Technology Dashboard & Form |
| **Dept Head** | Col. K. Menon | `cyber.head@riasat.ac.in` | `Cyber@123` | Cybersecurity Systems Dashboard & Form |
| **Dept Head** | Dr. Neha Varma | `medtech.head@riasat.ac.in` | `MedTech@123` | MedTech & Healthcare Dashboard & Form |
| **Dept Head** | Prof. Rajesh Iyer | `mfg.head@riasat.ac.in` | `Mfg@123` | Advanced Manufacturing Dashboard & Form |
| **Dept Head** | Sumanth Rao | `hr.head@riasat.ac.in` | `Hr@123` | HR & Recruitment Tracker |
| **Dept Head** | Ananya Sen | `comm.head@riasat.ac.in` | `Comm@123` | Communications Dashboard & Form |

*(The login page includes convenient 1-click test buttons to auto-populate any of these credentials for quick review.)*

---

## 🛠 Technology Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: PostgreSQL (Neon PostgreSQL ready + local persistent engine)
- **Security**: HttpOnly JWT Session Cookies, bcrypt password hashing, server-side access control
- **Audit Logging**: Automatic ledger recording all logins, edits, and status changes with timestamps

---

## 🚀 Running the Application

### 1. Start the Server
```bash
npm start
```
The application will be live at `http://localhost:3000`.

### 2. Configure Neon PostgreSQL (Optional)
To point to your cloud Neon PostgreSQL instance, configure `.env`:
```env
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/riasat?sslmode=require"
```
If not specified, the system automatically uses the embedded persistent PostgreSQL engine in `.data/riasat_pg`.

### 3. Run Acceptance Test Suite
Execute the 12 acceptance tests from Section 35:
```bash
node scripts/run-acceptance-tests.mjs
```
Expected output:
```text
SUMMARY: 12 OF 12 ACCEPTANCE TESTS PASSED!
ALL 12 ACCEPTANCE CRITERIA VERIFIED AND VALIDATED 100%!
```
