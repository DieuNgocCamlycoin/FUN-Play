
-- Bảng lưu trữ API key cho các nền tảng đối tác
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  platform_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Bảng theo dõi tần suất gọi API (rate limiting)
CREATE TABLE public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1
);

-- Index để tăng tốc tra cứu
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_rate_limits_key_window ON public.api_rate_limits(api_key_id, window_start);

-- Bật RLS trên cả 2 bảng
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS: Chỉ service role mới được đọc/ghi bảng api_keys
-- Không tạo policy nào cho anon/authenticated => mặc định DENY ALL
-- Edge function dùng service role client sẽ bypass RLS

-- RLS: Tương tự cho api_rate_limits
-- Không tạo policy => mặc định DENY ALL cho anon/authenticated
