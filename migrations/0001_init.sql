-- Shalal Beirut operations system: initial schema.
-- Money is stored in fils (1 KWD = 1000 fils). Times are ISO-8601 UTC strings.

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cs', 'tech')),
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  must_change_pass INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  phone2 TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE addresses (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  label TEXT,
  governorate TEXT NOT NULL,
  area TEXT NOT NULL,
  block TEXT,
  street TEXT,
  avenue TEXT,
  building TEXT,
  floor TEXT,
  flat TEXT,
  lat REAL,
  lng REAL,
  maps_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);

-- One session table for staff and customers.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  customer_id INTEGER REFERENCES customers(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((user_id IS NULL) <> (customer_id IS NULL))
);

-- Magic links that let a customer open their account from WhatsApp.
CREATE TABLE customer_links (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  created_by INTEGER REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE login_attempts (
  key TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_login_attempts ON login_attempts(key, at);

CREATE TABLE services (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  default_warranty_months INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE price_items (
  id INTEGER PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price_fils INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  address_id INTEGER REFERENCES addresses(id),
  service_id INTEGER REFERENCES services(id),
  source TEXT NOT NULL DEFAULT 'phone' CHECK (source IN ('website', 'whatsapp', 'phone', 'walkin', 'contract')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'assigned', 'on_the_way', 'in_progress', 'done', 'closed', 'reopened', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  preferred_time TEXT,
  scheduled_at TEXT,
  tech_id INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  assigned_at TEXT,
  on_way_at TEXT,
  started_at TEXT,
  start_lat REAL,
  start_lng REAL,
  start_accuracy REAL,
  finished_at TEXT,
  closed_at TEXT,
  tech_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tech ON orders(tech_id, status);
CREATE INDEX idx_orders_customer ON orders(customer_id);

CREATE TABLE order_photos (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  kind TEXT NOT NULL CHECK (kind IN ('before', 'after')),
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_photos_order ON order_photos(order_id);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  issued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  subtotal_fils INTEGER NOT NULL,
  discount_fils INTEGER NOT NULL DEFAULT 0,
  total_fils INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
  paid_fils INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'knet', 'link', 'transfer')),
  public_token TEXT NOT NULL UNIQUE,
  sent_at TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id)
);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);

CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  unit_fils INTEGER NOT NULL,
  total_fils INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'labour' CHECK (kind IN ('labour', 'part', 'other')),
  price_item_id INTEGER REFERENCES price_items(id)
);

CREATE TABLE warranties (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_id INTEGER REFERENCES invoices(id),
  months INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  covers TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_warranties_customer ON warranties(customer_id);
CREATE INDEX idx_warranties_ends ON warranties(ends_at);

-- Every survey is kept, whatever the rating or consent.
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
  token TEXT NOT NULL UNIQUE,
  sent_at TEXT,
  submitted_at TEXT,
  rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
  rating_tech INTEGER CHECK (rating_tech BETWEEN 1 AND 5),
  rating_punctuality INTEGER CHECK (rating_punctuality BETWEEN 1 AND 5),
  comment TEXT,
  consent_publish INTEGER NOT NULL DEFAULT 0,
  publish_status TEXT NOT NULL DEFAULT 'none' CHECK (publish_status IN ('none', 'pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT
);

CREATE TABLE followups (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  due_at TEXT NOT NULL,
  done_at TEXT,
  done_by INTEGER REFERENCES users(id),
  result TEXT CHECK (result IN ('resolved', 'not_resolved', 'no_answer')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_followups_due ON followups(done_at, due_at);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role TEXT,
  type TEXT NOT NULL,
  order_id INTEGER REFERENCES orders(id),
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_role ON notifications(role, read_at);

CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id),
  entity TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_activity_entity ON activity_log(entity, entity_id);

CREATE TABLE counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
