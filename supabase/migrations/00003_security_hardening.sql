-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- AFTER 00001_initial_schema.sql and 00002_storage_bucket.sql
-- ==============================================================
-- Security hardening:
--  1. Stop users from promoting themselves to admin
--  2. Stop users from editing privileged appointment columns
--  3. Lock down SECURITY DEFINER functions (search_path + authz)
--  4. DB-level protection against double-booking (race conditions)
--  5. Make the payment-slips bucket private
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- 1. Pin search_path on every SECURITY DEFINER function
--    (prevents search-path shadowing attacks)
-- ============================================================
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.check_product_available(bigint, date, date, boolean) SET search_path = '';
ALTER FUNCTION public.get_product_unavailable_dates(bigint, date, date, boolean) SET search_path = '';
ALTER FUNCTION public.get_appointments_for_date(date) SET search_path = '';

-- ============================================================
-- 2. Stock RPCs: admin-only, validated, no anon access
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id BIGINT,
  p_field TEXT,
  p_qty INTEGER
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'p_qty must be a positive integer';
  END IF;
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'p_qty must be a positive integer';
  END IF;
  IF p_field = 'stock_qty' THEN
    UPDATE public.products
    SET stock_qty = stock_qty + p_qty,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(bigint, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stock(bigint, text, integer) FROM anon;

-- ============================================================
-- 3. Calendar RPC leaks customer names -> admin only
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_rentals_for_calendar(
    p_product_id BIGINT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (id BIGINT, rental_start_date DATE, rental_end_date DATE, customer_name TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
    END IF;

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

REVOKE EXECUTE ON FUNCTION public.get_rentals_for_calendar(bigint, date, date) FROM anon;

-- ============================================================
-- 4. Prevent privilege escalation via the profiles table
--    Users may edit their own profile, but NOT their role.
--    Exception: the very first admin can be claimed while no
--    admin exists yet (bootstrap).
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF public.is_admin() THEN
      -- an existing admin may change roles
      NULL;
    ELSIF NEW.role = 'admin'
          AND OLD.role = 'user'
          AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
      -- bootstrap: first admin, allowed
      NULL;
    ELSE
      -- silently keep the previous role
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_role ON public.profiles;
CREATE TRIGGER guard_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- Atomic "become the first admin" helper used by /api/setup-admin
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- serialize concurrent callers so only one can win
  PERFORM pg_advisory_xact_lock(hashtext('claim_first_admin'));
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE public.profiles
    SET role = 'admin', updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- ============================================================
-- 5. Prevent customers from editing privileged appointment
--    columns (status, admin_notes, pricing, ownership...)
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_appointment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- non-admin: force privileged columns back to their stored values
  NEW.user_id      := OLD.user_id;
  NEW.status       := OLD.status;
  NEW.admin_notes  := OLD.admin_notes;
  NEW.try_on_price := OLD.try_on_price;
  NEW.try_on_only  := OLD.try_on_only;
  NEW.is_rental    := OLD.is_rental;
  NEW.rental_id    := OLD.rental_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_appointment_update ON public.appointments;
CREATE TRIGGER guard_appointment_update
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_update();

-- ============================================================
-- 6. Database-level double-booking protection
--    (backstop for the TOCTOU race in the server actions)
--    NOTE: if you already have overlapping rows, clean them
--    up before running these two statements.
-- ============================================================
ALTER TABLE public.rentals
  DROP CONSTRAINT IF EXISTS rentals_no_overlap;
ALTER TABLE public.rentals
  ADD CONSTRAINT rentals_no_overlap EXCLUDE USING gist (
    product_id WITH =,
    daterange(rental_start_date, rental_end_date, '[]') WITH &&
  ) WHERE (status <> 'cancelled');

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_overlap;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    service_id WITH =,
    tsrange(appointment_date + time_slot, appointment_date + end_time) WITH &&
  ) WHERE (status <> 'cancelled');

-- ============================================================
-- 7. Payment slips must NOT be world-readable
--    (the SELECT policy in 00002 only works on a private bucket)
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'payment-slips';
