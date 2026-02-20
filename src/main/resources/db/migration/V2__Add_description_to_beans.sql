-- 1. Add the missing column to the existing table
ALTER TABLE beans ADD COLUMN description VARCHAR(255);

-- 2. Update the existing seed data with descriptions
UPDATE beans SET description = 'Smooth and sweet with flavor notes of chocolate and sugar.' WHERE name = 'Arabica';
UPDATE beans SET description = 'Strong, harsh, deep flavor with high caffeine content.' WHERE name = 'Robusta';
UPDATE beans SET description = 'Rare, smoky, and floral aroma with a bold profile.' WHERE name = 'Liberica';