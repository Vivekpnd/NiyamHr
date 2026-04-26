CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160),
  phone VARCHAR(40),
  address TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_name VARCHAR(80) NOT NULL DEFAULT 'trial',
  max_employees INT NOT NULL DEFAULT 50,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(40),
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('owner','hr_admin','employee')),
  employee_code VARCHAR(40) UNIQUE,
  department VARCHAR(100),
  designation VARCHAR(100),
  joining_date DATE,
  salary NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_reset_password BOOLEAN NOT NULL DEFAULT false,
  paid_leave_balance INT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_in_lat NUMERIC(10,7),
  check_in_lng NUMERIC(10,7),
  check_in_photo_url TEXT,
  check_out_time TIMESTAMPTZ,
  check_out_lat NUMERIC(10,7),
  check_out_lng NUMERIC(10,7),
  check_out_photo_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','leave','holiday','sunday')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(30) NOT NULL DEFAULT 'paid' CHECK (leave_type IN ('paid','unpaid','sick','casual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  hr_comment TEXT,
  approved_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holidays (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  holiday_date DATE NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'festival',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance(organization_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_org_status ON leave_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_holidays_org_date ON holidays(organization_id, holiday_date);
