
-- Create gov_attesters table
CREATE TABLE public.gov_attesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gov_group TEXT NOT NULL CHECK (gov_group IN ('will', 'wisdom', 'love')),
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_address)
);

-- Enable RLS
ALTER TABLE public.gov_attesters ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (needed for signature verification)
CREATE POLICY "Authenticated users can read gov_attesters"
  ON public.gov_attesters FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert gov_attesters"
  ON public.gov_attesters FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update gov_attesters"
  ON public.gov_attesters FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete gov_attesters"
  ON public.gov_attesters FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed 9 existing GOV members
INSERT INTO public.gov_attesters (gov_group, name, wallet_address) VALUES
  ('will', 'Minh Trí', '0xe32d50a0badE4cbD5B0d6120d3A5FD07f63694f1'),
  ('will', 'Ánh Nguyệt', '0xfd0Da7a744245e7aCECCd786d5a743Ef9291a557'),
  ('will', 'Thu Trang', '0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D'),
  ('wisdom', 'Bé Giàu', '0xCa319fBc39F519822385F2D0a0114B14fa89A301'),
  ('wisdom', 'Bé Ngọc', '0xDf8249159BB67804D718bc8186f95B75CE5ECbe8'),
  ('wisdom', 'Ái Vân', '0x5102Ecc4a458a1af76aFA50d23359a712658a402'),
  ('love', 'Thanh Tiên', '0xE418a560611e80E4239F5513D41e583fC9AC2E6d'),
  ('love', 'Bé Kim', '0x67464Df3082828b3Cf10C5Cb08FC24A28228EFd1'),
  ('love', 'Bé Hà', '0x9ec8C51175526BEbB1D04100256De71CF99B7CCC');
