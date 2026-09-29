-- Owner's clarifications: "فلتر سيل", and "سيل تانكي" is a tank sealant.
UPDATE price_items SET name_ar = 'تركيب فلتر سيل', name_en = 'Seal filter installation' WHERE name_ar = 'تركيب فلتر سال';
UPDATE price_items SET name_ar = 'سيل تانكي (عزل ضد التسريب)', name_en = 'Tank sealant (leak sealing)' WHERE name_ar = 'سيل تانكي';
