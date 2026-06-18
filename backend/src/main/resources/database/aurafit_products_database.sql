# AuraFit Database + Image Checklist
## 1. Database SQL
```sql
-- AuraFit product database seed for PostgreSQL - 200 products with local image paths.
-- IMPORTANT: This SQL does not download images. Put each .webp image in frontend/public following image_url.
-- Example: image_url '/images/products/cosplay/naruto/naruto-uzumaki.webp'
-- file path: frontend/public/images/products/cosplay/naruto/naruto-uzumaki.webp

SELECT 'CREATE DATABASE aurafit_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aurafit_db')\gexec

\connect aurafit_db

CREATE TABLE IF NOT EXISTS costumes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    rental_price NUMERIC(12, 2),
    deposit_price NUMERIC(12, 2),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    tag VARCHAR(255),
    size VARCHAR(255),
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_costumes_category ON costumes (category);
CREATE INDEX IF NOT EXISTS idx_costumes_subcategory ON costumes (subcategory);
CREATE INDEX IF NOT EXISTS idx_costumes_available ON costumes (available);

TRUNCATE TABLE costumes RESTART IDENTITY CASCADE;

INSERT INTO costumes
(name, description, image_url, rental_price, deposit_price, category, subcategory, tag, size, available, created_at)
VALUES
('Naruto Uzumaki', 'Cosplay Naruto nhân vật Naruto Uzumaki, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/naruto-uzumaki.webp', 520000, 250000, 'Cosplay', 'Anime', 'Naruto', 'S', true, NOW()),
('Sasuke Uchiha', 'Cosplay Naruto nhân vật Sasuke Uchiha, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/sasuke-uchiha.webp', 550000, 270000, 'Cosplay', 'Anime', 'Naruto', 'M', true, NOW()),
('Kakashi Hatake', 'Cosplay Naruto nhân vật Kakashi Hatake, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/kakashi-hatake.webp', 580000, 290000, 'Cosplay', 'Anime', 'Naruto', 'L', true, NOW()),
('Itachi Uchiha', 'Cosplay Naruto nhân vật Itachi Uchiha, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/itachi-uchiha.webp', 610000, 310000, 'Cosplay', 'Anime', 'Naruto', 'XL', true, NOW()),
('Minato Namikaze', 'Cosplay Naruto nhân vật Minato Namikaze, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/minato-namikaze.webp', 640000, 330000, 'Cosplay', 'Anime', 'Naruto', 'S', true, NOW()),
('Hinata Hyuga', 'Cosplay Naruto nhân vật Hinata Hyuga, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/hinata-hyuga.webp', 520000, 250000, 'Cosplay', 'Anime', 'Naruto', 'M', true, NOW()),
('Akatsuki Cloak', 'Cosplay Naruto nhân vật Akatsuki Cloak, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/akatsuki-cloak.webp', 550000, 270000, 'Cosplay', 'Anime', 'Naruto', 'L', true, NOW()),
('Gaara', 'Cosplay Naruto nhân vật Gaara, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/gaara.webp', 580000, 290000, 'Cosplay', 'Anime', 'Naruto', 'XL', true, NOW()),
('Madara Uchiha', 'Cosplay Naruto nhân vật Madara Uchiha, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/madara-uchiha.webp', 610000, 310000, 'Cosplay', 'Anime', 'Naruto', 'S', true, NOW()),
('Sakura Haruno', 'Cosplay Naruto nhân vật Sakura Haruno, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/naruto/sakura-haruno.webp', 640000, 330000, 'Cosplay', 'Anime', 'Naruto', 'M', true, NOW()),
('Monkey D. Luffy', 'Cosplay One Piece nhân vật Monkey D. Luffy, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/monkey-d-luffy.webp', 520000, 250000, 'Cosplay', 'Anime', 'One Piece', 'S', true, NOW()),
('Roronoa Zoro', 'Cosplay One Piece nhân vật Roronoa Zoro, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/roronoa-zoro.webp', 550000, 270000, 'Cosplay', 'Anime', 'One Piece', 'M', true, NOW()),
('Nami', 'Cosplay One Piece nhân vật Nami, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/nami.webp', 580000, 290000, 'Cosplay', 'Anime', 'One Piece', 'L', true, NOW()),
('Sanji', 'Cosplay One Piece nhân vật Sanji, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/sanji.webp', 610000, 310000, 'Cosplay', 'Anime', 'One Piece', 'XL', true, NOW()),
('Nico Robin', 'Cosplay One Piece nhân vật Nico Robin, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/nico-robin.webp', 640000, 330000, 'Cosplay', 'Anime', 'One Piece', 'S', true, NOW()),
('Boa Hancock', 'Cosplay One Piece nhân vật Boa Hancock, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/boa-hancock.webp', 520000, 250000, 'Cosplay', 'Anime', 'One Piece', 'M', true, NOW()),
('Trafalgar Law', 'Cosplay One Piece nhân vật Trafalgar Law, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/trafalgar-law.webp', 550000, 270000, 'Cosplay', 'Anime', 'One Piece', 'L', true, NOW()),
('Portgas D. Ace', 'Cosplay One Piece nhân vật Portgas D. Ace, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/portgas-d-ace.webp', 580000, 290000, 'Cosplay', 'Anime', 'One Piece', 'XL', true, NOW()),
('Yamato', 'Cosplay One Piece nhân vật Yamato, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/yamato.webp', 610000, 310000, 'Cosplay', 'Anime', 'One Piece', 'S', true, NOW()),
('Shanks', 'Cosplay One Piece nhân vật Shanks, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/one-piece/shanks.webp', 640000, 330000, 'Cosplay', 'Anime', 'One Piece', 'M', true, NOW()),
('Tanjiro Kamado', 'Cosplay Demon Slayer nhân vật Tanjiro Kamado, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/tanjiro-kamado.webp', 520000, 250000, 'Cosplay', 'Anime', 'Demon Slayer', 'S', true, NOW()),
('Nezuko Kamado', 'Cosplay Demon Slayer nhân vật Nezuko Kamado, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/nezuko-kamado.webp', 550000, 270000, 'Cosplay', 'Anime', 'Demon Slayer', 'M', true, NOW()),
('Zenitsu Agatsuma', 'Cosplay Demon Slayer nhân vật Zenitsu Agatsuma, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/zenitsu-agatsuma.webp', 580000, 290000, 'Cosplay', 'Anime', 'Demon Slayer', 'L', true, NOW()),
('Inosuke Hashibira', 'Cosplay Demon Slayer nhân vật Inosuke Hashibira, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/inosuke-hashibira.webp', 610000, 310000, 'Cosplay', 'Anime', 'Demon Slayer', 'XL', true, NOW()),
('Shinobu Kocho', 'Cosplay Demon Slayer nhân vật Shinobu Kocho, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/shinobu-kocho.webp', 640000, 330000, 'Cosplay', 'Anime', 'Demon Slayer', 'S', true, NOW()),
('Rengoku Kyojuro', 'Cosplay Demon Slayer nhân vật Rengoku Kyojuro, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/rengoku-kyojuro.webp', 520000, 250000, 'Cosplay', 'Anime', 'Demon Slayer', 'M', true, NOW()),
('Mitsuri Kanroji', 'Cosplay Demon Slayer nhân vật Mitsuri Kanroji, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/mitsuri-kanroji.webp', 550000, 270000, 'Cosplay', 'Anime', 'Demon Slayer', 'L', true, NOW()),
('Giyu Tomioka', 'Cosplay Demon Slayer nhân vật Giyu Tomioka, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/giyu-tomioka.webp', 580000, 290000, 'Cosplay', 'Anime', 'Demon Slayer', 'XL', true, NOW()),
('Muichiro Tokito', 'Cosplay Demon Slayer nhân vật Muichiro Tokito, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/muichiro-tokito.webp', 610000, 310000, 'Cosplay', 'Anime', 'Demon Slayer', 'S', true, NOW()),
('Tengen Uzui', 'Cosplay Demon Slayer nhân vật Tengen Uzui, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/demon-slayer/tengen-uzui.webp', 640000, 330000, 'Cosplay', 'Anime', 'Demon Slayer', 'M', true, NOW()),
('Gojo Satoru', 'Cosplay Jujutsu Kaisen nhân vật Gojo Satoru, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/gojo-satoru.webp', 520000, 250000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'S', true, NOW()),
('Yuji Itadori', 'Cosplay Jujutsu Kaisen nhân vật Yuji Itadori, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/yuji-itadori.webp', 550000, 270000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'M', true, NOW()),
('Megumi Fushiguro', 'Cosplay Jujutsu Kaisen nhân vật Megumi Fushiguro, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/megumi-fushiguro.webp', 580000, 290000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'L', true, NOW()),
('Nobara Kugisaki', 'Cosplay Jujutsu Kaisen nhân vật Nobara Kugisaki, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/nobara-kugisaki.webp', 610000, 310000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'XL', true, NOW()),
('Ryomen Sukuna', 'Cosplay Jujutsu Kaisen nhân vật Ryomen Sukuna, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/ryomen-sukuna.webp', 640000, 330000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'S', true, NOW()),
('Suguru Geto', 'Cosplay Jujutsu Kaisen nhân vật Suguru Geto, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/suguru-geto.webp', 520000, 250000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'M', true, NOW()),
('Maki Zenin', 'Cosplay Jujutsu Kaisen nhân vật Maki Zenin, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/maki-zenin.webp', 550000, 270000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'L', true, NOW()),
('Toji Fushiguro', 'Cosplay Jujutsu Kaisen nhân vật Toji Fushiguro, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/jujutsu-kaisen/toji-fushiguro.webp', 580000, 290000, 'Cosplay', 'Anime', 'Jujutsu Kaisen', 'XL', true, NOW()),
('Eren Yeager', 'Cosplay Attack on Titan nhân vật Eren Yeager, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/eren-yeager.webp', 520000, 250000, 'Cosplay', 'Anime', 'Attack on Titan', 'S', true, NOW()),
('Mikasa Ackerman', 'Cosplay Attack on Titan nhân vật Mikasa Ackerman, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/mikasa-ackerman.webp', 550000, 270000, 'Cosplay', 'Anime', 'Attack on Titan', 'M', true, NOW()),
('Levi Ackerman', 'Cosplay Attack on Titan nhân vật Levi Ackerman, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/levi-ackerman.webp', 580000, 290000, 'Cosplay', 'Anime', 'Attack on Titan', 'L', true, NOW()),
('Armin Arlert', 'Cosplay Attack on Titan nhân vật Armin Arlert, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/armin-arlert.webp', 610000, 310000, 'Cosplay', 'Anime', 'Attack on Titan', 'XL', true, NOW()),
('Survey Corps Uniform', 'Cosplay Attack on Titan nhân vật Survey Corps Uniform, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/survey-corps-uniform.webp', 640000, 330000, 'Cosplay', 'Anime', 'Attack on Titan', 'S', true, NOW()),
('Hange Zoe', 'Cosplay Attack on Titan nhân vật Hange Zoe, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/attack-on-titan/hange-zoe.webp', 520000, 250000, 'Cosplay', 'Anime', 'Attack on Titan', 'M', true, NOW()),
('Anya Forger', 'Cosplay Spy x Family nhân vật Anya Forger, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/spy-x-family/anya-forger.webp', 520000, 250000, 'Cosplay', 'Anime', 'Spy x Family', 'S', true, NOW()),
('Loid Forger', 'Cosplay Spy x Family nhân vật Loid Forger, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/spy-x-family/loid-forger.webp', 550000, 270000, 'Cosplay', 'Anime', 'Spy x Family', 'M', true, NOW()),
('Yor Forger Thorn Princess', 'Cosplay Spy x Family nhân vật Yor Forger Thorn Princess, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/spy-x-family/yor-forger-thorn-princess.webp', 580000, 290000, 'Cosplay', 'Anime', 'Spy x Family', 'L', true, NOW()),
('Eden Academy Uniform', 'Cosplay Spy x Family nhân vật Eden Academy Uniform, full set trang phục, phù hợp chụp ảnh và sự kiện anime.', '/images/products/cosplay/spy-x-family/eden-academy-uniform.webp', 610000, 310000, 'Cosplay', 'Anime', 'Spy x Family', 'XL', true, NOW()),
('Yae Miko', 'Cosplay game Genshin Impact nhân vật Yae Miko, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/yae-miko.webp', 580000, 280000, 'Cosplay', 'Game', 'Genshin Impact', 'M', true, NOW()),
('Raiden Shogun', 'Cosplay game Genshin Impact nhân vật Raiden Shogun, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/raiden-shogun.webp', 615000, 300000, 'Cosplay', 'Game', 'Genshin Impact', 'L', true, NOW()),
('Hu Tao', 'Cosplay game Genshin Impact nhân vật Hu Tao, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/hu-tao.webp', 650000, 320000, 'Cosplay', 'Game', 'Genshin Impact', 'XL', true, NOW()),
('Furina', 'Cosplay game Genshin Impact nhân vật Furina, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/furina.webp', 685000, 340000, 'Cosplay', 'Game', 'Genshin Impact', 'S', true, NOW()),
('Kamisato Ayaka', 'Cosplay game Genshin Impact nhân vật Kamisato Ayaka, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/kamisato-ayaka.webp', 720000, 360000, 'Cosplay', 'Game', 'Genshin Impact', 'M', true, NOW()),
('Nahida', 'Cosplay game Genshin Impact nhân vật Nahida, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/nahida.webp', 755000, 380000, 'Cosplay', 'Game', 'Genshin Impact', 'L', true, NOW()),
('Zhongli', 'Cosplay game Genshin Impact nhân vật Zhongli, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/zhongli.webp', 580000, 280000, 'Cosplay', 'Game', 'Genshin Impact', 'XL', true, NOW()),
('Xiao', 'Cosplay game Genshin Impact nhân vật Xiao, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/xiao.webp', 615000, 300000, 'Cosplay', 'Game', 'Genshin Impact', 'S', true, NOW()),
('Venti', 'Cosplay game Genshin Impact nhân vật Venti, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/venti.webp', 650000, 320000, 'Cosplay', 'Game', 'Genshin Impact', 'M', true, NOW()),
('Ganyu', 'Cosplay game Genshin Impact nhân vật Ganyu, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/ganyu.webp', 685000, 340000, 'Cosplay', 'Game', 'Genshin Impact', 'L', true, NOW()),
('Klee', 'Cosplay game Genshin Impact nhân vật Klee, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/klee.webp', 720000, 360000, 'Cosplay', 'Game', 'Genshin Impact', 'XL', true, NOW()),
('Albedo', 'Cosplay game Genshin Impact nhân vật Albedo, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/genshin-impact/albedo.webp', 755000, 380000, 'Cosplay', 'Game', 'Genshin Impact', 'S', true, NOW()),
('Kafka', 'Cosplay game Honkai Star Rail nhân vật Kafka, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/kafka.webp', 580000, 280000, 'Cosplay', 'Game', 'Honkai Star Rail', 'M', true, NOW()),
('Firefly', 'Cosplay game Honkai Star Rail nhân vật Firefly, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/firefly.webp', 615000, 300000, 'Cosplay', 'Game', 'Honkai Star Rail', 'L', true, NOW()),
('Acheron', 'Cosplay game Honkai Star Rail nhân vật Acheron, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/acheron.webp', 650000, 320000, 'Cosplay', 'Game', 'Honkai Star Rail', 'XL', true, NOW()),
('Silver Wolf', 'Cosplay game Honkai Star Rail nhân vật Silver Wolf, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/silver-wolf.webp', 685000, 340000, 'Cosplay', 'Game', 'Honkai Star Rail', 'S', true, NOW()),
('March 7th', 'Cosplay game Honkai Star Rail nhân vật March 7th, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/march-7th.webp', 720000, 360000, 'Cosplay', 'Game', 'Honkai Star Rail', 'M', true, NOW()),
('Dan Heng', 'Cosplay game Honkai Star Rail nhân vật Dan Heng, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/dan-heng.webp', 755000, 380000, 'Cosplay', 'Game', 'Honkai Star Rail', 'L', true, NOW()),
('Jing Yuan', 'Cosplay game Honkai Star Rail nhân vật Jing Yuan, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/jing-yuan.webp', 580000, 280000, 'Cosplay', 'Game', 'Honkai Star Rail', 'XL', true, NOW()),
('Himeko', 'Cosplay game Honkai Star Rail nhân vật Himeko, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/honkai-star-rail/himeko.webp', 615000, 300000, 'Cosplay', 'Game', 'Honkai Star Rail', 'S', true, NOW()),
('Ahri', 'Cosplay game League of Legends nhân vật Ahri, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/ahri.webp', 580000, 280000, 'Cosplay', 'Game', 'League of Legends', 'M', true, NOW()),
('Katarina', 'Cosplay game League of Legends nhân vật Katarina, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/katarina.webp', 615000, 300000, 'Cosplay', 'Game', 'League of Legends', 'L', true, NOW()),
('Jinx', 'Cosplay game League of Legends nhân vật Jinx, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/jinx.webp', 650000, 320000, 'Cosplay', 'Game', 'League of Legends', 'XL', true, NOW()),
('Lux', 'Cosplay game League of Legends nhân vật Lux, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/lux.webp', 685000, 340000, 'Cosplay', 'Game', 'League of Legends', 'S', true, NOW()),
('Yasuo', 'Cosplay game League of Legends nhân vật Yasuo, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/yasuo.webp', 720000, 360000, 'Cosplay', 'Game', 'League of Legends', 'M', true, NOW()),
('Akali', 'Cosplay game League of Legends nhân vật Akali, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/akali.webp', 755000, 380000, 'Cosplay', 'Game', 'League of Legends', 'L', true, NOW()),
('Seraphine', 'Cosplay game League of Legends nhân vật Seraphine, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/seraphine.webp', 580000, 280000, 'Cosplay', 'Game', 'League of Legends', 'XL', true, NOW()),
('Ezreal', 'Cosplay game League of Legends nhân vật Ezreal, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/league-of-legends/ezreal.webp', 615000, 300000, 'Cosplay', 'Game', 'League of Legends', 'S', true, NOW()),
('Jett', 'Cosplay game Valorant nhân vật Jett, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/jett.webp', 580000, 280000, 'Cosplay', 'Game', 'Valorant', 'M', true, NOW()),
('Sage', 'Cosplay game Valorant nhân vật Sage, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/sage.webp', 615000, 300000, 'Cosplay', 'Game', 'Valorant', 'L', true, NOW()),
('Viper', 'Cosplay game Valorant nhân vật Viper, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/viper.webp', 650000, 320000, 'Cosplay', 'Game', 'Valorant', 'XL', true, NOW()),
('Reyna', 'Cosplay game Valorant nhân vật Reyna, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/reyna.webp', 685000, 340000, 'Cosplay', 'Game', 'Valorant', 'S', true, NOW()),
('Killjoy', 'Cosplay game Valorant nhân vật Killjoy, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/killjoy.webp', 720000, 360000, 'Cosplay', 'Game', 'Valorant', 'M', true, NOW()),
('Phoenix', 'Cosplay game Valorant nhân vật Phoenix, thiết kế nhận diện rõ nhân vật, dùng cho convention và studio.', '/images/products/cosplay/valorant/phoenix.webp', 755000, 380000, 'Cosplay', 'Game', 'Valorant', 'L', true, NOW()),
('Forest Elf Archer', 'Bộ cosplay Forest Elf Archer phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/forest-elf-archer.webp', 450000, 200000, 'Cosplay', 'Fantasy', 'Forest', 'Free Size', true, NOW()),
('Dark Elf Sorceress', 'Bộ cosplay Dark Elf Sorceress phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/dark-elf-sorceress.webp', 490000, 225000, 'Cosplay', 'Fantasy', 'Dark', 'M', true, NOW()),
('White Angel Wings Set', 'Bộ cosplay White Angel Wings Set phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/white-angel-wings-set.webp', 530000, 250000, 'Cosplay', 'Fantasy', 'White', 'L', true, NOW()),
('Fallen Angel Black Set', 'Bộ cosplay Fallen Angel Black Set phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/fallen-angel-black-set.webp', 570000, 275000, 'Cosplay', 'Fantasy', 'Fallen', 'Free Size', true, NOW()),
('Fairy Princess Pink', 'Bộ cosplay Fairy Princess Pink phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/fairy-princess-pink.webp', 610000, 300000, 'Cosplay', 'Fantasy', 'Fairy', 'S', true, NOW()),
('Ice Fairy Blue', 'Bộ cosplay Ice Fairy Blue phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/ice-fairy-blue.webp', 650000, 325000, 'Cosplay', 'Fantasy', 'Ice', 'M', true, NOW()),
('Demon King Armor', 'Bộ cosplay Demon King Armor phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/demon-king-armor.webp', 690000, 350000, 'Cosplay', 'Fantasy', 'Demon', 'Free Size', true, NOW()),
('Witch Classic Black', 'Bộ cosplay Witch Classic Black phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/witch-classic-black.webp', 450000, 200000, 'Cosplay', 'Fantasy', 'Witch', 'XL', true, NOW()),
('Mage Blue Robe', 'Bộ cosplay Mage Blue Robe phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/mage-blue-robe.webp', 490000, 225000, 'Cosplay', 'Fantasy', 'Mage', 'S', true, NOW()),
('Knight Armor Silver', 'Bộ cosplay Knight Armor Silver phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/knight-armor-silver.webp', 530000, 250000, 'Cosplay', 'Fantasy', 'Knight', 'Free Size', true, NOW()),
('Paladin White Armor', 'Bộ cosplay Paladin White Armor phong cách Fantasy, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/fantasy/paladin-white-armor.webp', 570000, 275000, 'Cosplay', 'Fantasy', 'Paladin', 'L', true, NOW()),
('Royal Princess Ball Gown', 'Bộ cosplay Royal Princess Ball Gown phong cách Royal Court, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/royal-court/royal-princess-ball-gown.webp', 610000, 300000, 'Cosplay', 'Royal Court', 'Royal Princess Ball', 'XL', true, NOW()),
('Royal Prince Set', 'Bộ cosplay Royal Prince Set phong cách Royal Court, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/royal-court/royal-prince-set.webp', 650000, 325000, 'Cosplay', 'Royal Court', 'Royal Prince', 'Free Size', true, NOW()),
('Royal Queen Gown', 'Bộ cosplay Royal Queen Gown phong cách Royal Court, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/royal-court/royal-queen-gown.webp', 690000, 350000, 'Cosplay', 'Royal Court', 'Royal Queen', 'M', true, NOW()),
('European Nobleman', 'Bộ cosplay European Nobleman phong cách Royal Court, có phụ kiện đi kèm cho chụp ảnh concept.', '/images/products/cosplay/royal-court/european-nobleman.webp', 450000, 200000, 'Cosplay', 'Royal Court', 'European Nobleman', 'L', true, NOW()),
('Harry Potter Gryffindor Robe', 'Trang phục lấy cảm hứng Harry Potter: Harry Potter Gryffindor Robe, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/harry-potter/harry-potter-gryffindor-robe.webp', 520000, 240000, 'Cosplay', 'Movie & Series', 'Harry Potter', 'S', true, NOW()),
('Hermione Granger Robe', 'Trang phục lấy cảm hứng Harry Potter: Hermione Granger Robe, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/harry-potter/hermione-granger-robe.webp', 565000, 270000, 'Cosplay', 'Movie & Series', 'Harry Potter', 'M', true, NOW()),
('Draco Malfoy Slytherin Robe', 'Trang phục lấy cảm hứng Harry Potter: Draco Malfoy Slytherin Robe, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/harry-potter/draco-malfoy-slytherin-robe.webp', 610000, 300000, 'Cosplay', 'Movie & Series', 'Harry Potter', 'L', true, NOW()),
('Ravenclaw Student Robe', 'Trang phục lấy cảm hứng Harry Potter: Ravenclaw Student Robe, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/harry-potter/ravenclaw-student-robe.webp', 655000, 330000, 'Cosplay', 'Movie & Series', 'Harry Potter', 'XL', true, NOW()),
('Hufflepuff Student Robe', 'Trang phục lấy cảm hứng Harry Potter: Hufflepuff Student Robe, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/harry-potter/hufflepuff-student-robe.webp', 700000, 360000, 'Cosplay', 'Movie & Series', 'Harry Potter', 'S', true, NOW()),
('Spider Man Suit', 'Trang phục lấy cảm hứng Marvel: Spider Man Suit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/spider-man-suit.webp', 520000, 240000, 'Cosplay', 'Movie & Series', 'Marvel', 'S', true, NOW()),
('Iron Man Inspired Armor', 'Trang phục lấy cảm hứng Marvel: Iron Man Inspired Armor, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/iron-man-inspired-armor.webp', 565000, 270000, 'Cosplay', 'Movie & Series', 'Marvel', 'M', true, NOW()),
('Captain America Suit', 'Trang phục lấy cảm hứng Marvel: Captain America Suit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/captain-america-suit.webp', 610000, 300000, 'Cosplay', 'Movie & Series', 'Marvel', 'L', true, NOW()),
('Thor Cape Set', 'Trang phục lấy cảm hứng Marvel: Thor Cape Set, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/thor-cape-set.webp', 655000, 330000, 'Cosplay', 'Movie & Series', 'Marvel', 'XL', true, NOW()),
('Doctor Strange Cloak', 'Trang phục lấy cảm hứng Marvel: Doctor Strange Cloak, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/doctor-strange-cloak.webp', 700000, 360000, 'Cosplay', 'Movie & Series', 'Marvel', 'S', true, NOW()),
('Black Widow Suit', 'Trang phục lấy cảm hứng Marvel: Black Widow Suit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/black-widow-suit.webp', 520000, 240000, 'Cosplay', 'Movie & Series', 'Marvel', 'M', true, NOW()),
('Scarlet Witch Outfit', 'Trang phục lấy cảm hứng Marvel: Scarlet Witch Outfit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/marvel/scarlet-witch-outfit.webp', 565000, 270000, 'Cosplay', 'Movie & Series', 'Marvel', 'L', true, NOW()),
('Batman Suit', 'Trang phục lấy cảm hứng DC: Batman Suit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/dc/batman-suit.webp', 520000, 240000, 'Cosplay', 'Movie & Series', 'DC', 'S', true, NOW()),
('Joker Purple Suit', 'Trang phục lấy cảm hứng DC: Joker Purple Suit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/dc/joker-purple-suit.webp', 565000, 270000, 'Cosplay', 'Movie & Series', 'DC', 'M', true, NOW()),
('Harley Quinn Outfit', 'Trang phục lấy cảm hứng DC: Harley Quinn Outfit, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/dc/harley-quinn-outfit.webp', 610000, 300000, 'Cosplay', 'Movie & Series', 'DC', 'L', true, NOW()),
('Wonder Woman Armor', 'Trang phục lấy cảm hứng DC: Wonder Woman Armor, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/dc/wonder-woman-armor.webp', 655000, 330000, 'Cosplay', 'Movie & Series', 'DC', 'XL', true, NOW()),
('Superman Cape Set', 'Trang phục lấy cảm hứng DC: Superman Cape Set, phù hợp hóa trang, sự kiện và chụp ảnh.', '/images/products/cosplay/dc/superman-cape-set.webp', 700000, 360000, 'Cosplay', 'Movie & Series', 'DC', 'S', true, NOW()),
('Vest đen classic nam', 'Vest đen classic nam dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-den-classic-nam.webp', 280000, 120000, 'Events', 'Vest & Formal', 'Vest nam', 'L', true, NOW()),
('Vest xanh navy nam', 'Vest xanh navy nam dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-xanh-navy-nam.webp', 325000, 145000, 'Events', 'Vest & Formal', 'Vest nam', 'M', true, NOW()),
('Vest ghi xám nam', 'Vest ghi xám nam dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-ghi-xam-nam.webp', 370000, 170000, 'Events', 'Vest & Formal', 'Vest nam', 'L', true, NOW()),
('Vest trắng nam', 'Vest trắng nam dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-trang-nam.webp', 415000, 195000, 'Events', 'Vest & Formal', 'Vest nam', 'M', true, NOW()),
('Vest cưới ivory nam', 'Vest cưới ivory nam dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-cuoi-ivory-nam.webp', 460000, 220000, 'Events', 'Vest & Formal', 'Vest nam', 'L', true, NOW()),
('Vest nữ trắng thanh lịch', 'Vest nữ trắng thanh lịch dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-nu-trang-thanh-lich.webp', 505000, 245000, 'Events', 'Vest & Formal', 'Vest nữ', 'M', true, NOW()),
('Vest nữ đen công sở', 'Vest nữ đen công sở dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-nu-den-cong-so.webp', 550000, 270000, 'Events', 'Vest & Formal', 'Vest nữ', 'S', true, NOW()),
('Vest nữ kem Hàn Quốc', 'Vest nữ kem Hàn Quốc dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/vest-nu-kem-han-quoc.webp', 595000, 295000, 'Events', 'Vest & Formal', 'Vest nữ', 'M', true, NOW()),
('Blazer nữ pastel', 'Blazer nữ pastel dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/blazer-nu-pastel.webp', 640000, 320000, 'Events', 'Vest & Formal', 'Blazer', 'M', true, NOW()),
('Blazer nam beige', 'Blazer nam beige dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/blazer-nam-beige.webp', 280000, 120000, 'Events', 'Vest & Formal', 'Blazer', 'L', true, NOW()),
('Tuxedo đen cao cấp', 'Tuxedo đen cao cấp dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/tuxedo-den-cao-cap.webp', 325000, 145000, 'Events', 'Vest & Formal', 'Tuxedo', 'L', true, NOW()),
('Tuxedo trắng luxury', 'Tuxedo trắng luxury dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/tuxedo-trang-luxury.webp', 370000, 170000, 'Events', 'Vest & Formal', 'Tuxedo', 'M', true, NOW()),
('Tuxedo velvet đỏ rượu', 'Tuxedo velvet đỏ rượu dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/vest-formal/tuxedo-velvet-do-ruou.webp', 415000, 195000, 'Events', 'Vest & Formal', 'Tuxedo', 'L', true, NOW()),
('Váy dạ hội đỏ Ruby đuôi cá', 'Váy dạ hội đỏ Ruby đuôi cá dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-do-ruby-duoi-ca.webp', 460000, 220000, 'Events', 'Dạ hội', 'Evening Gown', 'M', true, NOW()),
('Váy dạ hội xanh Sapphire', 'Váy dạ hội xanh Sapphire dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-xanh-sapphire.webp', 505000, 245000, 'Events', 'Dạ hội', 'Evening Gown', 'S', true, NOW()),
('Váy dạ hội đen Luxury', 'Váy dạ hội đen Luxury dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-den-luxury.webp', 550000, 270000, 'Events', 'Dạ hội', 'Evening Gown', 'M', true, NOW()),
('Váy dạ hội vàng Champagne', 'Váy dạ hội vàng Champagne dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-vang-champagne.webp', 595000, 295000, 'Events', 'Dạ hội', 'Evening Gown', 'M', true, NOW()),
('Váy dạ hội bạc ánh kim', 'Váy dạ hội bạc ánh kim dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-bac-anh-kim.webp', 640000, 320000, 'Events', 'Dạ hội', 'Evening Gown', 'S', true, NOW()),
('Váy dạ hội tím Lavender', 'Váy dạ hội tím Lavender dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/vay-da-hoi-tim-lavender.webp', 280000, 120000, 'Events', 'Dạ hội', 'Evening Gown', 'M', true, NOW()),
('Prom Dress hồng pastel', 'Prom Dress hồng pastel dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/prom-dress-hong-pastel.webp', 325000, 145000, 'Events', 'Dạ hội', 'Prom Dress', 'S', true, NOW()),
('Prom Dress xanh baby', 'Prom Dress xanh baby dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/prom-dress-xanh-baby.webp', 370000, 170000, 'Events', 'Dạ hội', 'Prom Dress', 'M', true, NOW()),
('Prom Dress tím công chúa', 'Prom Dress tím công chúa dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/prom-dress-tim-cong-chua.webp', 415000, 195000, 'Events', 'Dạ hội', 'Prom Dress', 'M', true, NOW()),
('Prom Dress trắng tinh khôi', 'Prom Dress trắng tinh khôi dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/prom-dress-trang-tinh-khoi.webp', 460000, 220000, 'Events', 'Dạ hội', 'Prom Dress', 'S', true, NOW()),
('Cocktail Dress đen basic', 'Cocktail Dress đen basic dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/cocktail-dress-den-basic.webp', 505000, 245000, 'Events', 'Dạ hội', 'Cocktail Dress', 'M', true, NOW()),
('Cocktail Dress đỏ satin', 'Cocktail Dress đỏ satin dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/cocktail-dress-do-satin.webp', 550000, 270000, 'Events', 'Dạ hội', 'Cocktail Dress', 'S', true, NOW()),
('Cocktail Dress xanh emerald', 'Cocktail Dress xanh emerald dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/da-hoi/cocktail-dress-xanh-emerald.webp', 595000, 295000, 'Events', 'Dạ hội', 'Cocktail Dress', 'M', true, NOW()),
('Mascot Gấu nâu', 'Mascot Gấu nâu dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/mascot/mascot-gau-nau.webp', 640000, 320000, 'Events', 'Mascot', 'Gấu', 'Free Size', true, NOW()),
('Mascot Thỏ trắng', 'Mascot Thỏ trắng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/mascot/mascot-tho-trang.webp', 280000, 120000, 'Events', 'Mascot', 'Thỏ', 'Free Size', true, NOW()),
('Mascot Khủng long xanh', 'Mascot Khủng long xanh dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/mascot/mascot-khung-long-xanh.webp', 325000, 145000, 'Events', 'Mascot', 'Khủng long', 'Free Size', true, NOW()),
('Mascot Mèo vàng', 'Mascot Mèo vàng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/mascot/mascot-meo-vang.webp', 370000, 170000, 'Events', 'Mascot', 'Mèo', 'Free Size', true, NOW()),
('Đồng phục Team Building đỏ', 'Đồng phục Team Building đỏ dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/team-building/dong-phuc-team-building-do.webp', 415000, 195000, 'Events', 'Team Building', 'Áo nhóm', 'Free Size', true, NOW()),
('Đồng phục Team Building xanh', 'Đồng phục Team Building xanh dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/team-building/dong-phuc-team-building-xanh.webp', 460000, 220000, 'Events', 'Team Building', 'Áo nhóm', 'Free Size', true, NOW()),
('Đồng phục Team Building vàng', 'Đồng phục Team Building vàng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/team-building/dong-phuc-team-building-vang.webp', 505000, 245000, 'Events', 'Team Building', 'Áo nhóm', 'Free Size', true, NOW()),
('Áo dài lễ tân đỏ', 'Áo dài lễ tân đỏ dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/ao-dai-le-tan-do.webp', 550000, 270000, 'Events', 'Lễ hội', 'Lễ tân', 'M', true, NOW()),
('Đầm MC sự kiện trắng', 'Đầm MC sự kiện trắng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/dam-mc-su-kien-trang.webp', 595000, 295000, 'Events', 'Lễ hội', 'MC', 'M', true, NOW()),
('Trang phục Noel ông già', 'Trang phục Noel ông già dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/trang-phuc-noel-ong-gia.webp', 640000, 320000, 'Events', 'Lễ hội', 'Noel', 'Free Size', true, NOW()),
('Trang phục Noel nữ đỏ', 'Trang phục Noel nữ đỏ dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/trang-phuc-noel-nu-do.webp', 280000, 120000, 'Events', 'Lễ hội', 'Noel', 'M', true, NOW()),
('Trang phục Halloween bí ngô', 'Trang phục Halloween bí ngô dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/trang-phuc-halloween-bi-ngo.webp', 325000, 145000, 'Events', 'Lễ hội', 'Halloween', 'Free Size', true, NOW()),
('Trang phục Halloween ma cà rồng', 'Trang phục Halloween ma cà rồng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/le-hoi/trang-phuc-halloween-ma-ca-rong.webp', 370000, 170000, 'Events', 'Lễ hội', 'Halloween', 'L', true, NOW()),
('Đầm cưới trắng ren', 'Đầm cưới trắng ren dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/dam-cuoi-trang-ren.webp', 415000, 195000, 'Events', 'Wedding', 'Wedding Dress', 'M', true, NOW()),
('Đầm phụ dâu hồng', 'Đầm phụ dâu hồng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/dam-phu-dau-hong.webp', 460000, 220000, 'Events', 'Wedding', 'Bridesmaid', 'M', true, NOW()),
('Đầm phụ dâu xanh', 'Đầm phụ dâu xanh dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/dam-phu-dau-xanh.webp', 505000, 245000, 'Events', 'Wedding', 'Bridesmaid', 'S', true, NOW()),
('Áo dài cưới đỏ', 'Áo dài cưới đỏ dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/ao-dai-cuoi-do.webp', 550000, 270000, 'Events', 'Wedding', 'Áo dài cưới', 'M', true, NOW()),
('Áo dài cưới trắng', 'Áo dài cưới trắng dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/ao-dai-cuoi-trang.webp', 595000, 295000, 'Events', 'Wedding', 'Áo dài cưới', 'S', true, NOW()),
('Suit chú rể đen', 'Suit chú rể đen dùng cho tiệc, sân khấu, hội nghị hoặc chụp ảnh sự kiện.', '/images/products/events/wedding/suit-chu-re-den.webp', 640000, 320000, 'Events', 'Wedding', 'Groom Suit', 'L', true, NOW()),
('Áo dài trắng học sinh', 'Áo dài trắng học sinh phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-trang-hoc-sinh.webp', 150000, 70000, 'Yearbook', 'Áo dài', 'Áo dài trắng', 'S', true, NOW()),
('Áo dài trắng lụa tơ tằm', 'Áo dài trắng lụa tơ tằm phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-trang-lua-to-tam.webp', 180000, 85000, 'Yearbook', 'Áo dài', 'Áo dài trắng', 'M', true, NOW()),
('Áo dài đỏ truyền thống', 'Áo dài đỏ truyền thống phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-do-truyen-thong.webp', 210000, 100000, 'Yearbook', 'Áo dài', 'Áo dài truyền thống', 'M', true, NOW()),
('Áo dài xanh ngọc', 'Áo dài xanh ngọc phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-xanh-ngoc.webp', 240000, 115000, 'Yearbook', 'Áo dài', 'Áo dài cách tân', 'M', true, NOW()),
('Áo dài vàng hoa sen', 'Áo dài vàng hoa sen phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-vang-hoa-sen.webp', 270000, 130000, 'Yearbook', 'Áo dài', 'Áo dài truyền thống', 'S', true, NOW()),
('Áo dài hồng pastel', 'Áo dài hồng pastel phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-hong-pastel.webp', 300000, 145000, 'Yearbook', 'Áo dài', 'Áo dài cách tân', 'M', true, NOW()),
('Áo dài tím Huế', 'Áo dài tím Huế phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-tim-hue.webp', 330000, 160000, 'Yearbook', 'Áo dài', 'Áo dài truyền thống', 'M', true, NOW()),
('Áo dài nam trắng', 'Áo dài nam trắng phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-nam-trang.webp', 360000, 175000, 'Yearbook', 'Áo dài', 'Áo dài nam', 'L', true, NOW()),
('Áo dài nam xanh navy', 'Áo dài nam xanh navy phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-nam-xanh-navy.webp', 150000, 70000, 'Yearbook', 'Áo dài', 'Áo dài nam', 'L', true, NOW()),
('Áo dài cách tân nhóm', 'Áo dài cách tân nhóm phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/ao-dai/ao-dai-cach-tan-nhom.webp', 180000, 85000, 'Yearbook', 'Áo dài', 'Áo dài cách tân', 'Free Size', true, NOW()),
('Áo cử nhân đại học kèm mũ', 'Áo cử nhân đại học kèm mũ phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/cu-nhan/ao-cu-nhan-dai-hoc-kem-mu.webp', 210000, 100000, 'Yearbook', 'Cử nhân', 'Áo cử nhân', 'M', true, NOW()),
('Áo cử nhân xanh navy', 'Áo cử nhân xanh navy phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/cu-nhan/ao-cu-nhan-xanh-navy.webp', 240000, 115000, 'Yearbook', 'Cử nhân', 'Áo cử nhân', 'L', true, NOW()),
('Áo cử nhân đỏ đô', 'Áo cử nhân đỏ đô phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/cu-nhan/ao-cu-nhan-do-do.webp', 270000, 130000, 'Yearbook', 'Cử nhân', 'Áo cử nhân', 'M', true, NOW()),
('Mũ cử nhân tốt nghiệp', 'Mũ cử nhân tốt nghiệp phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/cu-nhan/mu-cu-nhan-tot-nghiep.webp', 300000, 145000, 'Yearbook', 'Cử nhân', 'Mũ cử nhân', 'Free Size', true, NOW()),
('Khăn tốt nghiệp vàng', 'Khăn tốt nghiệp vàng phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/cu-nhan/khan-tot-nghiep-vang.webp', 330000, 160000, 'Yearbook', 'Cử nhân', 'Khăn tốt nghiệp', 'Free Size', true, NOW()),
('Vest tốt nghiệp nam đen', 'Vest tốt nghiệp nam đen phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-den.webp', 360000, 175000, 'Yearbook', 'Vest tốt nghiệp', 'Vest nam', 'L', true, NOW()),
('Vest tốt nghiệp nam xanh', 'Vest tốt nghiệp nam xanh phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-xanh.webp', 150000, 70000, 'Yearbook', 'Vest tốt nghiệp', 'Vest nam', 'M', true, NOW()),
('Vest tốt nghiệp nữ trắng', 'Vest tốt nghiệp nữ trắng phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-trang.webp', 180000, 85000, 'Yearbook', 'Vest tốt nghiệp', 'Vest nữ', 'M', true, NOW()),
('Vest tốt nghiệp nữ đen', 'Vest tốt nghiệp nữ đen phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-den.webp', 210000, 100000, 'Yearbook', 'Vest tốt nghiệp', 'Vest nữ', 'S', true, NOW()),
('Đồng phục học sinh THPT Việt Nam', 'Đồng phục học sinh THPT Việt Nam phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-hoc-sinh-thpt-viet-nam.webp', 240000, 115000, 'Yearbook', 'Đồng phục học sinh', 'THPT', 'M', true, NOW()),
('Đồng phục nữ sinh Hàn Quốc', 'Đồng phục nữ sinh Hàn Quốc phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nu-sinh-han-quoc.webp', 270000, 130000, 'Yearbook', 'Đồng phục học sinh', 'Hàn Quốc', 'M', true, NOW()),
('Đồng phục sailor Nhật Bản', 'Đồng phục sailor Nhật Bản phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-sailor-nhat-ban.webp', 300000, 145000, 'Yearbook', 'Đồng phục học sinh', 'Sailor Nhật', 'S', true, NOW()),
('Đồng phục nam sinh Hàn Quốc', 'Đồng phục nam sinh Hàn Quốc phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nam-sinh-han-quoc.webp', 330000, 160000, 'Yearbook', 'Đồng phục học sinh', 'Hàn Quốc', 'L', true, NOW()),
('Chân váy caro nữ sinh', 'Chân váy caro nữ sinh phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/dong-phuc-hoc-sinh/chan-vay-caro-nu-sinh.webp', 360000, 175000, 'Yearbook', 'Đồng phục học sinh', 'Chân váy caro', 'M', true, NOW()),
('Set concept Vintage nâu', 'Set concept Vintage nâu phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-vintage-nau.webp', 150000, 70000, 'Yearbook', 'Concept chụp ảnh', 'Vintage', 'M', true, NOW()),
('Set concept Retro 90s', 'Set concept Retro 90s phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-retro-90s.webp', 180000, 85000, 'Yearbook', 'Concept chụp ảnh', 'Retro', 'M', true, NOW()),
('Set concept Thanh xuân', 'Set concept Thanh xuân phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-thanh-xuan.webp', 210000, 100000, 'Yearbook', 'Concept chụp ảnh', 'Thanh xuân', 'Free Size', true, NOW()),
('Set concept Picnic trắng', 'Set concept Picnic trắng phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-picnic-trang.webp', 240000, 115000, 'Yearbook', 'Concept chụp ảnh', 'Picnic', 'M', true, NOW()),
('Set concept Studio tối giản', 'Set concept Studio tối giản phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-studio-toi-gian.webp', 270000, 130000, 'Yearbook', 'Concept chụp ảnh', 'Studio', 'M', true, NOW()),
('Set concept Báo chí cổ điển', 'Set concept Báo chí cổ điển phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-bao-chi-co-dien.webp', 300000, 145000, 'Yearbook', 'Concept chụp ảnh', 'Newspaper', 'M', true, NOW()),
('Set concept Y2K', 'Set concept Y2K phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-y2k.webp', 330000, 160000, 'Yearbook', 'Concept chụp ảnh', 'Y2K', 'S', true, NOW()),
('Set concept Bohemian', 'Set concept Bohemian phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-bohemian.webp', 360000, 175000, 'Yearbook', 'Concept chụp ảnh', 'Bohemian', 'M', true, NOW()),
('Set concept Công chúa kỷ yếu', 'Set concept Công chúa kỷ yếu phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-cong-chua-ky-yeu.webp', 150000, 70000, 'Yearbook', 'Concept chụp ảnh', 'Princess', 'M', true, NOW()),
('Set concept Dân gian Việt Nam', 'Set concept Dân gian Việt Nam phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-dan-gian-viet-nam.webp', 180000, 85000, 'Yearbook', 'Concept chụp ảnh', 'Dân gian', 'Free Size', true, NOW()),
('Set concept Hoa cỏ mùa hè', 'Set concept Hoa cỏ mùa hè phù hợp chụp kỷ yếu, tốt nghiệp, ảnh nhóm lớp và concept thanh xuân.', '/images/products/yearbook/concept-chup-anh/set-concept-hoa-co-mua-he.webp', 210000, 100000, 'Yearbook', 'Concept chụp ảnh', 'Summer', 'M', true, NOW()),
('Tóc giả Anime hồng pastel', 'Phụ kiện Tóc giả Anime hồng pastel hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-anime-hong-pastel.webp', 50000, 30000, 'Accessories', 'Tóc giả', 'Anime Wig', 'Free Size', true, NOW()),
('Tóc giả Anime vàng', 'Phụ kiện Tóc giả Anime vàng hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-anime-vang.webp', 70000, 40000, 'Accessories', 'Tóc giả', 'Anime Wig', 'Free Size', true, NOW()),
('Tóc giả trắng bạc Fantasy', 'Phụ kiện Tóc giả trắng bạc Fantasy hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-trang-bac-fantasy.webp', 90000, 50000, 'Accessories', 'Tóc giả', 'Fantasy Wig', 'Free Size', true, NOW()),
('Tóc giả đen dài nữ', 'Phụ kiện Tóc giả đen dài nữ hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-den-dai-nu.webp', 110000, 60000, 'Accessories', 'Tóc giả', 'Anime Wig', 'Free Size', true, NOW()),
('Tóc giả xanh dương Idol', 'Phụ kiện Tóc giả xanh dương Idol hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-xanh-duong-idol.webp', 130000, 70000, 'Accessories', 'Tóc giả', 'Idol Wig', 'Free Size', true, NOW()),
('Tóc giả đỏ rượu', 'Phụ kiện Tóc giả đỏ rượu hỗ trợ hoàn thiện outfit cosplay, sự kiện hoặc chụp ảnh.', '/images/products/accessories/toc-gia/toc-gia-do-ruou.webp', 150000, 80000, 'Accessories', 'Tóc giả', 'Anime Wig', 'Free Size', true, NOW());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aurafit') THEN
        GRANT ALL PRIVILEGES ON TABLE costumes TO aurafit;
        GRANT USAGE, SELECT ON SEQUENCE costumes_id_seq TO aurafit;
    END IF;
END $$;

```

## 2. Image Download Checklist CSV
```csv
﻿name,category,subcategory,tag,image_url,local_file_path,search_keyword_to_download
Naruto Uzumaki,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/naruto-uzumaki.webp,frontend/public/images/products/cosplay/naruto/naruto-uzumaki.webp,Naruto Uzumaki cosplay costume product photo
Sasuke Uchiha,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/sasuke-uchiha.webp,frontend/public/images/products/cosplay/naruto/sasuke-uchiha.webp,Sasuke Uchiha cosplay costume product photo
Kakashi Hatake,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/kakashi-hatake.webp,frontend/public/images/products/cosplay/naruto/kakashi-hatake.webp,Kakashi Hatake cosplay costume product photo
Itachi Uchiha,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/itachi-uchiha.webp,frontend/public/images/products/cosplay/naruto/itachi-uchiha.webp,Itachi Uchiha cosplay costume product photo
Minato Namikaze,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/minato-namikaze.webp,frontend/public/images/products/cosplay/naruto/minato-namikaze.webp,Minato Namikaze cosplay costume product photo
Hinata Hyuga,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/hinata-hyuga.webp,frontend/public/images/products/cosplay/naruto/hinata-hyuga.webp,Hinata Hyuga cosplay costume product photo
Akatsuki Cloak,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/akatsuki-cloak.webp,frontend/public/images/products/cosplay/naruto/akatsuki-cloak.webp,Akatsuki Cloak cosplay costume product photo
Gaara,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/gaara.webp,frontend/public/images/products/cosplay/naruto/gaara.webp,Gaara cosplay costume product photo
Madara Uchiha,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/madara-uchiha.webp,frontend/public/images/products/cosplay/naruto/madara-uchiha.webp,Madara Uchiha cosplay costume product photo
Sakura Haruno,Cosplay,Anime,Naruto,/images/products/cosplay/naruto/sakura-haruno.webp,frontend/public/images/products/cosplay/naruto/sakura-haruno.webp,Sakura Haruno cosplay costume product photo
Monkey D. Luffy,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/monkey-d-luffy.webp,frontend/public/images/products/cosplay/one-piece/monkey-d-luffy.webp,Monkey D. Luffy cosplay costume product photo
Roronoa Zoro,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/roronoa-zoro.webp,frontend/public/images/products/cosplay/one-piece/roronoa-zoro.webp,Roronoa Zoro cosplay costume product photo
Nami,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/nami.webp,frontend/public/images/products/cosplay/one-piece/nami.webp,Nami cosplay costume product photo
Sanji,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/sanji.webp,frontend/public/images/products/cosplay/one-piece/sanji.webp,Sanji cosplay costume product photo
Nico Robin,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/nico-robin.webp,frontend/public/images/products/cosplay/one-piece/nico-robin.webp,Nico Robin cosplay costume product photo
Boa Hancock,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/boa-hancock.webp,frontend/public/images/products/cosplay/one-piece/boa-hancock.webp,Boa Hancock cosplay costume product photo
Trafalgar Law,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/trafalgar-law.webp,frontend/public/images/products/cosplay/one-piece/trafalgar-law.webp,Trafalgar Law cosplay costume product photo
Portgas D. Ace,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/portgas-d-ace.webp,frontend/public/images/products/cosplay/one-piece/portgas-d-ace.webp,Portgas D. Ace cosplay costume product photo
Yamato,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/yamato.webp,frontend/public/images/products/cosplay/one-piece/yamato.webp,Yamato cosplay costume product photo
Shanks,Cosplay,Anime,One Piece,/images/products/cosplay/one-piece/shanks.webp,frontend/public/images/products/cosplay/one-piece/shanks.webp,Shanks cosplay costume product photo
Tanjiro Kamado,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/tanjiro-kamado.webp,frontend/public/images/products/cosplay/demon-slayer/tanjiro-kamado.webp,Tanjiro Kamado cosplay costume product photo
Nezuko Kamado,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/nezuko-kamado.webp,frontend/public/images/products/cosplay/demon-slayer/nezuko-kamado.webp,Nezuko Kamado cosplay costume product photo
Zenitsu Agatsuma,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/zenitsu-agatsuma.webp,frontend/public/images/products/cosplay/demon-slayer/zenitsu-agatsuma.webp,Zenitsu Agatsuma cosplay costume product photo
Inosuke Hashibira,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/inosuke-hashibira.webp,frontend/public/images/products/cosplay/demon-slayer/inosuke-hashibira.webp,Inosuke Hashibira cosplay costume product photo
Shinobu Kocho,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/shinobu-kocho.webp,frontend/public/images/products/cosplay/demon-slayer/shinobu-kocho.webp,Shinobu Kocho cosplay costume product photo
Rengoku Kyojuro,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/rengoku-kyojuro.webp,frontend/public/images/products/cosplay/demon-slayer/rengoku-kyojuro.webp,Rengoku Kyojuro cosplay costume product photo
Mitsuri Kanroji,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/mitsuri-kanroji.webp,frontend/public/images/products/cosplay/demon-slayer/mitsuri-kanroji.webp,Mitsuri Kanroji cosplay costume product photo
Giyu Tomioka,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/giyu-tomioka.webp,frontend/public/images/products/cosplay/demon-slayer/giyu-tomioka.webp,Giyu Tomioka cosplay costume product photo
Muichiro Tokito,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/muichiro-tokito.webp,frontend/public/images/products/cosplay/demon-slayer/muichiro-tokito.webp,Muichiro Tokito cosplay costume product photo
Tengen Uzui,Cosplay,Anime,Demon Slayer,/images/products/cosplay/demon-slayer/tengen-uzui.webp,frontend/public/images/products/cosplay/demon-slayer/tengen-uzui.webp,Tengen Uzui cosplay costume product photo
Gojo Satoru,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/gojo-satoru.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/gojo-satoru.webp,Gojo Satoru cosplay costume product photo
Yuji Itadori,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/yuji-itadori.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/yuji-itadori.webp,Yuji Itadori cosplay costume product photo
Megumi Fushiguro,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/megumi-fushiguro.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/megumi-fushiguro.webp,Megumi Fushiguro cosplay costume product photo
Nobara Kugisaki,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/nobara-kugisaki.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/nobara-kugisaki.webp,Nobara Kugisaki cosplay costume product photo
Ryomen Sukuna,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/ryomen-sukuna.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/ryomen-sukuna.webp,Ryomen Sukuna cosplay costume product photo
Suguru Geto,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/suguru-geto.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/suguru-geto.webp,Suguru Geto cosplay costume product photo
Maki Zenin,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/maki-zenin.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/maki-zenin.webp,Maki Zenin cosplay costume product photo
Toji Fushiguro,Cosplay,Anime,Jujutsu Kaisen,/images/products/cosplay/jujutsu-kaisen/toji-fushiguro.webp,frontend/public/images/products/cosplay/jujutsu-kaisen/toji-fushiguro.webp,Toji Fushiguro cosplay costume product photo
Eren Yeager,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/eren-yeager.webp,frontend/public/images/products/cosplay/attack-on-titan/eren-yeager.webp,Eren Yeager cosplay costume product photo
Mikasa Ackerman,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/mikasa-ackerman.webp,frontend/public/images/products/cosplay/attack-on-titan/mikasa-ackerman.webp,Mikasa Ackerman cosplay costume product photo
Levi Ackerman,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/levi-ackerman.webp,frontend/public/images/products/cosplay/attack-on-titan/levi-ackerman.webp,Levi Ackerman cosplay costume product photo
Armin Arlert,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/armin-arlert.webp,frontend/public/images/products/cosplay/attack-on-titan/armin-arlert.webp,Armin Arlert cosplay costume product photo
Survey Corps Uniform,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/survey-corps-uniform.webp,frontend/public/images/products/cosplay/attack-on-titan/survey-corps-uniform.webp,Survey Corps Uniform cosplay costume product photo
Hange Zoe,Cosplay,Anime,Attack on Titan,/images/products/cosplay/attack-on-titan/hange-zoe.webp,frontend/public/images/products/cosplay/attack-on-titan/hange-zoe.webp,Hange Zoe cosplay costume product photo
Anya Forger,Cosplay,Anime,Spy x Family,/images/products/cosplay/spy-x-family/anya-forger.webp,frontend/public/images/products/cosplay/spy-x-family/anya-forger.webp,Anya Forger cosplay costume product photo
Loid Forger,Cosplay,Anime,Spy x Family,/images/products/cosplay/spy-x-family/loid-forger.webp,frontend/public/images/products/cosplay/spy-x-family/loid-forger.webp,Loid Forger cosplay costume product photo
Yor Forger Thorn Princess,Cosplay,Anime,Spy x Family,/images/products/cosplay/spy-x-family/yor-forger-thorn-princess.webp,frontend/public/images/products/cosplay/spy-x-family/yor-forger-thorn-princess.webp,Yor Forger Thorn Princess cosplay costume product photo
Eden Academy Uniform,Cosplay,Anime,Spy x Family,/images/products/cosplay/spy-x-family/eden-academy-uniform.webp,frontend/public/images/products/cosplay/spy-x-family/eden-academy-uniform.webp,Eden Academy Uniform cosplay costume product photo
Yae Miko,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/yae-miko.webp,frontend/public/images/products/cosplay/genshin-impact/yae-miko.webp,Yae Miko cosplay costume product photo
Raiden Shogun,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/raiden-shogun.webp,frontend/public/images/products/cosplay/genshin-impact/raiden-shogun.webp,Raiden Shogun cosplay costume product photo
Hu Tao,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/hu-tao.webp,frontend/public/images/products/cosplay/genshin-impact/hu-tao.webp,Hu Tao cosplay costume product photo
Furina,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/furina.webp,frontend/public/images/products/cosplay/genshin-impact/furina.webp,Furina cosplay costume product photo
Kamisato Ayaka,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/kamisato-ayaka.webp,frontend/public/images/products/cosplay/genshin-impact/kamisato-ayaka.webp,Kamisato Ayaka cosplay costume product photo
Nahida,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/nahida.webp,frontend/public/images/products/cosplay/genshin-impact/nahida.webp,Nahida cosplay costume product photo
Zhongli,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/zhongli.webp,frontend/public/images/products/cosplay/genshin-impact/zhongli.webp,Zhongli cosplay costume product photo
Xiao,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/xiao.webp,frontend/public/images/products/cosplay/genshin-impact/xiao.webp,Xiao cosplay costume product photo
Venti,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/venti.webp,frontend/public/images/products/cosplay/genshin-impact/venti.webp,Venti cosplay costume product photo
Ganyu,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/ganyu.webp,frontend/public/images/products/cosplay/genshin-impact/ganyu.webp,Ganyu cosplay costume product photo
Klee,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/klee.webp,frontend/public/images/products/cosplay/genshin-impact/klee.webp,Klee cosplay costume product photo
Albedo,Cosplay,Game,Genshin Impact,/images/products/cosplay/genshin-impact/albedo.webp,frontend/public/images/products/cosplay/genshin-impact/albedo.webp,Albedo cosplay costume product photo
Kafka,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/kafka.webp,frontend/public/images/products/cosplay/honkai-star-rail/kafka.webp,Kafka cosplay costume product photo
Firefly,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/firefly.webp,frontend/public/images/products/cosplay/honkai-star-rail/firefly.webp,Firefly cosplay costume product photo
Acheron,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/acheron.webp,frontend/public/images/products/cosplay/honkai-star-rail/acheron.webp,Acheron cosplay costume product photo
Silver Wolf,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/silver-wolf.webp,frontend/public/images/products/cosplay/honkai-star-rail/silver-wolf.webp,Silver Wolf cosplay costume product photo
March 7th,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/march-7th.webp,frontend/public/images/products/cosplay/honkai-star-rail/march-7th.webp,March 7th cosplay costume product photo
Dan Heng,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/dan-heng.webp,frontend/public/images/products/cosplay/honkai-star-rail/dan-heng.webp,Dan Heng cosplay costume product photo
Jing Yuan,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/jing-yuan.webp,frontend/public/images/products/cosplay/honkai-star-rail/jing-yuan.webp,Jing Yuan cosplay costume product photo
Himeko,Cosplay,Game,Honkai Star Rail,/images/products/cosplay/honkai-star-rail/himeko.webp,frontend/public/images/products/cosplay/honkai-star-rail/himeko.webp,Himeko cosplay costume product photo
Ahri,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/ahri.webp,frontend/public/images/products/cosplay/league-of-legends/ahri.webp,Ahri cosplay costume product photo
Katarina,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/katarina.webp,frontend/public/images/products/cosplay/league-of-legends/katarina.webp,Katarina cosplay costume product photo
Jinx,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/jinx.webp,frontend/public/images/products/cosplay/league-of-legends/jinx.webp,Jinx cosplay costume product photo
Lux,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/lux.webp,frontend/public/images/products/cosplay/league-of-legends/lux.webp,Lux cosplay costume product photo
Yasuo,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/yasuo.webp,frontend/public/images/products/cosplay/league-of-legends/yasuo.webp,Yasuo cosplay costume product photo
Akali,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/akali.webp,frontend/public/images/products/cosplay/league-of-legends/akali.webp,Akali cosplay costume product photo
Seraphine,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/seraphine.webp,frontend/public/images/products/cosplay/league-of-legends/seraphine.webp,Seraphine cosplay costume product photo
Ezreal,Cosplay,Game,League of Legends,/images/products/cosplay/league-of-legends/ezreal.webp,frontend/public/images/products/cosplay/league-of-legends/ezreal.webp,Ezreal cosplay costume product photo
Jett,Cosplay,Game,Valorant,/images/products/cosplay/valorant/jett.webp,frontend/public/images/products/cosplay/valorant/jett.webp,Jett cosplay costume product photo
Sage,Cosplay,Game,Valorant,/images/products/cosplay/valorant/sage.webp,frontend/public/images/products/cosplay/valorant/sage.webp,Sage cosplay costume product photo
Viper,Cosplay,Game,Valorant,/images/products/cosplay/valorant/viper.webp,frontend/public/images/products/cosplay/valorant/viper.webp,Viper cosplay costume product photo
Reyna,Cosplay,Game,Valorant,/images/products/cosplay/valorant/reyna.webp,frontend/public/images/products/cosplay/valorant/reyna.webp,Reyna cosplay costume product photo
Killjoy,Cosplay,Game,Valorant,/images/products/cosplay/valorant/killjoy.webp,frontend/public/images/products/cosplay/valorant/killjoy.webp,Killjoy cosplay costume product photo
Phoenix,Cosplay,Game,Valorant,/images/products/cosplay/valorant/phoenix.webp,frontend/public/images/products/cosplay/valorant/phoenix.webp,Phoenix cosplay costume product photo
Forest Elf Archer,Cosplay,Fantasy,Forest,/images/products/cosplay/fantasy/forest-elf-archer.webp,frontend/public/images/products/cosplay/fantasy/forest-elf-archer.webp,Forest Elf Archer cosplay costume product photo
Dark Elf Sorceress,Cosplay,Fantasy,Dark,/images/products/cosplay/fantasy/dark-elf-sorceress.webp,frontend/public/images/products/cosplay/fantasy/dark-elf-sorceress.webp,Dark Elf Sorceress cosplay costume product photo
White Angel Wings Set,Cosplay,Fantasy,White,/images/products/cosplay/fantasy/white-angel-wings-set.webp,frontend/public/images/products/cosplay/fantasy/white-angel-wings-set.webp,White Angel Wings Set cosplay costume product photo
Fallen Angel Black Set,Cosplay,Fantasy,Fallen,/images/products/cosplay/fantasy/fallen-angel-black-set.webp,frontend/public/images/products/cosplay/fantasy/fallen-angel-black-set.webp,Fallen Angel Black Set cosplay costume product photo
Fairy Princess Pink,Cosplay,Fantasy,Fairy,/images/products/cosplay/fantasy/fairy-princess-pink.webp,frontend/public/images/products/cosplay/fantasy/fairy-princess-pink.webp,Fairy Princess Pink cosplay costume product photo
Ice Fairy Blue,Cosplay,Fantasy,Ice,/images/products/cosplay/fantasy/ice-fairy-blue.webp,frontend/public/images/products/cosplay/fantasy/ice-fairy-blue.webp,Ice Fairy Blue cosplay costume product photo
Demon King Armor,Cosplay,Fantasy,Demon,/images/products/cosplay/fantasy/demon-king-armor.webp,frontend/public/images/products/cosplay/fantasy/demon-king-armor.webp,Demon King Armor cosplay costume product photo
Witch Classic Black,Cosplay,Fantasy,Witch,/images/products/cosplay/fantasy/witch-classic-black.webp,frontend/public/images/products/cosplay/fantasy/witch-classic-black.webp,Witch Classic Black cosplay costume product photo
Mage Blue Robe,Cosplay,Fantasy,Mage,/images/products/cosplay/fantasy/mage-blue-robe.webp,frontend/public/images/products/cosplay/fantasy/mage-blue-robe.webp,Mage Blue Robe cosplay costume product photo
Knight Armor Silver,Cosplay,Fantasy,Knight,/images/products/cosplay/fantasy/knight-armor-silver.webp,frontend/public/images/products/cosplay/fantasy/knight-armor-silver.webp,Knight Armor Silver cosplay costume product photo
Paladin White Armor,Cosplay,Fantasy,Paladin,/images/products/cosplay/fantasy/paladin-white-armor.webp,frontend/public/images/products/cosplay/fantasy/paladin-white-armor.webp,Paladin White Armor cosplay costume product photo
Royal Princess Ball Gown,Cosplay,Royal Court,Royal Princess Ball,/images/products/cosplay/royal-court/royal-princess-ball-gown.webp,frontend/public/images/products/cosplay/royal-court/royal-princess-ball-gown.webp,Royal Princess Ball Gown cosplay costume product photo
Royal Prince Set,Cosplay,Royal Court,Royal Prince,/images/products/cosplay/royal-court/royal-prince-set.webp,frontend/public/images/products/cosplay/royal-court/royal-prince-set.webp,Royal Prince Set cosplay costume product photo
Royal Queen Gown,Cosplay,Royal Court,Royal Queen,/images/products/cosplay/royal-court/royal-queen-gown.webp,frontend/public/images/products/cosplay/royal-court/royal-queen-gown.webp,Royal Queen Gown cosplay costume product photo
European Nobleman,Cosplay,Royal Court,European Nobleman,/images/products/cosplay/royal-court/european-nobleman.webp,frontend/public/images/products/cosplay/royal-court/european-nobleman.webp,European Nobleman cosplay costume product photo
Harry Potter Gryffindor Robe,Cosplay,Movie & Series,Harry Potter,/images/products/cosplay/harry-potter/harry-potter-gryffindor-robe.webp,frontend/public/images/products/cosplay/harry-potter/harry-potter-gryffindor-robe.webp,Harry Potter Gryffindor Robe cosplay costume product photo
Hermione Granger Robe,Cosplay,Movie & Series,Harry Potter,/images/products/cosplay/harry-potter/hermione-granger-robe.webp,frontend/public/images/products/cosplay/harry-potter/hermione-granger-robe.webp,Hermione Granger Robe cosplay costume product photo
Draco Malfoy Slytherin Robe,Cosplay,Movie & Series,Harry Potter,/images/products/cosplay/harry-potter/draco-malfoy-slytherin-robe.webp,frontend/public/images/products/cosplay/harry-potter/draco-malfoy-slytherin-robe.webp,Draco Malfoy Slytherin Robe cosplay costume product photo
Ravenclaw Student Robe,Cosplay,Movie & Series,Harry Potter,/images/products/cosplay/harry-potter/ravenclaw-student-robe.webp,frontend/public/images/products/cosplay/harry-potter/ravenclaw-student-robe.webp,Ravenclaw Student Robe cosplay costume product photo
Hufflepuff Student Robe,Cosplay,Movie & Series,Harry Potter,/images/products/cosplay/harry-potter/hufflepuff-student-robe.webp,frontend/public/images/products/cosplay/harry-potter/hufflepuff-student-robe.webp,Hufflepuff Student Robe cosplay costume product photo
Spider Man Suit,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/spider-man-suit.webp,frontend/public/images/products/cosplay/marvel/spider-man-suit.webp,Spider Man Suit cosplay costume product photo
Iron Man Inspired Armor,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/iron-man-inspired-armor.webp,frontend/public/images/products/cosplay/marvel/iron-man-inspired-armor.webp,Iron Man Inspired Armor cosplay costume product photo
Captain America Suit,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/captain-america-suit.webp,frontend/public/images/products/cosplay/marvel/captain-america-suit.webp,Captain America Suit cosplay costume product photo
Thor Cape Set,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/thor-cape-set.webp,frontend/public/images/products/cosplay/marvel/thor-cape-set.webp,Thor Cape Set cosplay costume product photo
Doctor Strange Cloak,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/doctor-strange-cloak.webp,frontend/public/images/products/cosplay/marvel/doctor-strange-cloak.webp,Doctor Strange Cloak cosplay costume product photo
Black Widow Suit,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/black-widow-suit.webp,frontend/public/images/products/cosplay/marvel/black-widow-suit.webp,Black Widow Suit cosplay costume product photo
Scarlet Witch Outfit,Cosplay,Movie & Series,Marvel,/images/products/cosplay/marvel/scarlet-witch-outfit.webp,frontend/public/images/products/cosplay/marvel/scarlet-witch-outfit.webp,Scarlet Witch Outfit cosplay costume product photo
Batman Suit,Cosplay,Movie & Series,DC,/images/products/cosplay/dc/batman-suit.webp,frontend/public/images/products/cosplay/dc/batman-suit.webp,Batman Suit cosplay costume product photo
Joker Purple Suit,Cosplay,Movie & Series,DC,/images/products/cosplay/dc/joker-purple-suit.webp,frontend/public/images/products/cosplay/dc/joker-purple-suit.webp,Joker Purple Suit cosplay costume product photo
Harley Quinn Outfit,Cosplay,Movie & Series,DC,/images/products/cosplay/dc/harley-quinn-outfit.webp,frontend/public/images/products/cosplay/dc/harley-quinn-outfit.webp,Harley Quinn Outfit cosplay costume product photo
Wonder Woman Armor,Cosplay,Movie & Series,DC,/images/products/cosplay/dc/wonder-woman-armor.webp,frontend/public/images/products/cosplay/dc/wonder-woman-armor.webp,Wonder Woman Armor cosplay costume product photo
Superman Cape Set,Cosplay,Movie & Series,DC,/images/products/cosplay/dc/superman-cape-set.webp,frontend/public/images/products/cosplay/dc/superman-cape-set.webp,Superman Cape Set cosplay costume product photo
Vest đen classic nam,Events,Vest & Formal,Vest nam,/images/products/events/vest-formal/vest-den-classic-nam.webp,frontend/public/images/products/events/vest-formal/vest-den-classic-nam.webp,Vest đen classic nam costume product photo
Vest xanh navy nam,Events,Vest & Formal,Vest nam,/images/products/events/vest-formal/vest-xanh-navy-nam.webp,frontend/public/images/products/events/vest-formal/vest-xanh-navy-nam.webp,Vest xanh navy nam costume product photo
Vest ghi xám nam,Events,Vest & Formal,Vest nam,/images/products/events/vest-formal/vest-ghi-xam-nam.webp,frontend/public/images/products/events/vest-formal/vest-ghi-xam-nam.webp,Vest ghi xám nam costume product photo
Vest trắng nam,Events,Vest & Formal,Vest nam,/images/products/events/vest-formal/vest-trang-nam.webp,frontend/public/images/products/events/vest-formal/vest-trang-nam.webp,Vest trắng nam costume product photo
Vest cưới ivory nam,Events,Vest & Formal,Vest nam,/images/products/events/vest-formal/vest-cuoi-ivory-nam.webp,frontend/public/images/products/events/vest-formal/vest-cuoi-ivory-nam.webp,Vest cưới ivory nam costume product photo
Vest nữ trắng thanh lịch,Events,Vest & Formal,Vest nữ,/images/products/events/vest-formal/vest-nu-trang-thanh-lich.webp,frontend/public/images/products/events/vest-formal/vest-nu-trang-thanh-lich.webp,Vest nữ trắng thanh lịch costume product photo
Vest nữ đen công sở,Events,Vest & Formal,Vest nữ,/images/products/events/vest-formal/vest-nu-den-cong-so.webp,frontend/public/images/products/events/vest-formal/vest-nu-den-cong-so.webp,Vest nữ đen công sở costume product photo
Vest nữ kem Hàn Quốc,Events,Vest & Formal,Vest nữ,/images/products/events/vest-formal/vest-nu-kem-han-quoc.webp,frontend/public/images/products/events/vest-formal/vest-nu-kem-han-quoc.webp,Vest nữ kem Hàn Quốc costume product photo
Blazer nữ pastel,Events,Vest & Formal,Blazer,/images/products/events/vest-formal/blazer-nu-pastel.webp,frontend/public/images/products/events/vest-formal/blazer-nu-pastel.webp,Blazer nữ pastel costume product photo
Blazer nam beige,Events,Vest & Formal,Blazer,/images/products/events/vest-formal/blazer-nam-beige.webp,frontend/public/images/products/events/vest-formal/blazer-nam-beige.webp,Blazer nam beige costume product photo
Tuxedo đen cao cấp,Events,Vest & Formal,Tuxedo,/images/products/events/vest-formal/tuxedo-den-cao-cap.webp,frontend/public/images/products/events/vest-formal/tuxedo-den-cao-cap.webp,Tuxedo đen cao cấp costume product photo
Tuxedo trắng luxury,Events,Vest & Formal,Tuxedo,/images/products/events/vest-formal/tuxedo-trang-luxury.webp,frontend/public/images/products/events/vest-formal/tuxedo-trang-luxury.webp,Tuxedo trắng luxury costume product photo
Tuxedo velvet đỏ rượu,Events,Vest & Formal,Tuxedo,/images/products/events/vest-formal/tuxedo-velvet-do-ruou.webp,frontend/public/images/products/events/vest-formal/tuxedo-velvet-do-ruou.webp,Tuxedo velvet đỏ rượu costume product photo
Váy dạ hội đỏ Ruby đuôi cá,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-do-ruby-duoi-ca.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-do-ruby-duoi-ca.webp,Váy dạ hội đỏ Ruby đuôi cá costume product photo
Váy dạ hội xanh Sapphire,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-xanh-sapphire.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-xanh-sapphire.webp,Váy dạ hội xanh Sapphire costume product photo
Váy dạ hội đen Luxury,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-den-luxury.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-den-luxury.webp,Váy dạ hội đen Luxury costume product photo
Váy dạ hội vàng Champagne,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-vang-champagne.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-vang-champagne.webp,Váy dạ hội vàng Champagne costume product photo
Váy dạ hội bạc ánh kim,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-bac-anh-kim.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-bac-anh-kim.webp,Váy dạ hội bạc ánh kim costume product photo
Váy dạ hội tím Lavender,Events,Dạ hội,Evening Gown,/images/products/events/da-hoi/vay-da-hoi-tim-lavender.webp,frontend/public/images/products/events/da-hoi/vay-da-hoi-tim-lavender.webp,Váy dạ hội tím Lavender costume product photo
Prom Dress hồng pastel,Events,Dạ hội,Prom Dress,/images/products/events/da-hoi/prom-dress-hong-pastel.webp,frontend/public/images/products/events/da-hoi/prom-dress-hong-pastel.webp,Prom Dress hồng pastel costume product photo
Prom Dress xanh baby,Events,Dạ hội,Prom Dress,/images/products/events/da-hoi/prom-dress-xanh-baby.webp,frontend/public/images/products/events/da-hoi/prom-dress-xanh-baby.webp,Prom Dress xanh baby costume product photo
Prom Dress tím công chúa,Events,Dạ hội,Prom Dress,/images/products/events/da-hoi/prom-dress-tim-cong-chua.webp,frontend/public/images/products/events/da-hoi/prom-dress-tim-cong-chua.webp,Prom Dress tím công chúa costume product photo
Prom Dress trắng tinh khôi,Events,Dạ hội,Prom Dress,/images/products/events/da-hoi/prom-dress-trang-tinh-khoi.webp,frontend/public/images/products/events/da-hoi/prom-dress-trang-tinh-khoi.webp,Prom Dress trắng tinh khôi costume product photo
Cocktail Dress đen basic,Events,Dạ hội,Cocktail Dress,/images/products/events/da-hoi/cocktail-dress-den-basic.webp,frontend/public/images/products/events/da-hoi/cocktail-dress-den-basic.webp,Cocktail Dress đen basic costume product photo
Cocktail Dress đỏ satin,Events,Dạ hội,Cocktail Dress,/images/products/events/da-hoi/cocktail-dress-do-satin.webp,frontend/public/images/products/events/da-hoi/cocktail-dress-do-satin.webp,Cocktail Dress đỏ satin costume product photo
Cocktail Dress xanh emerald,Events,Dạ hội,Cocktail Dress,/images/products/events/da-hoi/cocktail-dress-xanh-emerald.webp,frontend/public/images/products/events/da-hoi/cocktail-dress-xanh-emerald.webp,Cocktail Dress xanh emerald costume product photo
Mascot Gấu nâu,Events,Mascot,Gấu,/images/products/events/mascot/mascot-gau-nau.webp,frontend/public/images/products/events/mascot/mascot-gau-nau.webp,Mascot Gấu nâu costume product photo
Mascot Thỏ trắng,Events,Mascot,Thỏ,/images/products/events/mascot/mascot-tho-trang.webp,frontend/public/images/products/events/mascot/mascot-tho-trang.webp,Mascot Thỏ trắng costume product photo
Mascot Khủng long xanh,Events,Mascot,Khủng long,/images/products/events/mascot/mascot-khung-long-xanh.webp,frontend/public/images/products/events/mascot/mascot-khung-long-xanh.webp,Mascot Khủng long xanh costume product photo
Mascot Mèo vàng,Events,Mascot,Mèo,/images/products/events/mascot/mascot-meo-vang.webp,frontend/public/images/products/events/mascot/mascot-meo-vang.webp,Mascot Mèo vàng costume product photo
Đồng phục Team Building đỏ,Events,Team Building,Áo nhóm,/images/products/events/team-building/dong-phuc-team-building-do.webp,frontend/public/images/products/events/team-building/dong-phuc-team-building-do.webp,Đồng phục Team Building đỏ costume product photo
Đồng phục Team Building xanh,Events,Team Building,Áo nhóm,/images/products/events/team-building/dong-phuc-team-building-xanh.webp,frontend/public/images/products/events/team-building/dong-phuc-team-building-xanh.webp,Đồng phục Team Building xanh costume product photo
Đồng phục Team Building vàng,Events,Team Building,Áo nhóm,/images/products/events/team-building/dong-phuc-team-building-vang.webp,frontend/public/images/products/events/team-building/dong-phuc-team-building-vang.webp,Đồng phục Team Building vàng costume product photo
Áo dài lễ tân đỏ,Events,Lễ hội,Lễ tân,/images/products/events/le-hoi/ao-dai-le-tan-do.webp,frontend/public/images/products/events/le-hoi/ao-dai-le-tan-do.webp,Áo dài lễ tân đỏ costume product photo
Đầm MC sự kiện trắng,Events,Lễ hội,MC,/images/products/events/le-hoi/dam-mc-su-kien-trang.webp,frontend/public/images/products/events/le-hoi/dam-mc-su-kien-trang.webp,Đầm MC sự kiện trắng costume product photo
Trang phục Noel ông già,Events,Lễ hội,Noel,/images/products/events/le-hoi/trang-phuc-noel-ong-gia.webp,frontend/public/images/products/events/le-hoi/trang-phuc-noel-ong-gia.webp,Trang phục Noel ông già costume product photo
Trang phục Noel nữ đỏ,Events,Lễ hội,Noel,/images/products/events/le-hoi/trang-phuc-noel-nu-do.webp,frontend/public/images/products/events/le-hoi/trang-phuc-noel-nu-do.webp,Trang phục Noel nữ đỏ costume product photo
Trang phục Halloween bí ngô,Events,Lễ hội,Halloween,/images/products/events/le-hoi/trang-phuc-halloween-bi-ngo.webp,frontend/public/images/products/events/le-hoi/trang-phuc-halloween-bi-ngo.webp,Trang phục Halloween bí ngô costume product photo
Trang phục Halloween ma cà rồng,Events,Lễ hội,Halloween,/images/products/events/le-hoi/trang-phuc-halloween-ma-ca-rong.webp,frontend/public/images/products/events/le-hoi/trang-phuc-halloween-ma-ca-rong.webp,Trang phục Halloween ma cà rồng costume product photo
Đầm cưới trắng ren,Events,Wedding,Wedding Dress,/images/products/events/wedding/dam-cuoi-trang-ren.webp,frontend/public/images/products/events/wedding/dam-cuoi-trang-ren.webp,Đầm cưới trắng ren costume product photo
Đầm phụ dâu hồng,Events,Wedding,Bridesmaid,/images/products/events/wedding/dam-phu-dau-hong.webp,frontend/public/images/products/events/wedding/dam-phu-dau-hong.webp,Đầm phụ dâu hồng costume product photo
Đầm phụ dâu xanh,Events,Wedding,Bridesmaid,/images/products/events/wedding/dam-phu-dau-xanh.webp,frontend/public/images/products/events/wedding/dam-phu-dau-xanh.webp,Đầm phụ dâu xanh costume product photo
Áo dài cưới đỏ,Events,Wedding,Áo dài cưới,/images/products/events/wedding/ao-dai-cuoi-do.webp,frontend/public/images/products/events/wedding/ao-dai-cuoi-do.webp,Áo dài cưới đỏ costume product photo
Áo dài cưới trắng,Events,Wedding,Áo dài cưới,/images/products/events/wedding/ao-dai-cuoi-trang.webp,frontend/public/images/products/events/wedding/ao-dai-cuoi-trang.webp,Áo dài cưới trắng costume product photo
Suit chú rể đen,Events,Wedding,Groom Suit,/images/products/events/wedding/suit-chu-re-den.webp,frontend/public/images/products/events/wedding/suit-chu-re-den.webp,Suit chú rể đen costume product photo
Áo dài trắng học sinh,Yearbook,Áo dài,Áo dài trắng,/images/products/yearbook/ao-dai/ao-dai-trang-hoc-sinh.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-trang-hoc-sinh.webp,Áo dài trắng học sinh costume product photo
Áo dài trắng lụa tơ tằm,Yearbook,Áo dài,Áo dài trắng,/images/products/yearbook/ao-dai/ao-dai-trang-lua-to-tam.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-trang-lua-to-tam.webp,Áo dài trắng lụa tơ tằm costume product photo
Áo dài đỏ truyền thống,Yearbook,Áo dài,Áo dài truyền thống,/images/products/yearbook/ao-dai/ao-dai-do-truyen-thong.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-do-truyen-thong.webp,Áo dài đỏ truyền thống costume product photo
Áo dài xanh ngọc,Yearbook,Áo dài,Áo dài cách tân,/images/products/yearbook/ao-dai/ao-dai-xanh-ngoc.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-xanh-ngoc.webp,Áo dài xanh ngọc costume product photo
Áo dài vàng hoa sen,Yearbook,Áo dài,Áo dài truyền thống,/images/products/yearbook/ao-dai/ao-dai-vang-hoa-sen.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-vang-hoa-sen.webp,Áo dài vàng hoa sen costume product photo
Áo dài hồng pastel,Yearbook,Áo dài,Áo dài cách tân,/images/products/yearbook/ao-dai/ao-dai-hong-pastel.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-hong-pastel.webp,Áo dài hồng pastel costume product photo
Áo dài tím Huế,Yearbook,Áo dài,Áo dài truyền thống,/images/products/yearbook/ao-dai/ao-dai-tim-hue.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-tim-hue.webp,Áo dài tím Huế costume product photo
Áo dài nam trắng,Yearbook,Áo dài,Áo dài nam,/images/products/yearbook/ao-dai/ao-dai-nam-trang.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-nam-trang.webp,Áo dài nam trắng costume product photo
Áo dài nam xanh navy,Yearbook,Áo dài,Áo dài nam,/images/products/yearbook/ao-dai/ao-dai-nam-xanh-navy.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-nam-xanh-navy.webp,Áo dài nam xanh navy costume product photo
Áo dài cách tân nhóm,Yearbook,Áo dài,Áo dài cách tân,/images/products/yearbook/ao-dai/ao-dai-cach-tan-nhom.webp,frontend/public/images/products/yearbook/ao-dai/ao-dai-cach-tan-nhom.webp,Áo dài cách tân nhóm costume product photo
Áo cử nhân đại học kèm mũ,Yearbook,Cử nhân,Áo cử nhân,/images/products/yearbook/cu-nhan/ao-cu-nhan-dai-hoc-kem-mu.webp,frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-dai-hoc-kem-mu.webp,Áo cử nhân đại học kèm mũ costume product photo
Áo cử nhân xanh navy,Yearbook,Cử nhân,Áo cử nhân,/images/products/yearbook/cu-nhan/ao-cu-nhan-xanh-navy.webp,frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-xanh-navy.webp,Áo cử nhân xanh navy costume product photo
Áo cử nhân đỏ đô,Yearbook,Cử nhân,Áo cử nhân,/images/products/yearbook/cu-nhan/ao-cu-nhan-do-do.webp,frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-do-do.webp,Áo cử nhân đỏ đô costume product photo
Mũ cử nhân tốt nghiệp,Yearbook,Cử nhân,Mũ cử nhân,/images/products/yearbook/cu-nhan/mu-cu-nhan-tot-nghiep.webp,frontend/public/images/products/yearbook/cu-nhan/mu-cu-nhan-tot-nghiep.webp,Mũ cử nhân tốt nghiệp costume product photo
Khăn tốt nghiệp vàng,Yearbook,Cử nhân,Khăn tốt nghiệp,/images/products/yearbook/cu-nhan/khan-tot-nghiep-vang.webp,frontend/public/images/products/yearbook/cu-nhan/khan-tot-nghiep-vang.webp,Khăn tốt nghiệp vàng costume product photo
Vest tốt nghiệp nam đen,Yearbook,Vest tốt nghiệp,Vest nam,/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-den.webp,frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-den.webp,Vest tốt nghiệp nam đen costume product photo
Vest tốt nghiệp nam xanh,Yearbook,Vest tốt nghiệp,Vest nam,/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-xanh.webp,frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-xanh.webp,Vest tốt nghiệp nam xanh costume product photo
Vest tốt nghiệp nữ trắng,Yearbook,Vest tốt nghiệp,Vest nữ,/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-trang.webp,frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-trang.webp,Vest tốt nghiệp nữ trắng costume product photo
Vest tốt nghiệp nữ đen,Yearbook,Vest tốt nghiệp,Vest nữ,/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-den.webp,frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-den.webp,Vest tốt nghiệp nữ đen costume product photo
Đồng phục học sinh THPT Việt Nam,Yearbook,Đồng phục học sinh,THPT,/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-hoc-sinh-thpt-viet-nam.webp,frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-hoc-sinh-thpt-viet-nam.webp,Đồng phục học sinh THPT Việt Nam costume product photo
Đồng phục nữ sinh Hàn Quốc,Yearbook,Đồng phục học sinh,Hàn Quốc,/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nu-sinh-han-quoc.webp,frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nu-sinh-han-quoc.webp,Đồng phục nữ sinh Hàn Quốc costume product photo
Đồng phục sailor Nhật Bản,Yearbook,Đồng phục học sinh,Sailor Nhật,/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-sailor-nhat-ban.webp,frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-sailor-nhat-ban.webp,Đồng phục sailor Nhật Bản costume product photo
Đồng phục nam sinh Hàn Quốc,Yearbook,Đồng phục học sinh,Hàn Quốc,/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nam-sinh-han-quoc.webp,frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nam-sinh-han-quoc.webp,Đồng phục nam sinh Hàn Quốc costume product photo
Chân váy caro nữ sinh,Yearbook,Đồng phục học sinh,Chân váy caro,/images/products/yearbook/dong-phuc-hoc-sinh/chan-vay-caro-nu-sinh.webp,frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/chan-vay-caro-nu-sinh.webp,Chân váy caro nữ sinh costume product photo
Set concept Vintage nâu,Yearbook,Concept chụp ảnh,Vintage,/images/products/yearbook/concept-chup-anh/set-concept-vintage-nau.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-vintage-nau.webp,Set concept Vintage nâu costume product photo
Set concept Retro 90s,Yearbook,Concept chụp ảnh,Retro,/images/products/yearbook/concept-chup-anh/set-concept-retro-90s.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-retro-90s.webp,Set concept Retro 90s costume product photo
Set concept Thanh xuân,Yearbook,Concept chụp ảnh,Thanh xuân,/images/products/yearbook/concept-chup-anh/set-concept-thanh-xuan.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-thanh-xuan.webp,Set concept Thanh xuân costume product photo
Set concept Picnic trắng,Yearbook,Concept chụp ảnh,Picnic,/images/products/yearbook/concept-chup-anh/set-concept-picnic-trang.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-picnic-trang.webp,Set concept Picnic trắng costume product photo
Set concept Studio tối giản,Yearbook,Concept chụp ảnh,Studio,/images/products/yearbook/concept-chup-anh/set-concept-studio-toi-gian.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-studio-toi-gian.webp,Set concept Studio tối giản costume product photo
Set concept Báo chí cổ điển,Yearbook,Concept chụp ảnh,Newspaper,/images/products/yearbook/concept-chup-anh/set-concept-bao-chi-co-dien.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-bao-chi-co-dien.webp,Set concept Báo chí cổ điển costume product photo
Set concept Y2K,Yearbook,Concept chụp ảnh,Y2K,/images/products/yearbook/concept-chup-anh/set-concept-y2k.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-y2k.webp,Set concept Y2K costume product photo
Set concept Bohemian,Yearbook,Concept chụp ảnh,Bohemian,/images/products/yearbook/concept-chup-anh/set-concept-bohemian.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-bohemian.webp,Set concept Bohemian costume product photo
Set concept Công chúa kỷ yếu,Yearbook,Concept chụp ảnh,Princess,/images/products/yearbook/concept-chup-anh/set-concept-cong-chua-ky-yeu.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-cong-chua-ky-yeu.webp,Set concept Công chúa kỷ yếu costume product photo
Set concept Dân gian Việt Nam,Yearbook,Concept chụp ảnh,Dân gian,/images/products/yearbook/concept-chup-anh/set-concept-dan-gian-viet-nam.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-dan-gian-viet-nam.webp,Set concept Dân gian Việt Nam costume product photo
Set concept Hoa cỏ mùa hè,Yearbook,Concept chụp ảnh,Summer,/images/products/yearbook/concept-chup-anh/set-concept-hoa-co-mua-he.webp,frontend/public/images/products/yearbook/concept-chup-anh/set-concept-hoa-co-mua-he.webp,Set concept Hoa cỏ mùa hè costume product photo
Tóc giả Anime hồng pastel,Accessories,Tóc giả,Anime Wig,/images/products/accessories/toc-gia/toc-gia-anime-hong-pastel.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-anime-hong-pastel.webp,Tóc giả Anime hồng pastel costume product photo
Tóc giả Anime vàng,Accessories,Tóc giả,Anime Wig,/images/products/accessories/toc-gia/toc-gia-anime-vang.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-anime-vang.webp,Tóc giả Anime vàng costume product photo
Tóc giả trắng bạc Fantasy,Accessories,Tóc giả,Fantasy Wig,/images/products/accessories/toc-gia/toc-gia-trang-bac-fantasy.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-trang-bac-fantasy.webp,Tóc giả trắng bạc Fantasy costume product photo
Tóc giả đen dài nữ,Accessories,Tóc giả,Anime Wig,/images/products/accessories/toc-gia/toc-gia-den-dai-nu.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-den-dai-nu.webp,Tóc giả đen dài nữ costume product photo
Tóc giả xanh dương Idol,Accessories,Tóc giả,Idol Wig,/images/products/accessories/toc-gia/toc-gia-xanh-duong-idol.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-xanh-duong-idol.webp,Tóc giả xanh dương Idol costume product photo
Tóc giả đỏ rượu,Accessories,Tóc giả,Anime Wig,/images/products/accessories/toc-gia/toc-gia-do-ruou.webp,frontend/public/images/products/accessories/toc-gia/toc-gia-do-ruou.webp,Tóc giả đỏ rượu costume product photo

```

## 3. Image Folder Checklist
# AuraFit image checklist
Đặt ảnh đúng theo `local_file_path`. Database đã trỏ sẵn vào các đường dẫn này.

## Cosplay / Anime / Naruto
- `Naruto Uzumaki` → `frontend/public/images/products/cosplay/naruto/naruto-uzumaki.webp`
- `Sasuke Uchiha` → `frontend/public/images/products/cosplay/naruto/sasuke-uchiha.webp`
- `Kakashi Hatake` → `frontend/public/images/products/cosplay/naruto/kakashi-hatake.webp`
- `Itachi Uchiha` → `frontend/public/images/products/cosplay/naruto/itachi-uchiha.webp`
- `Minato Namikaze` → `frontend/public/images/products/cosplay/naruto/minato-namikaze.webp`
- `Hinata Hyuga` → `frontend/public/images/products/cosplay/naruto/hinata-hyuga.webp`
- `Akatsuki Cloak` → `frontend/public/images/products/cosplay/naruto/akatsuki-cloak.webp`
- `Gaara` → `frontend/public/images/products/cosplay/naruto/gaara.webp`
- `Madara Uchiha` → `frontend/public/images/products/cosplay/naruto/madara-uchiha.webp`
- `Sakura Haruno` → `frontend/public/images/products/cosplay/naruto/sakura-haruno.webp`

## Cosplay / Anime / One Piece
- `Monkey D. Luffy` → `frontend/public/images/products/cosplay/one-piece/monkey-d-luffy.webp`
- `Roronoa Zoro` → `frontend/public/images/products/cosplay/one-piece/roronoa-zoro.webp`
- `Nami` → `frontend/public/images/products/cosplay/one-piece/nami.webp`
- `Sanji` → `frontend/public/images/products/cosplay/one-piece/sanji.webp`
- `Nico Robin` → `frontend/public/images/products/cosplay/one-piece/nico-robin.webp`
- `Boa Hancock` → `frontend/public/images/products/cosplay/one-piece/boa-hancock.webp`
- `Trafalgar Law` → `frontend/public/images/products/cosplay/one-piece/trafalgar-law.webp`
- `Portgas D. Ace` → `frontend/public/images/products/cosplay/one-piece/portgas-d-ace.webp`
- `Yamato` → `frontend/public/images/products/cosplay/one-piece/yamato.webp`
- `Shanks` → `frontend/public/images/products/cosplay/one-piece/shanks.webp`

## Cosplay / Anime / Demon Slayer
- `Tanjiro Kamado` → `frontend/public/images/products/cosplay/demon-slayer/tanjiro-kamado.webp`
- `Nezuko Kamado` → `frontend/public/images/products/cosplay/demon-slayer/nezuko-kamado.webp`
- `Zenitsu Agatsuma` → `frontend/public/images/products/cosplay/demon-slayer/zenitsu-agatsuma.webp`
- `Inosuke Hashibira` → `frontend/public/images/products/cosplay/demon-slayer/inosuke-hashibira.webp`
- `Shinobu Kocho` → `frontend/public/images/products/cosplay/demon-slayer/shinobu-kocho.webp`
- `Rengoku Kyojuro` → `frontend/public/images/products/cosplay/demon-slayer/rengoku-kyojuro.webp`
- `Mitsuri Kanroji` → `frontend/public/images/products/cosplay/demon-slayer/mitsuri-kanroji.webp`
- `Giyu Tomioka` → `frontend/public/images/products/cosplay/demon-slayer/giyu-tomioka.webp`
- `Muichiro Tokito` → `frontend/public/images/products/cosplay/demon-slayer/muichiro-tokito.webp`
- `Tengen Uzui` → `frontend/public/images/products/cosplay/demon-slayer/tengen-uzui.webp`

## Cosplay / Anime / Jujutsu Kaisen
- `Gojo Satoru` → `frontend/public/images/products/cosplay/jujutsu-kaisen/gojo-satoru.webp`
- `Yuji Itadori` → `frontend/public/images/products/cosplay/jujutsu-kaisen/yuji-itadori.webp`
- `Megumi Fushiguro` → `frontend/public/images/products/cosplay/jujutsu-kaisen/megumi-fushiguro.webp`
- `Nobara Kugisaki` → `frontend/public/images/products/cosplay/jujutsu-kaisen/nobara-kugisaki.webp`
- `Ryomen Sukuna` → `frontend/public/images/products/cosplay/jujutsu-kaisen/ryomen-sukuna.webp`
- `Suguru Geto` → `frontend/public/images/products/cosplay/jujutsu-kaisen/suguru-geto.webp`
- `Maki Zenin` → `frontend/public/images/products/cosplay/jujutsu-kaisen/maki-zenin.webp`
- `Toji Fushiguro` → `frontend/public/images/products/cosplay/jujutsu-kaisen/toji-fushiguro.webp`

## Cosplay / Anime / Attack on Titan
- `Eren Yeager` → `frontend/public/images/products/cosplay/attack-on-titan/eren-yeager.webp`
- `Mikasa Ackerman` → `frontend/public/images/products/cosplay/attack-on-titan/mikasa-ackerman.webp`
- `Levi Ackerman` → `frontend/public/images/products/cosplay/attack-on-titan/levi-ackerman.webp`
- `Armin Arlert` → `frontend/public/images/products/cosplay/attack-on-titan/armin-arlert.webp`
- `Survey Corps Uniform` → `frontend/public/images/products/cosplay/attack-on-titan/survey-corps-uniform.webp`
- `Hange Zoe` → `frontend/public/images/products/cosplay/attack-on-titan/hange-zoe.webp`

## Cosplay / Anime / Spy x Family
- `Anya Forger` → `frontend/public/images/products/cosplay/spy-x-family/anya-forger.webp`
- `Loid Forger` → `frontend/public/images/products/cosplay/spy-x-family/loid-forger.webp`
- `Yor Forger Thorn Princess` → `frontend/public/images/products/cosplay/spy-x-family/yor-forger-thorn-princess.webp`
- `Eden Academy Uniform` → `frontend/public/images/products/cosplay/spy-x-family/eden-academy-uniform.webp`

## Cosplay / Game / Genshin Impact
- `Yae Miko` → `frontend/public/images/products/cosplay/genshin-impact/yae-miko.webp`
- `Raiden Shogun` → `frontend/public/images/products/cosplay/genshin-impact/raiden-shogun.webp`
- `Hu Tao` → `frontend/public/images/products/cosplay/genshin-impact/hu-tao.webp`
- `Furina` → `frontend/public/images/products/cosplay/genshin-impact/furina.webp`
- `Kamisato Ayaka` → `frontend/public/images/products/cosplay/genshin-impact/kamisato-ayaka.webp`
- `Nahida` → `frontend/public/images/products/cosplay/genshin-impact/nahida.webp`
- `Zhongli` → `frontend/public/images/products/cosplay/genshin-impact/zhongli.webp`
- `Xiao` → `frontend/public/images/products/cosplay/genshin-impact/xiao.webp`
- `Venti` → `frontend/public/images/products/cosplay/genshin-impact/venti.webp`
- `Ganyu` → `frontend/public/images/products/cosplay/genshin-impact/ganyu.webp`
- `Klee` → `frontend/public/images/products/cosplay/genshin-impact/klee.webp`
- `Albedo` → `frontend/public/images/products/cosplay/genshin-impact/albedo.webp`

## Cosplay / Game / Honkai Star Rail
- `Kafka` → `frontend/public/images/products/cosplay/honkai-star-rail/kafka.webp`
- `Firefly` → `frontend/public/images/products/cosplay/honkai-star-rail/firefly.webp`
- `Acheron` → `frontend/public/images/products/cosplay/honkai-star-rail/acheron.webp`
- `Silver Wolf` → `frontend/public/images/products/cosplay/honkai-star-rail/silver-wolf.webp`
- `March 7th` → `frontend/public/images/products/cosplay/honkai-star-rail/march-7th.webp`
- `Dan Heng` → `frontend/public/images/products/cosplay/honkai-star-rail/dan-heng.webp`
- `Jing Yuan` → `frontend/public/images/products/cosplay/honkai-star-rail/jing-yuan.webp`
- `Himeko` → `frontend/public/images/products/cosplay/honkai-star-rail/himeko.webp`

## Cosplay / Game / League of Legends
- `Ahri` → `frontend/public/images/products/cosplay/league-of-legends/ahri.webp`
- `Katarina` → `frontend/public/images/products/cosplay/league-of-legends/katarina.webp`
- `Jinx` → `frontend/public/images/products/cosplay/league-of-legends/jinx.webp`
- `Lux` → `frontend/public/images/products/cosplay/league-of-legends/lux.webp`
- `Yasuo` → `frontend/public/images/products/cosplay/league-of-legends/yasuo.webp`
- `Akali` → `frontend/public/images/products/cosplay/league-of-legends/akali.webp`
- `Seraphine` → `frontend/public/images/products/cosplay/league-of-legends/seraphine.webp`
- `Ezreal` → `frontend/public/images/products/cosplay/league-of-legends/ezreal.webp`

## Cosplay / Game / Valorant
- `Jett` → `frontend/public/images/products/cosplay/valorant/jett.webp`
- `Sage` → `frontend/public/images/products/cosplay/valorant/sage.webp`
- `Viper` → `frontend/public/images/products/cosplay/valorant/viper.webp`
- `Reyna` → `frontend/public/images/products/cosplay/valorant/reyna.webp`
- `Killjoy` → `frontend/public/images/products/cosplay/valorant/killjoy.webp`
- `Phoenix` → `frontend/public/images/products/cosplay/valorant/phoenix.webp`

## Cosplay / Fantasy / Forest
- `Forest Elf Archer` → `frontend/public/images/products/cosplay/fantasy/forest-elf-archer.webp`

## Cosplay / Fantasy / Dark
- `Dark Elf Sorceress` → `frontend/public/images/products/cosplay/fantasy/dark-elf-sorceress.webp`

## Cosplay / Fantasy / White
- `White Angel Wings Set` → `frontend/public/images/products/cosplay/fantasy/white-angel-wings-set.webp`

## Cosplay / Fantasy / Fallen
- `Fallen Angel Black Set` → `frontend/public/images/products/cosplay/fantasy/fallen-angel-black-set.webp`

## Cosplay / Fantasy / Fairy
- `Fairy Princess Pink` → `frontend/public/images/products/cosplay/fantasy/fairy-princess-pink.webp`

## Cosplay / Fantasy / Ice
- `Ice Fairy Blue` → `frontend/public/images/products/cosplay/fantasy/ice-fairy-blue.webp`

## Cosplay / Fantasy / Demon
- `Demon King Armor` → `frontend/public/images/products/cosplay/fantasy/demon-king-armor.webp`

## Cosplay / Fantasy / Witch
- `Witch Classic Black` → `frontend/public/images/products/cosplay/fantasy/witch-classic-black.webp`

## Cosplay / Fantasy / Mage
- `Mage Blue Robe` → `frontend/public/images/products/cosplay/fantasy/mage-blue-robe.webp`

## Cosplay / Fantasy / Knight
- `Knight Armor Silver` → `frontend/public/images/products/cosplay/fantasy/knight-armor-silver.webp`

## Cosplay / Fantasy / Paladin
- `Paladin White Armor` → `frontend/public/images/products/cosplay/fantasy/paladin-white-armor.webp`

## Cosplay / Royal Court / Royal Princess Ball
- `Royal Princess Ball Gown` → `frontend/public/images/products/cosplay/royal-court/royal-princess-ball-gown.webp`

## Cosplay / Royal Court / Royal Prince
- `Royal Prince Set` → `frontend/public/images/products/cosplay/royal-court/royal-prince-set.webp`

## Cosplay / Royal Court / Royal Queen
- `Royal Queen Gown` → `frontend/public/images/products/cosplay/royal-court/royal-queen-gown.webp`

## Cosplay / Royal Court / European Nobleman
- `European Nobleman` → `frontend/public/images/products/cosplay/royal-court/european-nobleman.webp`

## Cosplay / Movie & Series / Harry Potter
- `Harry Potter Gryffindor Robe` → `frontend/public/images/products/cosplay/harry-potter/harry-potter-gryffindor-robe.webp`
- `Hermione Granger Robe` → `frontend/public/images/products/cosplay/harry-potter/hermione-granger-robe.webp`
- `Draco Malfoy Slytherin Robe` → `frontend/public/images/products/cosplay/harry-potter/draco-malfoy-slytherin-robe.webp`
- `Ravenclaw Student Robe` → `frontend/public/images/products/cosplay/harry-potter/ravenclaw-student-robe.webp`
- `Hufflepuff Student Robe` → `frontend/public/images/products/cosplay/harry-potter/hufflepuff-student-robe.webp`

## Cosplay / Movie & Series / Marvel
- `Spider Man Suit` → `frontend/public/images/products/cosplay/marvel/spider-man-suit.webp`
- `Iron Man Inspired Armor` → `frontend/public/images/products/cosplay/marvel/iron-man-inspired-armor.webp`
- `Captain America Suit` → `frontend/public/images/products/cosplay/marvel/captain-america-suit.webp`
- `Thor Cape Set` → `frontend/public/images/products/cosplay/marvel/thor-cape-set.webp`
- `Doctor Strange Cloak` → `frontend/public/images/products/cosplay/marvel/doctor-strange-cloak.webp`
- `Black Widow Suit` → `frontend/public/images/products/cosplay/marvel/black-widow-suit.webp`
- `Scarlet Witch Outfit` → `frontend/public/images/products/cosplay/marvel/scarlet-witch-outfit.webp`

## Cosplay / Movie & Series / DC
- `Batman Suit` → `frontend/public/images/products/cosplay/dc/batman-suit.webp`
- `Joker Purple Suit` → `frontend/public/images/products/cosplay/dc/joker-purple-suit.webp`
- `Harley Quinn Outfit` → `frontend/public/images/products/cosplay/dc/harley-quinn-outfit.webp`
- `Wonder Woman Armor` → `frontend/public/images/products/cosplay/dc/wonder-woman-armor.webp`
- `Superman Cape Set` → `frontend/public/images/products/cosplay/dc/superman-cape-set.webp`

## Events / Vest & Formal / Vest nam
- `Vest đen classic nam` → `frontend/public/images/products/events/vest-formal/vest-den-classic-nam.webp`
- `Vest xanh navy nam` → `frontend/public/images/products/events/vest-formal/vest-xanh-navy-nam.webp`
- `Vest ghi xám nam` → `frontend/public/images/products/events/vest-formal/vest-ghi-xam-nam.webp`
- `Vest trắng nam` → `frontend/public/images/products/events/vest-formal/vest-trang-nam.webp`
- `Vest cưới ivory nam` → `frontend/public/images/products/events/vest-formal/vest-cuoi-ivory-nam.webp`

## Events / Vest & Formal / Vest nữ
- `Vest nữ trắng thanh lịch` → `frontend/public/images/products/events/vest-formal/vest-nu-trang-thanh-lich.webp`
- `Vest nữ đen công sở` → `frontend/public/images/products/events/vest-formal/vest-nu-den-cong-so.webp`
- `Vest nữ kem Hàn Quốc` → `frontend/public/images/products/events/vest-formal/vest-nu-kem-han-quoc.webp`

## Events / Vest & Formal / Blazer
- `Blazer nữ pastel` → `frontend/public/images/products/events/vest-formal/blazer-nu-pastel.webp`
- `Blazer nam beige` → `frontend/public/images/products/events/vest-formal/blazer-nam-beige.webp`

## Events / Vest & Formal / Tuxedo
- `Tuxedo đen cao cấp` → `frontend/public/images/products/events/vest-formal/tuxedo-den-cao-cap.webp`
- `Tuxedo trắng luxury` → `frontend/public/images/products/events/vest-formal/tuxedo-trang-luxury.webp`
- `Tuxedo velvet đỏ rượu` → `frontend/public/images/products/events/vest-formal/tuxedo-velvet-do-ruou.webp`

## Events / Dạ hội / Evening Gown
- `Váy dạ hội đỏ Ruby đuôi cá` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-do-ruby-duoi-ca.webp`
- `Váy dạ hội xanh Sapphire` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-xanh-sapphire.webp`
- `Váy dạ hội đen Luxury` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-den-luxury.webp`
- `Váy dạ hội vàng Champagne` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-vang-champagne.webp`
- `Váy dạ hội bạc ánh kim` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-bac-anh-kim.webp`
- `Váy dạ hội tím Lavender` → `frontend/public/images/products/events/da-hoi/vay-da-hoi-tim-lavender.webp`

## Events / Dạ hội / Prom Dress
- `Prom Dress hồng pastel` → `frontend/public/images/products/events/da-hoi/prom-dress-hong-pastel.webp`
- `Prom Dress xanh baby` → `frontend/public/images/products/events/da-hoi/prom-dress-xanh-baby.webp`
- `Prom Dress tím công chúa` → `frontend/public/images/products/events/da-hoi/prom-dress-tim-cong-chua.webp`
- `Prom Dress trắng tinh khôi` → `frontend/public/images/products/events/da-hoi/prom-dress-trang-tinh-khoi.webp`

## Events / Dạ hội / Cocktail Dress
- `Cocktail Dress đen basic` → `frontend/public/images/products/events/da-hoi/cocktail-dress-den-basic.webp`
- `Cocktail Dress đỏ satin` → `frontend/public/images/products/events/da-hoi/cocktail-dress-do-satin.webp`
- `Cocktail Dress xanh emerald` → `frontend/public/images/products/events/da-hoi/cocktail-dress-xanh-emerald.webp`

## Events / Mascot / Gấu
- `Mascot Gấu nâu` → `frontend/public/images/products/events/mascot/mascot-gau-nau.webp`

## Events / Mascot / Thỏ
- `Mascot Thỏ trắng` → `frontend/public/images/products/events/mascot/mascot-tho-trang.webp`

## Events / Mascot / Khủng long
- `Mascot Khủng long xanh` → `frontend/public/images/products/events/mascot/mascot-khung-long-xanh.webp`

## Events / Mascot / Mèo
- `Mascot Mèo vàng` → `frontend/public/images/products/events/mascot/mascot-meo-vang.webp`

## Events / Team Building / Áo nhóm
- `Đồng phục Team Building đỏ` → `frontend/public/images/products/events/team-building/dong-phuc-team-building-do.webp`
- `Đồng phục Team Building xanh` → `frontend/public/images/products/events/team-building/dong-phuc-team-building-xanh.webp`
- `Đồng phục Team Building vàng` → `frontend/public/images/products/events/team-building/dong-phuc-team-building-vang.webp`

## Events / Lễ hội / Lễ tân
- `Áo dài lễ tân đỏ` → `frontend/public/images/products/events/le-hoi/ao-dai-le-tan-do.webp`

## Events / Lễ hội / MC
- `Đầm MC sự kiện trắng` → `frontend/public/images/products/events/le-hoi/dam-mc-su-kien-trang.webp`

## Events / Lễ hội / Noel
- `Trang phục Noel ông già` → `frontend/public/images/products/events/le-hoi/trang-phuc-noel-ong-gia.webp`
- `Trang phục Noel nữ đỏ` → `frontend/public/images/products/events/le-hoi/trang-phuc-noel-nu-do.webp`

## Events / Lễ hội / Halloween
- `Trang phục Halloween bí ngô` → `frontend/public/images/products/events/le-hoi/trang-phuc-halloween-bi-ngo.webp`
- `Trang phục Halloween ma cà rồng` → `frontend/public/images/products/events/le-hoi/trang-phuc-halloween-ma-ca-rong.webp`

## Events / Wedding / Wedding Dress
- `Đầm cưới trắng ren` → `frontend/public/images/products/events/wedding/dam-cuoi-trang-ren.webp`

## Events / Wedding / Bridesmaid
- `Đầm phụ dâu hồng` → `frontend/public/images/products/events/wedding/dam-phu-dau-hong.webp`
- `Đầm phụ dâu xanh` → `frontend/public/images/products/events/wedding/dam-phu-dau-xanh.webp`

## Events / Wedding / Áo dài cưới
- `Áo dài cưới đỏ` → `frontend/public/images/products/events/wedding/ao-dai-cuoi-do.webp`
- `Áo dài cưới trắng` → `frontend/public/images/products/events/wedding/ao-dai-cuoi-trang.webp`

## Events / Wedding / Groom Suit
- `Suit chú rể đen` → `frontend/public/images/products/events/wedding/suit-chu-re-den.webp`

## Yearbook / Áo dài / Áo dài trắng
- `Áo dài trắng học sinh` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-trang-hoc-sinh.webp`
- `Áo dài trắng lụa tơ tằm` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-trang-lua-to-tam.webp`

## Yearbook / Áo dài / Áo dài truyền thống
- `Áo dài đỏ truyền thống` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-do-truyen-thong.webp`

## Yearbook / Áo dài / Áo dài cách tân
- `Áo dài xanh ngọc` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-xanh-ngoc.webp`

## Yearbook / Áo dài / Áo dài truyền thống
- `Áo dài vàng hoa sen` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-vang-hoa-sen.webp`

## Yearbook / Áo dài / Áo dài cách tân
- `Áo dài hồng pastel` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-hong-pastel.webp`

## Yearbook / Áo dài / Áo dài truyền thống
- `Áo dài tím Huế` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-tim-hue.webp`

## Yearbook / Áo dài / Áo dài nam
- `Áo dài nam trắng` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-nam-trang.webp`
- `Áo dài nam xanh navy` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-nam-xanh-navy.webp`

## Yearbook / Áo dài / Áo dài cách tân
- `Áo dài cách tân nhóm` → `frontend/public/images/products/yearbook/ao-dai/ao-dai-cach-tan-nhom.webp`

## Yearbook / Cử nhân / Áo cử nhân
- `Áo cử nhân đại học kèm mũ` → `frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-dai-hoc-kem-mu.webp`
- `Áo cử nhân xanh navy` → `frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-xanh-navy.webp`
- `Áo cử nhân đỏ đô` → `frontend/public/images/products/yearbook/cu-nhan/ao-cu-nhan-do-do.webp`

## Yearbook / Cử nhân / Mũ cử nhân
- `Mũ cử nhân tốt nghiệp` → `frontend/public/images/products/yearbook/cu-nhan/mu-cu-nhan-tot-nghiep.webp`

## Yearbook / Cử nhân / Khăn tốt nghiệp
- `Khăn tốt nghiệp vàng` → `frontend/public/images/products/yearbook/cu-nhan/khan-tot-nghiep-vang.webp`

## Yearbook / Vest tốt nghiệp / Vest nam
- `Vest tốt nghiệp nam đen` → `frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-den.webp`
- `Vest tốt nghiệp nam xanh` → `frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nam-xanh.webp`

## Yearbook / Vest tốt nghiệp / Vest nữ
- `Vest tốt nghiệp nữ trắng` → `frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-trang.webp`
- `Vest tốt nghiệp nữ đen` → `frontend/public/images/products/yearbook/vest-tot-nghiep/vest-tot-nghiep-nu-den.webp`

## Yearbook / Đồng phục học sinh / THPT
- `Đồng phục học sinh THPT Việt Nam` → `frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-hoc-sinh-thpt-viet-nam.webp`

## Yearbook / Đồng phục học sinh / Hàn Quốc
- `Đồng phục nữ sinh Hàn Quốc` → `frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nu-sinh-han-quoc.webp`

## Yearbook / Đồng phục học sinh / Sailor Nhật
- `Đồng phục sailor Nhật Bản` → `frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-sailor-nhat-ban.webp`

## Yearbook / Đồng phục học sinh / Hàn Quốc
- `Đồng phục nam sinh Hàn Quốc` → `frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/dong-phuc-nam-sinh-han-quoc.webp`

## Yearbook / Đồng phục học sinh / Chân váy caro
- `Chân váy caro nữ sinh` → `frontend/public/images/products/yearbook/dong-phuc-hoc-sinh/chan-vay-caro-nu-sinh.webp`

## Yearbook / Concept chụp ảnh / Vintage
- `Set concept Vintage nâu` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-vintage-nau.webp`

## Yearbook / Concept chụp ảnh / Retro
- `Set concept Retro 90s` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-retro-90s.webp`

## Yearbook / Concept chụp ảnh / Thanh xuân
- `Set concept Thanh xuân` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-thanh-xuan.webp`

## Yearbook / Concept chụp ảnh / Picnic
- `Set concept Picnic trắng` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-picnic-trang.webp`

## Yearbook / Concept chụp ảnh / Studio
- `Set concept Studio tối giản` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-studio-toi-gian.webp`

## Yearbook / Concept chụp ảnh / Newspaper
- `Set concept Báo chí cổ điển` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-bao-chi-co-dien.webp`

## Yearbook / Concept chụp ảnh / Y2K
- `Set concept Y2K` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-y2k.webp`

## Yearbook / Concept chụp ảnh / Bohemian
- `Set concept Bohemian` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-bohemian.webp`

## Yearbook / Concept chụp ảnh / Princess
- `Set concept Công chúa kỷ yếu` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-cong-chua-ky-yeu.webp`

## Yearbook / Concept chụp ảnh / Dân gian
- `Set concept Dân gian Việt Nam` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-dan-gian-viet-nam.webp`

## Yearbook / Concept chụp ảnh / Summer
- `Set concept Hoa cỏ mùa hè` → `frontend/public/images/products/yearbook/concept-chup-anh/set-concept-hoa-co-mua-he.webp`

## Accessories / Tóc giả / Anime Wig
- `Tóc giả Anime hồng pastel` → `frontend/public/images/products/accessories/toc-gia/toc-gia-anime-hong-pastel.webp`
- `Tóc giả Anime vàng` → `frontend/public/images/products/accessories/toc-gia/toc-gia-anime-vang.webp`

## Accessories / Tóc giả / Fantasy Wig
- `Tóc giả trắng bạc Fantasy` → `frontend/public/images/products/accessories/toc-gia/toc-gia-trang-bac-fantasy.webp`

## Accessories / Tóc giả / Anime Wig
- `Tóc giả đen dài nữ` → `frontend/public/images/products/accessories/toc-gia/toc-gia-den-dai-nu.webp`

## Accessories / Tóc giả / Idol Wig
- `Tóc giả xanh dương Idol` → `frontend/public/images/products/accessories/toc-gia/toc-gia-xanh-duong-idol.webp`

## Accessories / Tóc giả / Anime Wig
- `Tóc giả đỏ rượu` → `frontend/public/images/products/accessories/toc-gia/toc-gia-do-ruou.webp`
