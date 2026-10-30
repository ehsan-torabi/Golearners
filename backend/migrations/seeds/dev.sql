-- Dev-only seed data. NEVER run against production.
-- Usage: make seed   (psql -f with DATABASE_URL)

INSERT INTO settings (key, value) VALUES
  ('site', '{"title":"گوLearn","description":"آموزش برنامه‌نویسی به زبان فارسی","maintenance_mode":false}'),
  ('seo', '{"meta_title":"گوLearn | آموزش برنامه‌نویسی","meta_description":"دوره‌های ویدیویی برنامه‌نویسی به فارسی","og_image":null,"socials":{"telegram":"","youtube":"","github":""}}'),
  ('gateways', '{"enabled":["zarinpal","digipay","mock"],"default":"zarinpal"}')
ON CONFLICT (key) DO NOTHING;
