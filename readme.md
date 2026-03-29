# Reimbursement Management System

> A full-stack expense reimbursement platform with multi-level approval workflows, OCR receipt scanning, real-time currency conversion, and role-based access control.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Core Modules](#core-modules)
- [User Roles & Permissions](#user-roles--permissions)
- [Application Flow](#application-flow)
- [Data Model (ERD)](#data-model-erd)
- [Expense Lifecycle](#expense-lifecycle)
- [Approval Workflow Engine](#approval-workflow-engine)
- [Currency Conversion](#currency-conversion)
- [OCR Receipt Processing](#ocr-receipt-processing)
- [External APIs](#external-apis)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)

---

## Overview

Companies often struggle with manual expense reimbursement processes that are time-consuming, error-prone, and lack transparency. This system solves that by providing:

- **Automated approval workflows** with configurable multi-level chains
- **OCR-powered receipt scanning** that auto-populates expense fields
- **Real-time currency conversion** for global teams
- **Flexible approval rules** — percentage-based, specific-approver, or hybrid
- **Role-based dashboards** for Admins, Managers, and Employees

---

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| **Frontend** | React.js (JavaScript), React Router     |
| **Backend**  | Node.js, Express.js                     |
| **Database** | PostgreSQL                              |
| **ORM**      | Prisma                                  |
| **OCR**      | Tesseract.js (in-built, no external API)|
| **Auth**     | JWT (JSON Web Tokens) + bcrypt          |
| **Email**    | Nodemailer                              |
| **APIs**     | REST Countries API, ExchangeRate API    |

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Frontend (React.js)"]
        UI[React Components]
        Router[React Router]
        State[Context API / State]
        OCR_FE[Tesseract.js OCR Worker]
    end

    subgraph Server["Backend (Node.js + Express)"]
        API[REST API Layer]
        Auth[Auth Middleware - JWT]
        RBAC[Role-Based Access Control]
        ApprovalEngine[Approval Workflow Engine]
        CurrencyService[Currency Conversion Service]
        EmailService[Email Service - Nodemailer]
    end

    subgraph Database["PostgreSQL"]
        Prisma[Prisma ORM]
        DB[(PostgreSQL DB)]
    end

    subgraph External["External Services"]
        CountryAPI[REST Countries API]
        ExchangeAPI[ExchangeRate API]
        SMTP[SMTP Server]
    end

    UI --> Router
    Router --> State
    State --> API
    OCR_FE --> API
    API --> Auth
    Auth --> RBAC
    RBAC --> ApprovalEngine
    RBAC --> CurrencyService
    CurrencyService --> ExchangeAPI
    API --> Prisma
    Prisma --> DB
    EmailService --> SMTP
    API --> EmailService
    API --> CountryAPI
```

---

## Core Modules

### 1. Authentication & User Management
- Admin signup creates a new **Company** with the selected country's base currency
- Admin creates Employees & Managers, assigns roles, defines manager relationships
- Password sent via email (randomly generated); user can change later
- Forgot password flow via email reset
- 1 Admin per company (auto-created on signup)

### 2. Expense Management
- Employees create, edit (draft), and submit expense claims
- Expenses support: Amount, Currency, Category, Description, Date, Paid By, Remarks
- OCR-based receipt upload auto-fills expense fields
- Expense states: `Draft → Submitted → Waiting Approval → Approved / Rejected`
- Once submitted, expense becomes **read-only** for the employee

### 3. Approval Workflow Engine
- Admin configures **Approval Rules** per user/category
- Supports **sequential** and **parallel** approver chains
- "Is Manager Approver?" checkbox routes to manager first
- "Required" flag per approver — if a required approver rejects, the expense is auto-rejected
- **Approvers Sequence** toggle: sequential (one-by-one) or parallel (all at once)
- **Minimum Approval Percentage**: e.g., 60% approvers must approve

### 4. Currency Conversion
- Employees can submit expenses in **any currency**
- Manager's dashboard shows amounts auto-converted to company's **base currency**
- Real-time conversion using ExchangeRate API

### 5. OCR Receipt Processing
- Client-side OCR using Tesseract.js
- Auto-extracts: amount, date, description, vendor name, category
- Supports image upload and camera capture

---

## User Roles & Permissions

```mermaid
graph LR
    subgraph Admin
        A1[Create Company - auto on signup]
        A2[Manage Users]
        A3[Set Roles]
        A4[Configure Approval Rules]
        A5[View All Expenses]
        A6[Override Approvals]
    end

    subgraph Manager
        M1[Approve/Reject Expenses]
        M2[View Team Expenses]
        M3["View amounts in company's currency"]
        M4[Escalate as per rules]
    end

    subgraph Employee
        E1[Submit Expenses]
        E2[View Own Expenses]
        E3[Check Approval Status]
        E4[Upload Receipts - OCR]
    end
```

| Permission                      | Admin | Manager | Employee |
| ------------------------------- | :---: | :-----: | :------: |
| Create company (auto on signup) |  ✅   |   ❌    |    ❌    |
| Manage users & roles            |  ✅   |   ❌    |    ❌    |
| Configure approval rules        |  ✅   |   ❌    |    ❌    |
| View all expenses               |  ✅   |   ❌    |    ❌    |
| Override approvals              |  ✅   |   ❌    |    ❌    |
| Approve/Reject expenses         |  ❌   |   ✅    |    ❌    |
| View team expenses              |  ❌   |   ✅    |    ❌    |
| Submit expenses                 |  ❌   |   ❌    |    ✅    |
| View own expenses               |  ❌   |   ❌    |    ✅    |
| Upload receipts (OCR)           |  ❌   |   ❌    |    ✅    |

---

## Application Flow

### Complete User Journey

```mermaid
flowchart TD
    Start([User visits app]) --> AuthCheck{Authenticated?}
    AuthCheck -- No --> LoginPage[Login Page]
    AuthCheck -- Yes --> RoleCheck{User Role?}

    LoginPage --> HasAccount{Has account?}
    HasAccount -- Yes --> Login[Login with Email/Password]
    HasAccount -- No --> Signup[Admin Signup]
    
    Signup --> SelectCountry[Select Country → Sets Base Currency]
    SelectCountry --> CreateCompany[Auto-Create Company + Admin User]
    CreateCompany --> AdminDash

    Login --> ForgotPwd{Forgot Password?}
    ForgotPwd -- Yes --> SendEmail[Send Random Password via Email]
    SendEmail --> Login
    ForgotPwd -- No --> Authenticate[JWT Authentication]
    Authenticate --> RoleCheck

    RoleCheck -- Admin --> AdminDash[Admin Dashboard]
    RoleCheck -- Manager --> ManagerDash[Manager Dashboard]
    RoleCheck -- Employee --> EmpDash[Employee Dashboard]

    AdminDash --> ManageUsers[User Management Table]
    AdminDash --> ApprovalRules[Approval Rules Config]
    AdminDash --> ViewAllExpenses[View All Expenses]

    ManageUsers --> CreateUser[Create User: Name, Role, Manager, Email]
    CreateUser --> SendPwd[Send Password via Email]

    ApprovalRules --> ConfigRule[Configure: User, Manager, Approvers, Sequence, % Threshold]

    EmpDash --> ViewExpenses[View My Expenses]
    EmpDash --> NewExpense{New Expense}
    NewExpense -- Upload Receipt --> OCR[OCR Extract Fields]
    NewExpense -- Manual --> FillForm[Fill Expense Form]
    OCR --> FillForm
    FillForm --> SaveDraft[Save as Draft]
    SaveDraft --> SubmitExpense[Submit Expense]
    SubmitExpense --> ReadOnly[Expense becomes Read-Only]
    ReadOnly --> TriggerApproval[Trigger Approval Workflow]

    ManagerDash --> ReviewQueue[Approvals to Review]
    ReviewQueue --> ViewExpenseDetail[View Expense Detail with Converted Amount]
    ViewExpenseDetail --> ApproveReject{Approve or Reject?}
    ApproveReject -- Approve --> CheckNext{More Approvers?}
    ApproveReject -- Reject --> CheckRequired{Required Approver?}
    CheckRequired -- Yes --> AutoReject[Auto-Reject Expense]
    CheckRequired -- No --> EvalPercentage[Evaluate Percentage Rule]
    CheckNext -- Yes --> NextApprover[Route to Next Approver]
    CheckNext -- No --> EvalPercentage
    EvalPercentage --> FinalStatus{Meets Threshold?}
    FinalStatus -- Yes --> Approved[✅ Expense Approved]
    FinalStatus -- No --> Rejected[❌ Expense Rejected]
    NextApprover --> ReviewQueue
```

### Approval Workflow Decision Tree

```mermaid
flowchart TD
    ExpenseSubmitted([Expense Submitted]) --> IsManagerApprover{Is Manager an Approver?}
    
    IsManagerApprover -- Yes --> RouteToManager[Route to Employee's Manager First]
    IsManagerApprover -- No --> CheckSequence
    
    RouteToManager --> ManagerAction{Manager Decision}
    ManagerAction -- Approve --> CheckSequence{Sequential Approvers?}
    ManagerAction -- Reject --> IsManagerRequired{Is Manager Required?}
    IsManagerRequired -- Yes --> AutoReject[❌ Auto-Reject]
    IsManagerRequired -- No --> ContinueEval[Continue with Other Approvers]

    CheckSequence -- Yes --> Sequential[Send to Approver 1]
    CheckSequence -- No --> Parallel[Send to ALL Approvers Simultaneously]

    Sequential --> ApproverAction{Approver Action}
    ApproverAction -- Approve --> MoreApprovers{More in Sequence?}
    ApproverAction -- Reject --> IsRequired{Is Required Approver?}
    IsRequired -- Yes --> AutoReject2[❌ Auto-Reject]
    IsRequired -- No --> MoreApprovers
    MoreApprovers -- Yes --> NextInSeq[Send to Next Approver in Sequence]
    NextInSeq --> ApproverAction
    MoreApprovers -- No --> EvalRules

    Parallel --> CollectResponses[Collect All Responses]
    CollectResponses --> EvalRules

    ContinueEval --> EvalRules

    EvalRules{Evaluate Approval Rules}
    EvalRules --> PercentageCheck{Min % Met?}
    PercentageCheck -- Yes --> Approved[✅ Approved]
    PercentageCheck -- No --> SpecificCheck{Specific Approver Rule?}
    SpecificCheck -- Yes --> Approved
    SpecificCheck -- No --> Rejected[❌ Rejected]
```

---

## Data Model (ERD)

```mermaid
erDiagram
    COMPANY ||--o{ USER : has
    COMPANY {
        uuid id PK
        string name
        string country
        string baseCurrency
        timestamp createdAt
        timestamp updatedAt
    }

    USER ||--o{ EXPENSE : submits
    USER ||--o{ APPROVAL_LOG : reviews
    USER {
        uuid id PK
        uuid companyId FK
        string name
        string email
        string password
        enum role "ADMIN | MANAGER | EMPLOYEE"
        uuid managerId FK "nullable - self-ref"
        timestamp createdAt
        timestamp updatedAt
    }

    EXPENSE ||--o{ APPROVAL_LOG : has
    EXPENSE ||--o{ EXPENSE_ATTACHMENT : has
    EXPENSE {
        uuid id PK
        uuid userId FK
        uuid companyId FK
        string description
        string category
        decimal amount
        string currency
        decimal convertedAmount "in company base currency"
        date expenseDate
        string paidBy
        string remarks
        enum status "DRAFT | SUBMITTED | WAITING_APPROVAL | APPROVED | REJECTED"
        timestamp createdAt
        timestamp updatedAt
    }

    EXPENSE_ATTACHMENT {
        uuid id PK
        uuid expenseId FK
        string fileUrl
        string fileName
        string mimeType
        timestamp createdAt
    }

    APPROVAL_RULE ||--o{ APPROVAL_RULE_APPROVER : has
    APPROVAL_RULE {
        uuid id PK
        uuid companyId FK
        uuid userId FK "rule applies to this user"
        string description
        uuid managerId FK "dynamic dropdown"
        boolean isManagerApprover "default false"
        boolean isSequential "approvers sequence checkbox"
        decimal minApprovalPercentage "e.g. 60"
        timestamp createdAt
        timestamp updatedAt
    }

    APPROVAL_RULE_APPROVER {
        uuid id PK
        uuid approvalRuleId FK
        uuid userId FK "the approver"
        int sequenceOrder "1, 2, 3..."
        boolean isRequired "if true, rejection = auto-reject"
        timestamp createdAt
    }

    APPROVAL_LOG {
        uuid id PK
        uuid expenseId FK
        uuid approverId FK
        enum action "APPROVED | REJECTED | PENDING"
        string comments
        int sequenceOrder
        timestamp actionAt
    }

    USER ||--o{ APPROVAL_RULE : hasRuleFor
    COMPANY ||--o{ APPROVAL_RULE : configures
```

---

## Expense Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft : Employee creates expense
    Draft --> Draft : Edit / Save
    Draft --> Submitted : Employee clicks Submit
    Submitted --> WaitingApproval : Approval workflow triggered
    WaitingApproval --> Approved : All rules satisfied
    WaitingApproval --> Rejected : Required approver rejects OR threshold not met
    Approved --> [*]
    Rejected --> [*]

    note right of Draft
        Employee can edit.
        Submit button visible.
    end note

    note right of Submitted
        Expense becomes READ-ONLY.
        Submit button hidden.
    end note

    note right of WaitingApproval
        Approval log visible to employee.
        Shows who approved/rejected and when.
    end note
```

---

## Currency Conversion

```mermaid
sequenceDiagram
    participant E as Employee
    participant FE as Frontend
    participant BE as Backend
    participant ExAPI as ExchangeRate API

    E->>FE: Submit expense (567 USD)
    FE->>BE: POST /expenses {amount: 567, currency: "USD"}
    BE->>ExAPI: GET /v4/latest/USD
    ExAPI-->>BE: {rates: {INR: 83.12, ...}}
    BE->>BE: convertedAmount = 567 * 83.12 = 47,129.04 INR
    BE->>BE: Save expense with both amounts
    BE-->>FE: Expense created

    Note over E,FE: Manager views expense
    FE->>BE: GET /expenses/:id
    BE-->>FE: {amount: 567, currency: "USD", convertedAmount: 47129.04, baseCurrency: "INR"}
    FE->>FE: Display "567 $ (in INR) = ₹47,129.04"
```

---

## OCR Receipt Processing

```mermaid
sequenceDiagram
    participant E as Employee
    participant FE as Frontend
    participant TJS as Tesseract.js (Client-side)
    participant BE as Backend

    E->>FE: Upload receipt image / Camera capture
    FE->>TJS: Process image
    TJS->>TJS: Extract text from receipt
    TJS-->>FE: Raw text output
    FE->>FE: Parse text → Extract fields
    Note over FE: Extract: amount, date, vendor,<br/>category, description
    FE->>FE: Auto-populate expense form
    E->>FE: Review & adjust fields
    E->>FE: Save as Draft
    FE->>BE: POST /expenses (with extracted data + attachment)
```

**Extracted Fields from OCR:**
- **Amount** — Total amount on receipt
- **Date** — Date of transaction
- **Description** — Items or services listed
- **Vendor Name** — Restaurant/store name (used in description)
- **Category** — Auto-categorized (Food, Travel, Office Supplies, etc.)

---

## External APIs

| API                  | Endpoint                                                    | Usage                                    |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| **REST Countries**   | `https://restcountries.com/v3.1/all?fields=name,currencies` | Fetch all countries + their currencies   |
| **ExchangeRate API** | `https://api.exchangerate-api.com/v4/latest/{BASE}`         | Real-time currency conversion rates      |

---

## Project Structure

```
OdooxVIT/
├── client/                          # React.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page-level components
│   │   ├── context/                 # React Context (Auth, etc.)
│   │   ├── services/                # API service layer
│   │   ├── utils/                   # Helpers (OCR, currency, etc.)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── assets/                  # Static assets
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Prisma schema (all models)
│   │   ├── migrations/              # DB migrations
│   │   └── seed.js                  # Seed data
│   ├── src/
│   │   ├── routes/                  # Express route handlers
│   │   ├── controllers/             # Business logic controllers
│   │   ├── middleware/              # Auth, RBAC, error handling
│   │   ├── services/                # External API integrations
│   │   ├── utils/                   # Helpers (email, password, etc.)
│   │   ├── validators/              # Request validation (Joi/Zod)
│   │   └── app.js                   # Express app setup
│   ├── package.json
│   └── .env
│
├── images/                          # Mockup wireframes
├── information.md                   # Problem statement
├── readme.md                        # This file
├── frontend.md                      # Frontend architecture doc
└── backend.md                       # Backend architecture doc
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm / yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd OdooxVIT

# Backend setup
cd server
npm install
cp .env.example .env         # Configure DB URL, JWT secret, SMTP
npx prisma migrate dev       # Run migrations
npx prisma db seed            # Seed initial data
npm run dev                   # Start backend on port 5000

# Frontend setup (new terminal)
cd client
npm install
npm run dev                   # Start frontend on port 5173
```

### Environment Variables (server/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reimbursement_db"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
PORT=5000

# SMTP for email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"

# External APIs
COUNTRIES_API_URL="https://restcountries.com/v3.1/all?fields=name,currencies"
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest"
```

---

## Key Design Decisions

1. **Client-side OCR (Tesseract.js)** — No external OCR API needed; runs entirely in the browser. Reduces server load and latency.

2. **Prisma ORM** — Type-safe database access, auto-generated migrations, and excellent PostgreSQL support.

3. **JWT Authentication** — Stateless auth with role-based middleware for clean separation of concerns.

4. **Sequential vs Parallel Approvals** — The `isSequential` flag on approval rules determines whether approvers are notified one-by-one or all at once.

5. **Real-time Currency Conversion** — Amounts are stored in original currency AND converted to company base currency at the time of submission.

6. **Approval Percentage Rule** — Flexible threshold system allows companies to define what % of approvers must approve for the expense to be approved.
