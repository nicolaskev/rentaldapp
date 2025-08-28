-- Clear existing reviews and create property-specific reviews
DELETE FROM reviews;

-- Insert specific reviews for different properties
-- We'll create reviews for the first few properties with different content

-- Get property IDs and insert reviews for each
WITH property_list AS (
  SELECT id, title, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM properties 
  WHERE is_available = true
  LIMIT 10
)
INSERT INTO reviews (property_id, reviewer_name, reviewer_initial, rating, comment, review_date)
SELECT 
  p.id,
  CASE 
    WHEN p.row_num = 1 THEN 'Rudi Hartono'
    WHEN p.row_num = 2 THEN 'Dewi Lestari' 
    WHEN p.row_num = 3 THEN 'Ahmad Rizki'
    WHEN p.row_num = 4 THEN 'Sari Dewi'
    WHEN p.row_num = 5 THEN 'Budi Santoso'
    WHEN p.row_num = 6 THEN 'Maya Putri'
    WHEN p.row_num = 7 THEN 'Andi Wijaya'
    WHEN p.row_num = 8 THEN 'Kartika Sari'
    WHEN p.row_num = 9 THEN 'Fajar Nugroho'
    ELSE 'Indira Sari'
  END as reviewer_name,
  CASE 
    WHEN p.row_num = 1 THEN 'RH'
    WHEN p.row_num = 2 THEN 'DL'
    WHEN p.row_num = 3 THEN 'AR'
    WHEN p.row_num = 4 THEN 'SD'
    WHEN p.row_num = 5 THEN 'BS'
    WHEN p.row_num = 6 THEN 'MP'
    WHEN p.row_num = 7 THEN 'AW'
    WHEN p.row_num = 8 THEN 'KS'
    WHEN p.row_num = 9 THEN 'FN'
    ELSE 'IS'
  END as reviewer_initial,
  CASE 
    WHEN p.row_num = 1 THEN 5
    WHEN p.row_num = 2 THEN 5
    WHEN p.row_num = 3 THEN 4
    WHEN p.row_num = 4 THEN 5
    WHEN p.row_num = 5 THEN 4
    WHEN p.row_num = 6 THEN 5
    WHEN p.row_num = 7 THEN 5
    WHEN p.row_num = 8 THEN 4
    WHEN p.row_num = 9 THEN 5
    ELSE 4
  END as rating,
  CASE 
    WHEN p.row_num = 1 THEN 'Lokasi agak jauh dari pusat kota, tapi cocok untuk yang ingin suasana tenang.'
    WHEN p.row_num = 2 THEN 'Sayangnya kebersihan kurang diperhatikan, semoga bisa ditingkatkan.'
    WHEN p.row_num = 3 THEN 'Properti yang sangat bagus dan nyaman. Lokasi strategis dan fasilitas lengkap.'
    WHEN p.row_num = 4 THEN 'Tempat tinggal yang recommended. Pemilik sangat responsif dan ramah.'
    WHEN p.row_num = 5 THEN 'Kualitas properti sesuai dengan harga. Lingkungan aman dan tenang.'
    WHEN p.row_num = 6 THEN 'Pengalaman sewa yang memuaskan. Akan merekomendasikan ke teman-teman.'
    WHEN p.row_num = 7 THEN 'Properti bersih dan terawat dengan baik. Akses transportasi mudah.'
    WHEN p.row_num = 8 THEN 'Rumah yang nyaman dengan lingkungan yang tenang. Fasilitas cukup lengkap.'
    WHEN p.row_num = 9 THEN 'Lokasi strategis dekat dengan mall dan sekolah. Sangat cocok untuk keluarga.'
    ELSE 'Apartemen modern dengan view yang bagus. Fasilitas gedung lengkap dan keamanan terjamin.'
  END as comment,
  NOW() - (p.row_num * interval '10 days') as review_date
FROM property_list p;

-- Add second reviews for some properties
WITH property_list AS (
  SELECT id, title, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM properties 
  WHERE is_available = true
  LIMIT 5
)
INSERT INTO reviews (property_id, reviewer_name, reviewer_initial, rating, comment, review_date)
SELECT 
  p.id,
  CASE 
    WHEN p.row_num = 1 THEN 'Dina Marlina'
    WHEN p.row_num = 2 THEN 'Reza Pratama'
    WHEN p.row_num = 3 THEN 'Yuni Astuti'
    WHEN p.row_num = 4 THEN 'Dimas Saputra'
    ELSE 'Lisa Permata'
  END as reviewer_name,
  CASE 
    WHEN p.row_num = 1 THEN 'DM'
    WHEN p.row_num = 2 THEN 'RP'
    WHEN p.row_num = 3 THEN 'YA'
    WHEN p.row_num = 4 THEN 'DS'
    ELSE 'LP'
  END as reviewer_initial,
  CASE 
    WHEN p.row_num = 1 THEN 5
    WHEN p.row_num = 2 THEN 4
    WHEN p.row_num = 3 THEN 5
    WHEN p.row_num = 4 THEN 3
    ELSE 4
  END as rating,
  CASE 
    WHEN p.row_num = 1 THEN 'Sangat puas dengan properti ini. Fasilitas lengkap dan lokasi strategis dekat dengan pusat kota.'
    WHEN p.row_num = 2 THEN 'Properti bagus dengan harga yang reasonable. Pemilik sangat kooperatif dalam proses sewa.'
    WHEN p.row_num = 3 THEN 'Tempat tinggal yang sangat nyaman, suasana sekitar mendukung untuk bekerja dan beristirahat.'
    WHEN p.row_num = 4 THEN 'Fasilitas cukup, tapi beberapa peralatan rumah sudah perlu diperbaharui.'
    ELSE 'Lokasi yang strategis dan mudah diakses. Properti bersih dan terawat dengan baik.'
  END as comment,
  NOW() - (p.row_num * interval '15 days') as review_date
FROM property_list p;
