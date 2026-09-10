-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- AFTER 00001–00003.
-- ==============================================================
-- Remove the unused stock mechanism.
--
-- Availability is entirely date-range based (product_date_locks + rentals +
-- appointments, enforced by the *_no_overlap exclusion constraints), which
-- assumes exactly one physical unit per product. products.stock_qty and the
-- decrement_stock / increment_stock RPCs were never called by the app, so they
-- are dead weight that only invites drift.
-- ==============================================================

DROP FUNCTION IF EXISTS public.decrement_stock(bigint, text, integer);
DROP FUNCTION IF EXISTS public.increment_stock(bigint, text, integer);

ALTER TABLE public.products DROP COLUMN IF EXISTS stock_qty;
