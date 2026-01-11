-- Thêm cột config_text để lưu URL nhạc chuông (config_value chỉ lưu số)
ALTER TABLE reward_config ADD COLUMN IF NOT EXISTS config_text TEXT;

-- Thêm cấu hình nhạc chuông claim CAMLY
INSERT INTO reward_config (config_key, config_value, description, config_text)
VALUES (
  'CLAIM_NOTIFICATION_SOUND', 
  1, 
  'URL nhạc chuông khi claim CAMLY thành công - Tất cả user dùng chung',
  'https://fzgjmvxtgrlwrluxdwjq.supabase.co/storage/v1/object/public/uploads/93727e1d-2b9f-454b-9d80-bf4a3feb0c83/1749387395907_CashRegister.mp3'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_text = EXCLUDED.config_text,
  description = EXCLUDED.description;