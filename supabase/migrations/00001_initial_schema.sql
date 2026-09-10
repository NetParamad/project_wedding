-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view categories" ON public.categories;
CREATE POLICY "Everyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    public.is_admin()
  );

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rental_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  rental_deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
CREATE POLICY "Everyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (
    public.is_admin()
  );

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view product images" ON public.product_images;
CREATE POLICY "Everyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Admins can insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE
  USING (
    public.is_admin()
  );

-- 5. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  promptpay_number TEXT,
  promptpay_qr_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  theme TEXT NOT NULL DEFAULT 'zinc' CHECK (theme IN ('zinc','rose','blue','green','orange','violet','custom')),
  theme_custom_color TEXT,
  business_hours_start TIME NOT NULL DEFAULT '09:00',
  business_hours_end TIME NOT NULL DEFAULT '17:00',
  address TEXT,
  map_url TEXT,
  email TEXT,
  phone TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  line_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
CREATE POLICY "Admins can insert store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings"
  ON public.store_settings FOR UPDATE
  USING (public.is_admin());

-- Seed default row
INSERT INTO public.store_settings (id, store_name, theme, business_hours_start, business_hours_end)
VALUES (1, 'ร้านของฉัน', 'zinc', '09:00', '17:00')
ON CONFLICT (id) DO NOTHING;

-- 6. SETUP: Set first user as admin (run after your first signup)
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 8.5. PRODUCT DATE LOCKS
CREATE TABLE IF NOT EXISTS public.product_date_locks (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lock_start_date DATE NOT NULL,
  lock_end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.product_date_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage product date locks" ON public.product_date_locks;
CREATE POLICY "Admins can manage product date locks"
  ON public.product_date_locks FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view product date locks" ON public.product_date_locks;
CREATE POLICY "Anyone can view product date locks"
  ON public.product_date_locks FOR SELECT
  USING (true);

-- 8.6. RENTALS
CREATE TABLE IF NOT EXISTS public.rentals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  appointment_id BIGINT,
  phone TEXT,
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  rental_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'returned', 'late', 'cancelled')),
  returned_at TIMESTAMPTZ,
  return_condition TEXT,
  return_penalty DECIMAL(10,2) DEFAULT 0,
  return_notes TEXT,
  notes TEXT,
  delivery_name TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rentals" ON public.rentals;
CREATE POLICY "Users can view own rentals"
  ON public.rentals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create rentals" ON public.rentals;
CREATE POLICY "Users can create rentals"
  ON public.rentals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage rentals" ON public.rentals;
CREATE POLICY "Admins can manage rentals"
  ON public.rentals FOR ALL
  USING (public.is_admin());

-- 9. APPOINTMENT SERVICES
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('try_on', 'consultation')),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view appointment_services" ON public.appointment_services;
CREATE POLICY "Anyone can view appointment_services"
  ON public.appointment_services FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage appointment_services" ON public.appointment_services;
CREATE POLICY "Admins can manage appointment_services"
  ON public.appointment_services FOR ALL
  USING (public.is_admin());

INSERT INTO public.appointment_services (type, name, duration_minutes, price)
VALUES
  ('try_on', 'ลองชุด', 60, 0),
  ('consultation', 'ปรึกษา', 60, 0)
ON CONFLICT (type) DO NOTHING;

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service_id BIGINT NOT NULL REFERENCES public.appointment_services(id),
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  end_time TIME NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  is_rental BOOLEAN NOT NULL DEFAULT false,
  rental_id BIGINT,
  admin_notes TEXT,
  try_on_price DECIMAL(10,2),
  try_on_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
CREATE POLICY "Users can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage appointments" ON public.appointments;
CREATE POLICY "Admins can manage appointments"
  ON public.appointments FOR ALL
  USING (public.is_admin());

-- 11. STOCK MANAGEMENT RPC
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id BIGINT,
  p_field TEXT,
  p_qty INTEGER
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_field = 'stock_qty' THEN
    UPDATE public.products
    SET stock_qty = GREATEST(0, stock_qty - p_qty),
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_stock(
  p_product_id BIGINT,
  p_field TEXT,
  p_qty INTEGER
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_field = 'stock_qty' THEN
    UPDATE public.products
    SET stock_qty = stock_qty + p_qty,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','appointment_update','order_update','payment_confirmed')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (public.is_admin());

-- 13. UPDATED_AT TRIGGERS (auto-update on each table)
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_rentals_updated_at
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_appointment_services_updated_at
  BEFORE UPDATE ON public.appointment_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. INDEXES
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON public.rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON public.rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON public.rentals(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_product_date_locks_product_id ON public.product_date_locks(product_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 15. FK constraints for rentals (added after referenced tables exist)
ALTER TABLE public.appointments
  ADD CONSTRAINT fk_appointments_rental
  FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE SET NULL;

ALTER TABLE public.rentals
  ADD CONSTRAINT fk_rentals_appointment
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- ============================================================
-- 16. SECURITY DEFINER functions bypass RLS for availability checks
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_product_available(
    p_product_id BIGINT, p_start_date DATE, p_end_date DATE,
    p_block_appointments BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM (
        SELECT 1 FROM public.product_date_locks l
        WHERE l.product_id = p_product_id
          AND l.lock_start_date <= p_end_date
          AND l.lock_end_date >= p_start_date
        UNION ALL
        SELECT 1 FROM public.rentals r
        WHERE r.product_id = p_product_id
          AND r.status != 'cancelled'
          AND r.rental_start_date <= p_end_date
          AND r.rental_end_date >= p_start_date
        UNION ALL
        SELECT 1 FROM public.appointments a
        WHERE p_block_appointments
          AND a.product_id = p_product_id
          AND a.status != 'cancelled'
          AND a.appointment_date >= p_start_date
          AND a.appointment_date <= p_end_date
    ) AS conflicts;

    RETURN v_count = 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_unavailable_dates(
    p_product_id BIGINT, p_start_date DATE, p_end_date DATE,
    p_block_from_appointments BOOLEAN DEFAULT true
)
RETURNS TABLE (unavailable_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Locks: expand range into individual dates
    RETURN QUERY
    SELECT d::date
    FROM public.product_date_locks l
    CROSS JOIN LATERAL generate_series(
        GREATEST(l.lock_start_date, p_start_date),
        LEAST(l.lock_end_date, p_end_date),
        '1 day'::interval
    ) AS d
    WHERE l.product_id = p_product_id;

    -- Rentals: expand range into individual dates
    RETURN QUERY
    SELECT d::date
    FROM public.rentals r
    CROSS JOIN LATERAL generate_series(
        GREATEST(r.rental_start_date, p_start_date),
        LEAST(r.rental_end_date, p_end_date),
        '1 day'::interval
    ) AS d
    WHERE r.product_id = p_product_id
      AND r.status != 'cancelled';

    -- Appointments: single dates (only when p_block_from_appointments = true)
    IF p_block_from_appointments THEN
        RETURN QUERY
        SELECT a.appointment_date
        FROM public.appointments a
        WHERE a.product_id = p_product_id
          AND a.status != 'cancelled'
          AND a.appointment_date >= p_start_date
          AND a.appointment_date <= p_end_date;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_appointments_for_date(p_date DATE)
RETURNS TABLE (id BIGINT, time_slot TEXT, end_time TEXT, service_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.time_slot::TEXT, a.end_time::TEXT, a.service_id
    FROM public.appointments a
    WHERE a.appointment_date = p_date
      AND a.status IN ('pending', 'confirmed');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rentals_for_calendar(
    p_product_id BIGINT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (id BIGINT, rental_start_date DATE, rental_end_date DATE, customer_name TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.rental_start_date, r.rental_end_date, p.display_name, r.status::TEXT
    FROM public.rentals r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    WHERE r.product_id = p_product_id
      AND r.status != 'cancelled'
      AND r.rental_start_date <= p_end_date
      AND r.rental_end_date >= p_start_date
    ORDER BY r.rental_start_date;
END;
$$;


