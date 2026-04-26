# Attendance SaaS Backend

## Setup

1. Install packages:
```bash
npm install
```

2. Create `.env` from `.env.example`.

3. Run `sql/schema.sql` in Supabase SQL Editor.

4. Start:
```bash
npm run dev
```

## Main flow

1. Owner registers: `POST /api/owner/register-owner`
2. Owner logs in: `POST /api/auth/login`
3. Owner creates organization + HR: `POST /api/owner/organizations`
4. HR logs in.
5. HR creates employee: `POST /api/employees`
6. Employee logs in using email or employee_code.
7. Employee marks check-in/check-out.
