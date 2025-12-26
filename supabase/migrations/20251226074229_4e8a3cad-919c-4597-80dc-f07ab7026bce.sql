-- Add new reward config keys for FUN Play reward policy

-- First upload reward (500,000 CAMLY)
INSERT INTO reward_config (config_key, config_value, description)
VALUES ('FIRST_UPLOAD_REWARD', 500000, 'CAMLY thưởng cho video đầu tiên của người dùng')
ON CONFLICT (config_key) DO UPDATE SET config_value = 500000, description = 'CAMLY thưởng cho video đầu tiên của người dùng';

-- Signup reward (50,000 CAMLY)
INSERT INTO reward_config (config_key, config_value, description)
VALUES ('SIGNUP_REWARD', 50000, 'CAMLY thưởng khi đăng ký tài khoản')
ON CONFLICT (config_key) DO UPDATE SET config_value = 50000, description = 'CAMLY thưởng khi đăng ký tài khoản';

-- Wallet connect reward (50,000 CAMLY)
INSERT INTO reward_config (config_key, config_value, description)
VALUES ('WALLET_CONNECT_REWARD', 50000, 'CAMLY thưởng khi kết nối ví')
ON CONFLICT (config_key) DO UPDATE SET config_value = 50000, description = 'CAMLY thưởng khi kết nối ví';

-- Share reward (5,000 CAMLY)
INSERT INTO reward_config (config_key, config_value, description)
VALUES ('SHARE_REWARD', 5000, 'CAMLY thưởng khi chia sẻ video')
ON CONFLICT (config_key) DO UPDATE SET config_value = 5000, description = 'CAMLY thưởng khi chia sẻ video';

-- Update existing config values according to new policy
UPDATE reward_config SET config_value = 10000, description = 'CAMLY thưởng khi xem video (video ngắn xem hết hoặc video dài xem 5 phút)' WHERE config_key = 'VIEW_REWARD';
UPDATE reward_config SET config_value = 5000, description = 'CAMLY thưởng khi bình luận (tối thiểu 5 từ)' WHERE config_key = 'COMMENT_REWARD';
UPDATE reward_config SET config_value = 100000, description = 'CAMLY thưởng khi upload video (video từ thứ 2 trở đi, cần 3 lượt xem)' WHERE config_key = 'UPLOAD_REWARD';
UPDATE reward_config SET config_value = 5, description = 'Số từ tối thiểu cho bình luận hợp lệ' WHERE config_key = 'MIN_COMMENT_LENGTH';

-- Add unique constraint on config_key if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reward_config_config_key_key') THEN
        ALTER TABLE reward_config ADD CONSTRAINT reward_config_config_key_key UNIQUE (config_key);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Add signup_rewarded and wallet_connect_rewarded columns to profiles to track one-time rewards
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_rewarded boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_connect_rewarded boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_upload_rewarded boolean DEFAULT false;