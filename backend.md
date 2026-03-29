# Backend Architecture — Reimbursement Management System

> Complete backend API documentation built with **Node.js**, **Express.js**, **Prisma ORM**, and **PostgreSQL**. This document defines every API endpoint, the database schema, middleware, services, and business logic.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Database Schema (Prisma)](#database-schema-prisma)
- [Middleware](#middleware)
- [API Endpoints](#api-endpoints)
  - [Authentication](#1-authentication-apiauthc)
  - [Users](#2-users-apiusers)
  - [Expenses](#3-expenses-apiexpenses)
  - [Approvals](#4-approvals-apiapprovals)
  - [Approval Rules](#5-approval-rules-apiapproval-rules)
  - [Currency](#6-currency-apicurrency)
  - [Countries](#7-countries-apicountries)
- [Approval Workflow Engine](#approval-workflow-engine)
- [Email Service](#email-service)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)

---

## Tech Stack

| Component       | Technology                                |
| --------------- | ----------------------------------------- |
| Runtime         | Node.js v18+                             |
| Framework       | Express.js                                |
| ORM             | Prisma                                    |
| Database        | PostgreSQL 14+                            |
| Authentication  | JWT (jsonwebtoken) + bcryptjs             |
| Email           | Nodemailer                                |
| Validation      | Joi                                       |
| File Upload     | Multer                                    |
| HTTP Client     | Axios (for external APIs)                 |
| CORS            | cors middleware                           |

---

## Directory Structure

```
server/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── migrations/                # Auto-generated migration files
│   └── seed.js                    # Database seed script
│
├── src/
│   ├── routes/                    # Express Route Definitions
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── userRoutes.js          # /api/users/*
│   │   ├── expenseRoutes.js       # /api/expenses/*
│   │   ├── approvalRoutes.js      # /api/approvals/*
│   │   ├── approvalRuleRoutes.js  # /api/approval-rules/*
│   │   ├── currencyRoutes.js      # /api/currency/*
│   │   └── countryRoutes.js       # /api/countries/*
│   │
│   ├── controllers/               # Request Handlers (Business Logic)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── expenseController.js
│   │   ├── approvalController.js
│   │   ├── approvalRuleController.js
│   │   ├── currencyController.js
│   │   └── countryController.js
│   │
│   ├── middleware/                 # Express Middleware
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── roleMiddleware.js      # Role-based access control
│   │   ├── errorHandler.js        # Global error handler
│   │   └── uploadMiddleware.js    # Multer file upload config
│   │
│   ├── services/                  # Business Services & External APIs
│   │   ├── approvalEngine.js      # Core approval workflow logic
│   │   ├── emailService.js        # Nodemailer wrapper
│   │   ├── currencyService.js     # ExchangeRate API integration
│   │   └── countryService.js      # REST Countries API integration
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── passwordGenerator.js   # Random password generation
│   │   ├── tokenUtils.js          # JWT sign/verify helpers
│   │   └── responseHelper.js      # Standardized API response format
│   │
│   ├── validators/                # Request Body Validation (Joi)
│   │   ├── authValidators.js
│   │   ├── userValidators.js
│   │   ├── expenseValidators.js
│   │   ├── approvalValidators.js
│   │   └── approvalRuleValidators.js
│   │
│   └── app.js                     # Express app setup & middleware binding
│
├── uploads/                       # Receipt file uploads directory
├── package.json
├── .env                           # Environment variables
└── .env.example                   # ENV template
```

---

## Database Schema (Prisma)

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========================
// ENUMS
// ========================

enum Role {
  ADMIN
  MANAGER
  EMPLOYEE
}

enum ExpenseStatus {
  DRAFT
  SUBMITTED
  WAITING_APPROVAL
  APPROVED
  REJECTED
}

enum ApprovalAction {
  APPROVED
  REJECTED
  PENDING
}

// ========================
// MODELS
// ========================

model Company {
  id            String    @id @default(uuid())
  name          String
  country       String
  baseCurrency  String    // e.g., "INR", "USD", "EUR"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  users         User[]
  expenses      Expense[]
  approvalRules ApprovalRule[]
}

model User {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  email       String   @unique
  password    String   // bcrypt hashed
  role        Role     @default(EMPLOYEE)
  managerId   String?  // self-referencing FK

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company  @relation(fields: [companyId], references: [id])
  manager     User?    @relation("ManagerRelation", fields: [managerId], references: [id])
  subordinates User[]  @relation("ManagerRelation")

  expenses        Expense[]
  approvalLogs    ApprovalLog[]    @relation("ApproverLogs")
  approvalRules   ApprovalRule[]   @relation("RuleForUser")
  ruleApprovers   ApprovalRuleApprover[]

  @@index([companyId])
  @@index([managerId])
  @@index([email])
}

model Expense {
  id                String        @id @default(uuid())
  userId            String
  companyId         String
  description       String
  category          String        // "Food", "Travel", "Office", "Accommodation", "Miscellaneous"
  amount            Decimal       @db.Decimal(12, 2)
  currency          String        // Currency code of submitted amount (e.g., "USD")
  convertedAmount   Decimal?      @db.Decimal(12, 2)  // Amount in company's base currency
  expenseDate       DateTime
  paidBy            String        // Who paid for this expense
  remarks           String?
  status            ExpenseStatus @default(DRAFT)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user              User          @relation(fields: [userId], references: [id])
  company           Company       @relation(fields: [companyId], references: [id])
  attachments       ExpenseAttachment[]
  approvalLogs      ApprovalLog[]

  @@index([userId])
  @@index([companyId])
  @@index([status])
}

model ExpenseAttachment {
  id          String   @id @default(uuid())
  expenseId   String
  fileUrl     String
  fileName    String
  mimeType    String

  createdAt   DateTime @default(now())

  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@index([expenseId])
}

model ApprovalRule {
  id                     String   @id @default(uuid())
  companyId              String
  userId                 String   // The user this rule applies to
  description            String   // e.g., "Approval rule for miscellaneous expenses"
  managerId              String?  // Manager for this approval rule (dynamic dropdown)
  isManagerApprover      Boolean  @default(false)  // Route to manager first?
  isSequential           Boolean  @default(false)  // Sequential or parallel approval?
  minApprovalPercentage  Decimal  @default(100) @db.Decimal(5, 2)  // e.g., 60.00%

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  company     Company                @relation(fields: [companyId], references: [id])
  user        User                   @relation("RuleForUser", fields: [userId], references: [id])
  approvers   ApprovalRuleApprover[]

  @@index([companyId])
  @@index([userId])
}

model ApprovalRuleApprover {
  id              String   @id @default(uuid())
  approvalRuleId  String
  userId          String   // The approver user
  sequenceOrder   Int      // 1, 2, 3... (order in sequence)
  isRequired      Boolean  @default(false)  // Mandatory approver?

  createdAt       DateTime @default(now())

  approvalRule    ApprovalRule @relation(fields: [approvalRuleId], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [userId], references: [id])

  @@index([approvalRuleId])
  @@unique([approvalRuleId, sequenceOrder])
}

model ApprovalLog {
  id            String         @id @default(uuid())
  expenseId     String
  approverId    String
  action        ApprovalAction @default(PENDING)
  comments      String?
  sequenceOrder Int            // Which step in the approval chain

  actionAt      DateTime?      // null if PENDING
  createdAt     DateTime       @default(now())

  expense       Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  approver      User     @relation("ApproverLogs", fields: [approverId], references: [id])

  @@index([expenseId])
  @@index([approverId])
  @@unique([expenseId, approverId])
}
```

---

## Middleware

### 1. Auth Middleware (`middleware/authMiddleware.js`)
```
Purpose: Verify JWT token on protected routes
Flow:
  1. Extract token from Authorization header (Bearer <token>)
  2. Verify token using JWT_SECRET
  3. Decode payload → { userId, role, companyId }
  4. Fetch user from DB, attach to req.user
  5. If invalid/expired → 401 Unauthorized
```

### 2. Role Middleware (`middleware/roleMiddleware.js`)
```
Purpose: Restrict endpoints to specific roles
Usage: roleMiddleware("ADMIN") or roleMiddleware("ADMIN", "MANAGER")
Flow:
  1. Check req.user.role against allowed roles
  2. If not authorized → 403 Forbidden
```

### 3. Error Handler (`middleware/errorHandler.js`)
```
Purpose: Global error catcher
Response format:
  { success: false, message: "Error description", errors: [...] }
```

### 4. Upload Middleware (`middleware/uploadMiddleware.js`)
```
Purpose: Handle receipt file uploads via Multer
Config:
  - Storage: disk (uploads/ directory)
  - File types: image/jpeg, image/png, image/webp, application/pdf
  - Max size: 5MB
  - Field name: "receipt"
```

---

## API Endpoints

### Standard Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional validation errors
}

// List
{
  "success": true,
  "data": [ ... ],
  "count": 25,
  "message": "Fetched successfully"
}
```

---

### 1. Authentication (`/api/auth`)

#### `POST /api/auth/signup`
> Creates a new company + admin user. Only admin can signup.

**Access:** Public

**Request Body:**
```json
{
  "name": "John Admin",
  "email": "john@company.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "country": "India",
  "baseCurrency": "INR"
}
```

**Validation:**
- `name`: required, min 2 chars
- `email`: required, valid email, unique
- `password`: required, min 8 chars
- `confirmPassword`: must match password
- `country`: required
- `baseCurrency`: required, valid currency code

**Business Logic:**
1. Check if email already exists → 409 Conflict
2. Hash password with bcrypt (10 rounds)
3. Create Company record with country + baseCurrency
4. Create User record with role = `ADMIN`, linked to company
5. Sign JWT token with `{ userId, role, companyId }`
6. Return token + user data

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "name": "John Admin",
      "email": "john@company.com",
      "role": "ADMIN",
      "companyId": "uuid",
      "baseCurrency": "INR"
    }
  }
}
```

---

#### `POST /api/auth/login`
> Authenticates a user and returns JWT token.

**Access:** Public

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `email`: required, valid email
- `password`: required

**Business Logic:**
1. Find user by email → 404 if not found
2. Compare password with bcrypt → 401 if mismatch
3. Sign JWT token with `{ userId, role, companyId }`
4. Return token + user data (including company's baseCurrency)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "name": "John Admin",
      "email": "john@company.com",
      "role": "ADMIN",
      "companyId": "uuid",
      "baseCurrency": "INR",
      "managerId": null
    }
  }
}
```

---

#### `POST /api/auth/forgot-password`
> Generates a random password and sends it via email.

**Access:** Public

**Request Body:**
```json
{
  "email": "marc@gmail.com"
}
```

**Business Logic:**
1. Find user by email → 404 if not found
2. Generate random password (8 chars, alphanumeric + special)
3. Hash new password, update user record
4. Send email with new password via Nodemailer
5. Return success message

**Response (200):**
```json
{
  "success": true,
  "message": "A new password has been sent to your email."
}
```

---

#### `PUT /api/auth/change-password`
> Allows authenticated user to change their password.

**Access:** Authenticated (any role)

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456",
  "confirmNewPassword": "NewPass456"
}
```

**Business Logic:**
1. Verify current password matches
2. Hash new password
3. Update user record

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

---

### 2. Users (`/api/users`)

All endpoints require `ADMIN` role.

#### `GET /api/users`
> List all users in the admin's company.

**Access:** Admin only

**Query Params:**
| Param  | Type   | Default | Description                        |
| ------ | ------ | ------- | ---------------------------------- |
| role   | string | -       | Filter by role: MANAGER, EMPLOYEE  |
| search | string | -       | Search by name or email            |

**Business Logic:**
1. Fetch users where `companyId = req.user.companyId`
2. Apply optional filters (role, search)
3. Include manager relation for each user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "marc",
      "email": "marc@gmail.com",
      "role": "MANAGER",
      "managerId": "uuid",
      "manager": { "id": "uuid", "name": "sarah" },
      "createdAt": "2025-10-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

---

#### `POST /api/users`
> Create a new user in the company.

**Access:** Admin only

**Request Body:**
```json
{
  "name": "marc",
  "email": "marc@gmail.com",
  "role": "MANAGER",
  "managerId": "uuid-of-sarah"
}
```

**Validation:**
- `name`: required, min 2 chars
- `email`: required, valid email, unique
- `role`: required, one of `MANAGER`, `EMPLOYEE`
- `managerId`: optional, valid user uuid in same company

**Business Logic:**
1. Validate email uniqueness
2. Generate random password
3. Hash password
4. Create user record with companyId from admin's company
5. Do NOT auto-send password (admin clicks "Send Password" separately)
6. Return created user

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "marc",
    "email": "marc@gmail.com",
    "role": "MANAGER",
    "managerId": "uuid",
    "companyId": "uuid"
  }
}
```

---

#### `PUT /api/users/:id`
> Update user details (role, manager, name).

**Access:** Admin only

**Request Body:**
```json
{
  "name": "marc updated",
  "role": "EMPLOYEE",
  "managerId": "uuid-of-new-manager"
}
```

**Business Logic:**
1. Verify user belongs to admin's company
2. Update fields
3. Cannot change role to ADMIN

**Response (200):**
```json
{
  "success": true,
  "data": { ... updated user ... }
}
```

---

#### `DELETE /api/users/:id`
> Delete a user from the company.

**Access:** Admin only

**Business Logic:**
1. Verify user belongs to admin's company
2. Cannot delete self (admin)
3. Check for dependencies (expenses, approval rules)
4. Soft delete or hard delete based on dependencies

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully."
}
```

---

#### `POST /api/users/:id/send-password`
> Generate a new random password and email it to the user.

**Access:** Admin only

**Business Logic:**
1. Verify user belongs to admin's company
2. Generate random password (8 chars)
3. Hash and update user's password
4. Send email via Nodemailer with the plain-text password
5. Email template includes: company name, login URL, temp password

**Response (200):**
```json
{
  "success": true,
  "message": "Password sent to marc@gmail.com"
}
```

---

### 3. Expenses (`/api/expenses`)

#### `GET /api/expenses/my`
> Get all expenses for the current authenticated user.

**Access:** Employee, Manager

**Query Params:**
| Param    | Type   | Default | Description                              |
| -------- | ------ | ------- | ---------------------------------------- |
| status   | string | -       | Filter: DRAFT, SUBMITTED, WAITING_APPROVAL, APPROVED, REJECTED |
| category | string | -       | Filter by category                       |
| page     | int    | 1       | Pagination page number                   |
| limit    | int    | 20      | Items per page                           |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "description": "Restaurant bill",
      "category": "Food",
      "amount": 5000,
      "currency": "INR",
      "convertedAmount": 5000,
      "expenseDate": "2025-10-04",
      "paidBy": "Sarah",
      "remarks": "None",
      "status": "DRAFT",
      "user": { "id": "uuid", "name": "Sarah" },
      "createdAt": "2025-10-04T10:00:00Z"
    }
  ],
  "count": 15
}
```

---

#### `GET /api/expenses/all`
> Get all expenses in the company.

**Access:** Admin only

**Query Params:** Same as `/my` + `userId` filter

---

#### `GET /api/expenses/summary`
> Get aggregated expense summary for the current user.

**Access:** Employee

**Response (200):**
```json
{
  "success": true,
  "data": {
    "toSubmit": {
      "total": 5467,
      "count": 3
    },
    "waitingApproval": {
      "total": 33674,
      "count": 7
    },
    "approved": {
      "total": 500,
      "count": 2
    },
    "rejected": {
      "total": 1200,
      "count": 1
    }
  }
}
```

---

#### `GET /api/expenses/:id`
> Get single expense with full detail.

**Access:** Owner (Employee), Assigned Approver (Manager), Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "description": "Restaurant bill",
    "category": "Food",
    "amount": 567,
    "currency": "USD",
    "convertedAmount": 49896,
    "baseCurrency": "INR",
    "expenseDate": "2025-10-04",
    "paidBy": "Sarah",
    "remarks": "Business lunch",
    "status": "WAITING_APPROVAL",
    "user": { "id": "uuid", "name": "Sarah" },
    "attachments": [
      {
        "id": "uuid",
        "fileUrl": "/uploads/receipt-123.jpg",
        "fileName": "receipt.jpg",
        "mimeType": "image/jpeg"
      }
    ],
    "approvalLogs": [
      {
        "id": "uuid",
        "approver": { "id": "uuid", "name": "Sarah" },
        "action": "APPROVED",
        "comments": "Looks good",
        "sequenceOrder": 1,
        "actionAt": "2025-10-04T12:44:00Z"
      },
      {
        "id": "uuid",
        "approver": { "id": "uuid", "name": "John" },
        "action": "PENDING",
        "comments": null,
        "sequenceOrder": 2,
        "actionAt": null
      }
    ]
  }
}
```

---

#### `POST /api/expenses`
> Create a new expense (Draft status).

**Access:** Employee

**Request Body:**
```json
{
  "description": "Restaurant bill",
  "category": "Food",
  "amount": 567,
  "currency": "USD",
  "expenseDate": "2025-10-04",
  "paidBy": "Sarah",
  "remarks": "Business lunch"
}
```

**Validation:**
- `description`: required, min 3 chars
- `category`: required, one of predefined categories
- `amount`: required, positive number
- `currency`: required, valid 3-letter currency code
- `expenseDate`: required, valid date, not in future
- `paidBy`: required

**Business Logic:**
1. Create expense with `status = DRAFT`
2. Fetch exchange rate for the submitted currency
3. Calculate `convertedAmount` using company's `baseCurrency`
4. Store both `amount` (original) and `convertedAmount` (in base currency)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "description": "Restaurant bill",
    "status": "DRAFT",
    "amount": 567,
    "currency": "USD",
    "convertedAmount": 49896,
    ...
  }
}
```

---

#### `PUT /api/expenses/:id`
> Update an expense (only if status is DRAFT).

**Access:** Owner (Employee)

**Business Logic:**
1. Verify expense belongs to user
2. Verify status is `DRAFT` → 400 if not
3. Recalculate convertedAmount if amount/currency changed
4. Update fields

**Response (200):** Updated expense object

---

#### `POST /api/expenses/:id/submit`
> Submit a draft expense for approval.

**Access:** Owner (Employee)

**Business Logic:**
1. Verify expense belongs to user
2. Verify status is `DRAFT` → 400 if not
3. Update status to `SUBMITTED`
4. Trigger Approval Workflow Engine:
   a. Find applicable `ApprovalRule` for this user
   b. Create `ApprovalLog` entries for each approver (status: PENDING)
   c. If `isManagerApprover` → create log for manager at sequenceOrder 0
   d. If `isSequential` → only the first approver gets notified
   e. If parallel → all approvers get notified
5. Update expense status to `WAITING_APPROVAL`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "WAITING_APPROVAL",
    ...
  },
  "message": "Expense submitted for approval."
}
```

---

#### `POST /api/expenses/:id/attachments`
> Upload a receipt attachment for an expense.

**Access:** Owner (Employee)

**Request:** `multipart/form-data` with field `receipt` (image file)

**Business Logic:**
1. Verify expense belongs to user
2. Verify status is `DRAFT`
3. Save file to `uploads/` directory via Multer
4. Create `ExpenseAttachment` record

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileUrl": "/uploads/receipt-abc123.jpg",
    "fileName": "receipt.jpg",
    "mimeType": "image/jpeg"
  }
}
```

---

#### `DELETE /api/expenses/:id`
> Delete a draft expense.

**Access:** Owner (Employee)

**Business Logic:**
1. Verify expense belongs to user
2. Verify status is `DRAFT` → 400 if not
3. Delete expense and attachments (cascade)

---

### 4. Approvals (`/api/approvals`)

#### `GET /api/approvals/pending`
> Get all expenses pending the current user's approval.

**Access:** Manager, Admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "expense": {
        "id": "expense-uuid",
        "description": "Restaurant bill",
        "category": "Food",
        "amount": 567,
        "currency": "USD",
        "convertedAmount": 49896,
        "baseCurrency": "INR",
        "status": "WAITING_APPROVAL",
        "user": { "id": "uuid", "name": "Sarah" }
      },
      "sequenceOrder": 1,
      "action": "PENDING"
    }
  ],
  "count": 5
}
```

**Business Logic:**
1. Find all ApprovalLog entries where `approverId = req.user.id` AND `action = PENDING`
2. For sequential rules: only return logs where it's this approver's turn
   - Check if all previous sequence approvers have acted
3. Include expense details with converted amounts

---

#### `POST /api/approvals/:expenseId/approve`
> Approve an expense.

**Access:** Assigned Approver (Manager/Admin)

**Request Body:**
```json
{
  "comments": "Looks good, approved."
}
```

**Business Logic:**
1. Find ApprovalLog for this expense + current user → 404 if not found
2. Verify action is `PENDING` → 400 if already acted
3. Update ApprovalLog: `action = APPROVED`, `actionAt = now()`, `comments`
4. **Trigger Approval Engine evaluation:**
   - If sequential → Check if next approver exists → Create notification
   - Evaluate percentage rule: `approvedCount / totalApprovers >= minApprovalPercentage`
   - If threshold met → Update expense status to `APPROVED`
   - If specific required approver approved → Check auto-approve rules

**Response (200):**
```json
{
  "success": true,
  "data": {
    "expenseId": "uuid",
    "action": "APPROVED",
    "expenseStatus": "WAITING_APPROVAL",  // or "APPROVED" if final
    "message": "Approval recorded. Waiting for remaining approvers."
  }
}
```

---

#### `POST /api/approvals/:expenseId/reject`
> Reject an expense.

**Access:** Assigned Approver (Manager/Admin)

**Request Body:**
```json
{
  "comments": "Receipt unclear, please resubmit."
}
```

**Business Logic:**
1. Find ApprovalLog for this expense + current user
2. Verify action is `PENDING`
3. Update ApprovalLog: `action = REJECTED`, `actionAt = now()`, `comments`
4. **Check if approver is "Required":**
   - If `isRequired = true` → Auto-reject entire expense: set `expense.status = REJECTED`
   - If `isRequired = false` → Continue evaluation:
     - Check if percentage threshold can still be met
     - If impossible to meet → Reject expense
     - Otherwise → Continue with remaining approvers

**Response (200):**
```json
{
  "success": true,
  "data": {
    "expenseId": "uuid",
    "action": "REJECTED",
    "expenseStatus": "REJECTED",
    "message": "Required approver rejected. Expense auto-rejected."
  }
}
```

---

#### `GET /api/approvals/:expenseId/logs`
> Get the full approval log history for an expense.

**Access:** Owner (Employee), Assigned Approvers, Admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "approver": { "id": "uuid", "name": "Sarah" },
      "action": "APPROVED",
      "comments": "Looks good",
      "sequenceOrder": 1,
      "actionAt": "2025-10-04T12:44:00Z"
    },
    {
      "id": "uuid",
      "approver": { "id": "uuid", "name": "John" },
      "action": "PENDING",
      "comments": null,
      "sequenceOrder": 2,
      "actionAt": null
    }
  ]
}
```

---

### 5. Approval Rules (`/api/approval-rules`)

All endpoints require `ADMIN` role.

#### `GET /api/approval-rules`
> List all approval rules for the company.

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": { "id": "uuid", "name": "marc" },
      "description": "Approval rule for miscellaneous expenses",
      "managerId": "uuid",
      "manager": { "id": "uuid", "name": "sarah" },
      "isManagerApprover": false,
      "isSequential": true,
      "minApprovalPercentage": 60,
      "approvers": [
        { "id": "uuid", "user": { "id": "uuid", "name": "John" }, "sequenceOrder": 1, "isRequired": true },
        { "id": "uuid", "user": { "id": "uuid", "name": "Mitchell" }, "sequenceOrder": 2, "isRequired": false },
        { "id": "uuid", "user": { "id": "uuid", "name": "Andreas" }, "sequenceOrder": 3, "isRequired": false }
      ]
    }
  ]
}
```

---

#### `GET /api/approval-rules/:id`
> Get a single approval rule with full approver details.

**Access:** Admin only

---

#### `POST /api/approval-rules`
> Create a new approval rule.

**Access:** Admin only

**Request Body:**
```json
{
  "userId": "uuid-of-marc",
  "description": "Approval rule for miscellaneous expenses",
  "managerId": "uuid-of-sarah",
  "isManagerApprover": false,
  "isSequential": true,
  "minApprovalPercentage": 60,
  "approvers": [
    { "userId": "uuid-of-john", "sequenceOrder": 1, "isRequired": true },
    { "userId": "uuid-of-mitchell", "sequenceOrder": 2, "isRequired": false },
    { "userId": "uuid-of-andreas", "sequenceOrder": 3, "isRequired": false }
  ]
}
```

**Validation:**
- `userId`: required, valid user in company
- `description`: required, min 5 chars
- `managerId`: optional but recommended, valid user in company
- `isManagerApprover`: boolean
- `isSequential`: boolean
- `minApprovalPercentage`: number, 0–100
- `approvers`: array of at least 1 approver
  - Each: `userId` required, `sequenceOrder` required (unique), `isRequired` boolean

**Business Logic:**
1. Validate all user IDs belong to the same company
2. Create `ApprovalRule` record
3. Create `ApprovalRuleApprover` records for each approver
4. If `managerId` is provided but differs from user's current manager, store it (admin override)

**Response (201):** Created approval rule with approvers

---

#### `PUT /api/approval-rules/:id`
> Update an existing approval rule.

**Access:** Admin only

**Business Logic:**
1. Delete existing approvers → Re-create with new list (replace strategy)
2. Update rule fields

---

#### `DELETE /api/approval-rules/:id`
> Delete an approval rule.

**Access:** Admin only

**Business Logic:**
1. Cascade delete `ApprovalRuleApprover` records
2. Delete `ApprovalRule` record

---

### 6. Currency (`/api/currency`)

#### `GET /api/currency/convert`
> Convert an amount from one currency to another.

**Access:** Authenticated (any role)

**Query Params:**
| Param | Type   | Required | Description              |
| ----- | ------ | -------- | ------------------------ |
| from  | string | Yes      | Source currency code     |
| to    | string | Yes      | Target currency code     |
| amount| number | Yes      | Amount to convert        |

**Business Logic:**
1. Fetch rates from ExchangeRate API: `GET https://api.exchangerate-api.com/v4/latest/{from}`
2. Calculate: `convertedAmount = amount × rates[to]`
3. Cache rates for 1 hour (memory or Redis)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "INR",
    "amount": 567,
    "convertedAmount": 49896.24,
    "rate": 88.0004,
    "timestamp": "2025-10-04T12:00:00Z"
  }
}
```

---

### 7. Countries (`/api/countries`)

#### `GET /api/countries`
> Fetch all countries with their currencies (proxied from REST Countries API).

**Access:** Public (used in signup form)

**Business Logic:**
1. Fetch from `https://restcountries.com/v3.1/all?fields=name,currencies`
2. Transform response to simplified format
3. Cache result for 24 hours

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "India",
      "currency": {
        "code": "INR",
        "name": "Indian rupee",
        "symbol": "₹"
      }
    },
    {
      "name": "United States",
      "currency": {
        "code": "USD",
        "name": "United States dollar",
        "symbol": "$"
      }
    }
  ]
}
```

---

## Approval Workflow Engine

### `services/approvalEngine.js`

This is the core business logic for processing approvals.

```mermaid
flowchart TD
    Submit([Expense Submitted]) --> FindRule[Find ApprovalRule for User]
    FindRule --> HasRule{Rule Found?}
    HasRule -- No --> AutoApprove[Auto-Approve - No rule configured]
    HasRule -- Yes --> CreateLogs[Create ApprovalLog entries for each approver]
    
    CreateLogs --> CheckManagerFirst{isManagerApprover?}
    CheckManagerFirst -- Yes --> AddManager[Add Manager as Approver #0]
    CheckManagerFirst -- No --> CheckSequential
    AddManager --> CheckSequential{isSequential?}
    
    CheckSequential -- Yes --> NotifyFirst[Notify Only First Approver in Sequence]
    CheckSequential -- No --> NotifyAll[Notify All Approvers Simultaneously]
    
    NotifyFirst --> WaitAction1[Wait for Approver Action]
    NotifyAll --> WaitAction2[Wait for Any Approver Action]
    
    WaitAction1 --> ProcessAction
    WaitAction2 --> ProcessAction
    
    ProcessAction[Process Approver Action] --> IsReject{Action = REJECT?}
    IsReject -- Yes --> IsRequired{Is Required Approver?}
    IsRequired -- Yes --> AutoReject[❌ Auto-Reject Expense]
    IsRequired -- No --> EvalContinue[Continue Evaluation]
    
    IsReject -- No --> EvalContinue
    
    EvalContinue --> CalcPercentage[Calculate Approval Percentage]
    CalcPercentage --> MeetsThreshold{">= minApprovalPercentage?"}
    MeetsThreshold -- Yes --> FinalApprove[✅ Approve Expense]
    MeetsThreshold -- No --> CanStillMeet{Can threshold still be met?}
    CanStillMeet -- Yes --> IsSeq{Sequential?}
    IsSeq -- Yes --> NotifyNext[Notify Next in Sequence]
    IsSeq -- No --> WaitMore[Wait for More Responses]
    CanStillMeet -- No --> FinalReject[❌ Reject Expense]
```

### Key Functions:

```javascript
// services/approvalEngine.js

/**
 * triggerApprovalWorkflow(expenseId)
 * Called when employee submits an expense.
 * 1. Find applicable approval rule
 * 2. Create approval log entries
 * 3. Notify first/all approvers
 */

/**
 * processApprovalAction(expenseId, approverId, action, comments)
 * Called when an approver approves/rejects.
 * 1. Update the approval log
 * 2. Check if required approver rejected → auto-reject
 * 3. Calculate current approval percentage
 * 4. If sequential → notify next approver
 * 5. Check if final decision can be made
 */

/**
 * evaluateApprovalStatus(expenseId)
 * Evaluates if the expense should be approved/rejected.
 * Checks: percentage rule, required approver rule, remaining approvers.
 * Returns: "APPROVED" | "REJECTED" | "PENDING"
 */

/**
 * calculateApprovalPercentage(expenseId)
 * Returns the current % of approvers who approved.
 * Formula: (approvedCount / totalApprovers) * 100
 */

/**
 * getNextApproverInSequence(expenseId)
 * For sequential rules, finds the next approver who hasn't acted yet.
 * Returns the next approver or null if all have acted.
 */
```

---

## Email Service

### `services/emailService.js`

Uses Nodemailer to send transactional emails.

**Email Templates:**

| Template                | Trigger                         | Content                                          |
| ----------------------- | ------------------------------- | ------------------------------------------------ |
| Welcome / Password      | Admin creates user              | Company name, login URL, temporary password      |
| Forgot Password         | User requests password reset    | New random password                              |
| Approval Request        | Expense submitted (for approver)| Expense details, link to approve/reject          |
| Approval Notification   | Approver acts on expense        | Approved/Rejected status, approver name, time    |

```javascript
// services/emailService.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordEmail(to, name, password, companyName) { ... }
async function sendForgotPasswordEmail(to, name, newPassword) { ... }
async function sendApprovalRequestEmail(to, approverName, expense) { ... }
async function sendApprovalNotificationEmail(to, expense, action, approverName) { ... }
```

---

## Error Handling

### HTTP Status Codes Used

| Code | Usage                                                    |
| ---- | -------------------------------------------------------- |
| 200  | Successful GET, PUT, action                              |
| 201  | Successful POST (resource created)                       |
| 400  | Bad request / Validation error / Invalid state transition|
| 401  | Unauthorized (invalid/missing JWT)                       |
| 403  | Forbidden (insufficient role permissions)                |
| 404  | Resource not found                                       |
| 409  | Conflict (duplicate email, etc.)                         |
| 500  | Internal server error                                    |

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" },
    { "field": "amount", "message": "Amount must be positive" }
  ]
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reimbursement_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# SMTP (Email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@reimbursement.com"

# External APIs
COUNTRIES_API_URL="https://restcountries.com/v3.1/all?fields=name,currencies"
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Rate Cache
EXCHANGE_RATE_CACHE_TTL=3600  # 1 hour in seconds
```
