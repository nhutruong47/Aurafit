INSERT INTO costume_items
(costume_id, sku_code, size, status, condition_note, created_at, updated_at)
VALUES
(1, 'AF-NARUTO-M-001', 'M', 'AVAILABLE', 'Full set sach, du ao khoac, bang tran va phu kien.', NOW(), NOW()),
(61, 'AF-VEST-L-001', 'L', 'AVAILABLE', 'Vest da giat hap, khong rach, khong mat nut.', NOW(), NOW()),
(95, 'AF-MC-M-001', 'M', 'AVAILABLE', 'Set MC nam su kien, can kiem tra vest va no co khi tra.', NOW(), NOW());

INSERT INTO rental_orders
(user_id, rental_date, return_date, status, total_deposit, total_rental_fee, notes, created_at, updated_at)
VALUES
(3, DATEADD('DAY', -1, NOW()), DATEADD('DAY', 2, NOW()), 'PENDING_PAYMENT', 250000, 550000, 'Khach nhan Naruto full set tai cua hang.', NOW(), NOW()),
(3, NOW(), DATEADD('DAY', 4, NOW()), 'PENDING_CONFIRMATION', 250000, 500000, 'Khach thue vest cho su kien toi.', NOW(), NOW()),
(3, DATEADD('DAY', 1, NOW()), DATEADD('DAY', 5, NOW()), 'PENDING_CONFIRMATION', 230000, 500000, 'Khach thue set MC nam su kien.', NOW(), NOW());

INSERT INTO rental_order_details
(rental_order_id, costume_item_id, rental_price, deposit_price, return_status)
VALUES
(1, 1, 550000, 250000, NULL),
(2, 2, 500000, 250000, NULL),
(3, 3, 500000, 230000, NULL);

INSERT INTO interaction_logs
(user_id, action_type, target_type, target_id, search_query, metadata, created_at)
VALUES
(3, 'PURCHASE', 'COSTUME', 1, NULL, 'seed habit: cosplay naruto', DATEADD('DAY', -20, NOW())),
(3, 'ADD_TO_CART', 'COSTUME', 2, NULL, 'seed habit: cosplay anime', DATEADD('DAY', -12, NOW())),
(3, 'PURCHASE', 'COSTUME', 61, NULL, 'seed habit: formal vest', DATEADD('DAY', -6, NOW()));
