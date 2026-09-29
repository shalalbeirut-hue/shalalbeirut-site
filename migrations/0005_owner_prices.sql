-- Owner's price list (اسعار الصيانة.xlsx). Prices in fils. NULL = priced after inspection. 0 = free.
UPDATE services SET name_ar = 'فلاتر وبرادات المياه', name_en = 'Water filters & coolers' WHERE slug = 'water-coolers';

-- Draft items that the owner's list replaces.
UPDATE price_items SET active = 0 WHERE kind = 'labour' AND name_ar IN (
  'كشف تسربات (شقة / بيت)', 'إصلاح تسريب ماسورة', 'تسليك خط رئيسي', 'تمديدات (حسب المتر)', 'تركيب سخان (بدون السخان)', 'تبديل عوامة'
);

INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'leak-detection'), 'الكشف عن المشكلة', 'Inspection', 0, 'labour', 1);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'إصلاح تسريب بايبات', 'Pipe leak repair', NULL, 'labour', 2);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'تركيب خط مغسلة', 'Basin line installation', 5000, 'labour', 3);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'تركيب خط شاور', 'Shower line installation', 6000, 'labour', 4);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'تمديد حمام تغذية', 'Bathroom supply pipework', 35000, 'labour', 5);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'plumbing'), 'تمديد حمام صرف', 'Bathroom drainage pipework', 30000, 'labour', 6);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'تركيب سخان رأسي', 'Vertical heater installation', 8000, 'labour', 1);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'تركيب سخان أفقي', 'Horizontal heater installation', 10000, 'labour', 2);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'صيانة سيستم مركزي', 'Central system service', 20000, 'labour', 3);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-heaters'), 'تجميع شبك سيستم مركزي', 'Central system network assembly', 30000, 'labour', 4);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'سيل تانكي', 'Tank sealing', 25000, 'labour', 1);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'تركيب عوامة تانكي', 'Tank float valve installation', 6000, 'labour', 2);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'tanks-pumps'), 'إصلاح شبك تانكي', 'Tank connections repair', NULL, 'labour', 3);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'drain-cleaning'), 'تسليك مجاري رئيسية', 'Main drain unclogging', NULL, 'labour', 1);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-coolers'), 'تركيب فلتر سال', 'Sal filter installation', 5000, 'labour', 1);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-coolers'), 'تركيب فلتر شرب عادي', 'Drinking water filter installation', 5000, 'labour', 2);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-coolers'), 'تركيب فلتر جامبو', 'Jumbo filter installation', 10000, 'labour', 3);
