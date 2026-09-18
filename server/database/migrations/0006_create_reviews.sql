CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  detail TEXT NOT NULL,
  counter TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '#',
  review TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO reviews (name, image_url, detail, counter, link, review) VALUES
('Sharkliz', '/customers/sharkliz.webp', 'YouTuber', '399k+ Subscribers', 'https://www.youtube.com/@Sharkilz', 'Super efficient, great communication, and excellent final product. Met a very demanding deadline with ease. Looking forward to working with in the future!'),
('yeslucid', '/customers/yeslucid.webp', 'YouTuber', '168k+ Subscribers', 'https://www.youtube.com/@yeslucid', 'Great building skills! needed lots of builds done for a video and he delivered them all in a very timely fashion'),
('Zenith', '/customers/zenith.webp', 'YouTuber', '334k+ Subscribers', 'https://www.youtube.com/@zenithminecraft', 'This Minecraft build is a stunning example of creativity and craftsmanship, showcasing remarkable attention to detail and design. The seamless integration of structure and environment creates an immersive experience and highlighting the builder''s skill.'),
('Cypro', '/customers/cypro.webp', 'YouTuber', '96.7k+ Subscribers', 'https://www.youtube.com/@cyproh', 'Made a small dungeon for me, and completely revamped an old structure of mine. Very quick and with updates, was everything that I asked for!'),
('Divvy', '/customers/divvy.webp', 'YouTuber', '276k+ Subscribers', 'https://www.youtube.com/@divvyminecraft', 'Good builder and made what i wanted in a timely manner.'),
('Gabby16Bit', '/customers/gabby16bit.webp', 'YouTuber', '3.52M+ Subscribers', 'https://www.youtube.com/gabby16bit', 'Very Good builder, he made me some build for my Youtube Channel. Professional, Fast and Talented.'),
('WanMine', '/customers/wanmine.jpg', 'Server', '', '#', 'Excellent editor! He adapted quickly to a new environment (Bedrock Edition) and was always reliable with deliveries, deadlines, and overall consistency. Great work!'),
('CoralMC', '/customers/coralmc.webp', 'Server', '', 'https://coralmc.it/it', 'This guy fully complied with our requirements, was helpful, professional, and punctual. He is also really good at building. I recommend him to everyone.'),
('PokeHub', '/customers/pokehub.webp', 'Server', '', 'https://store.pokehub.org/', 'lele was an amazing builder gave us exaclty what we needed, the maps were well thought out of and arranged, choice of blocks were excellent and we will 100% work with them again!');
