-- New-build contracting (src/data/newbuild.ts). Priced from the drawings, so items have no fixed price.
INSERT OR IGNORE INTO services (slug, name_ar, name_en, sort) VALUES ('drainage-sewers', 'تمديدات الصرف والمجاري الرئيسية', 'Drainage and main sewer lines', 20);
INSERT OR IGNORE INTO services (slug, name_ar, name_en, sort) VALUES ('water-supply-tanks', 'تمديدات التغذية وشبكات التوانكي', 'Water supply and tank networks', 21);
INSERT OR IGNORE INTO services (slug, name_ar, name_en, sort) VALUES ('water-networks', 'شبكات توزيع المياه الرئيسية', 'Main water distribution networks', 22);

INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'drainage-sewers'), 'تمديدات صرف قسيمة (حسب المخطط)', 'Plot drainage (per drawings)', NULL, 'labour', 200);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'drainage-sewers'), 'مجاري رئيسية ومناهيل (حسب المخطط)', 'Main sewers and manholes (per drawings)', NULL, 'labour', 201);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-supply-tanks'), 'تمديدات تغذية قسيمة (حسب المخطط)', 'Plot water supply (per drawings)', NULL, 'labour', 202);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-supply-tanks'), 'شبكة توانكي ومضخات (حسب المخطط)', 'Tank and pump network (per drawings)', NULL, 'labour', 203);
INSERT INTO price_items (service_id, name_ar, name_en, price_fils, kind, sort) VALUES ((SELECT id FROM services WHERE slug = 'water-networks'), 'شبكة توزيع مياه رئيسية (حسب المخطط)', 'Main distribution network (per drawings)', NULL, 'labour', 204);
