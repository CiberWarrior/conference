-- Migration: Performance Optimization Indexes
-- Purpose: Add missing indexes to improve query performance
-- Date: December 2, 2025

-- ============================================
-- 1. REGISTRATIONS TABLE INDEXES
-- ============================================

-- Composite index for filtering by conference and created_at (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_registrations_conference_created 
ON registrations(conference_id, created_at DESC);

-- Index for payment status filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status 
ON registrations(payment_status) 
WHERE payment_status = 'pending';

-- Index for check-in status filtering
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in 
ON registrations(checked_in) 
WHERE checked_in = false;

-- Composite index for payment status and conference (dashboard stats)
CREATE INDEX IF NOT EXISTS idx_registrations_conference_payment 
ON registrations(conference_id, payment_status);

-- Index for country filtering (analytics)
CREATE INDEX IF NOT EXISTS idx_registrations_country 
ON registrations(country) 
WHERE country IS NOT NULL;

-- ============================================
-- 2. ABSTRACTS TABLE INDEXES
-- ============================================

-- Composite index for conference and upload date (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_abstracts_conference_uploaded 
ON abstracts(conference_id, uploaded_at DESC);

-- ============================================
-- 3. CONFERENCES TABLE INDEXES
-- ============================================

-- Index for published and active conferences (public API queries)
CREATE INDEX IF NOT EXISTS idx_conferences_published_active 
ON conferences(published, active) 
WHERE published = true AND active = true;

-- Index for slug lookups (already exists, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_conferences_slug_active 
ON conferences(slug) 
WHERE active = true;

-- ============================================
-- 4. USER_PROFILES TABLE INDEXES
-- ============================================

-- Index for active users (common filter)
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_role 
ON user_profiles(active, role) 
WHERE active = true;

-- ============================================
-- 5. CONFERENCE_PERMISSIONS TABLE INDEXES
-- ============================================

-- Composite index for user and conference lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_conf_perms_user_conf_lookup 
ON conference_permissions(user_id, conference_id);

-- Index for conference-based permission lookups
CREATE INDEX IF NOT EXISTS idx_conf_perms_conference 
ON conference_permissions(conference_id);

-- ============================================
-- 6. PAYMENT_HISTORY TABLE INDEXES
-- ============================================

-- Index for registration-based payment lookups
CREATE INDEX IF NOT EXISTS idx_payment_history_registration_status 
ON payment_history(registration_id, status);

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_payment_history_transaction_type 
ON payment_history(transaction_type);

-- ============================================
-- 7. CONTACT_INQUIRIES TABLE INDEXES
-- ============================================

-- Composite index for status and created_at (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status_created 
ON contact_inquiries(status, created_at DESC);

-- Index for converted inquiries
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_converted 
ON contact_inquiries(converted) 
WHERE converted = true;

-- ============================================
-- NOTES:
-- - All indexes use IF NOT EXISTS to prevent errors on re-run
-- - Partial indexes (WHERE clause) are used for common filter patterns
-- - Composite indexes are ordered by most selective column first
-- - These indexes will significantly improve dashboard and analytics queries
-- ============================================




