-- Document life cycle on one record: quote -> work order (customer signed) -> invoice -> paid.
ALTER TABLE invoices ADD COLUMN doc_status TEXT NOT NULL DEFAULT 'invoice' CHECK (doc_status IN ('quote', 'work_order', 'invoice', 'paid', 'cancelled'));
ALTER TABLE invoices ADD COLUMN quote_number TEXT;
ALTER TABLE invoices ADD COLUMN signature TEXT;
ALTER TABLE invoices ADD COLUMN signed_name TEXT;
ALTER TABLE invoices ADD COLUMN signed_at TEXT;
ALTER TABLE invoices ADD COLUMN signed_via TEXT CHECK (signed_via IN ('onsite', 'link'));
ALTER TABLE invoices ADD COLUMN invoiced_at TEXT;
ALTER TABLE invoices ADD COLUMN paid_at TEXT;
UPDATE invoices SET doc_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'invoice' END, invoiced_at = issued_at, paid_at = CASE WHEN payment_status = 'paid' THEN issued_at END;
CREATE INDEX idx_invoices_status ON invoices(doc_status);

-- Catalog items are either labour (مصنعيات) or spare parts (قطع غيار).
ALTER TABLE price_items ADD COLUMN kind TEXT NOT NULL DEFAULT 'labour' CHECK (kind IN ('labour', 'part'));

-- Common spare parts, without prices until the owner sets them.
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'هيتر سخان', '', 'part', 100);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'ثرموستات سخان', '', 'part', 101);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'صمام أمان سخان', '', 'part', 102);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'عوامة خزان', '', 'part', 103);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'مضخة ماي (ماطور)', '', 'part', 104);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'بريشر سويتش', '', 'part', 105);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'محبس', '', 'part', 106);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'ماسورة (متر)', '', 'part', 107);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'كوع / وصلة', '', 'part', 108);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'sanitary-ware'), 'خلاط مغسلة', '', 'part', 109);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'sanitary-ware'), 'خلاط دش', '', 'part', 110);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'sanitary-ware'), 'شطاف', '', 'part', 111);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'sanitary-ware'), 'سيفون كرسي', '', 'part', 112);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'sanitary-ware'), 'ليّ مرن (هوز)', '', 'part', 113);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'drain-cleaning'), 'بلاعة أرضية (غطاء)', '', 'part', 114);
INSERT INTO price_items (service_id, name_ar, name_en, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-coolers'), 'فلتر براد', '', 'part', 115);
