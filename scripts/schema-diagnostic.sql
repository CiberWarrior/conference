-- ============================================================
-- DIJAGNOSTIKA SHEME BAZE PODATAKA
-- ============================================================
-- Ovaj skript uspoređuje TVOJU živu Supabase bazu sa svime što
-- kod aplikacije stvarno očekuje (22 tablice, 375 kolona, izvedeno
-- automatskom analizom svih 52 migracijske datoteke).
--
-- NE MIJENJA ništa — samo čita i prijavljuje razlike.
--
-- VAŽNO: Pokreni CIJELU skriptu odjednom (jedan "Run"), ne pojedine
-- redove zasebno — sve provjere se spajaju u JEDAN rezultat na kraju.
-- Ako rezultat nema redaka, sve je u redu (baza odgovara kodu).

DO $$
DECLARE
  schema_def JSONB := '{"registrations": ["abstract_submission", "accommodation", "accompanying_persons", "accompanying_persons_data", "arrival_date", "bank_transfer_proof_url", "bank_transfer_verified", "bank_transfer_verified_at", "bank_transfer_verified_by", "certificate_generated", "certificate_generated_at", "certificate_sent", "certificate_sent_at", "certificate_url", "checked_in", "checked_in_at", "conference_id", "country", "created_at", "custom_data", "departure_date", "email", "first_name", "gala_dinner", "id", "institution", "invoice_id", "invoice_url", "last_name", "last_payment_reminder_sent_at", "participant_profile_id", "participants", "payment_amount", "payment_by_card", "payment_currency", "payment_intent_id", "payment_method", "payment_reference", "payment_reminder_count", "payment_required", "payment_status", "phone", "presentation_type", "refund_amount", "refund_processed_at", "refund_reason", "refund_requested", "refund_requested_at", "refund_status", "registration_fee_id", "registration_fee_type", "registration_number", "status", "stripe_session_id"], "abstracts": ["authors", "conference_id", "custom_data", "email", "file_name", "file_path", "file_size", "id", "registration_id", "uploaded_at"], "payment_history": ["amount", "base_currency", "created_at", "currency", "description", "exchange_rate", "id", "metadata", "payment_method", "payment_reference", "registration_id", "status", "stripe_payment_intent_id", "stripe_refund_id", "transaction_type", "updated_at"], "certificates": ["certificate_number", "certificate_type", "created_at", "id", "issued_date", "metadata", "pdf_url", "registration_id", "template_name", "updated_at"], "conferences": ["active", "conference_code", "created_at", "default_currency", "description", "email_settings", "end_date", "event_type", "id", "location", "logo_url", "name", "owner_id", "pricing", "primary_color", "published", "settings", "slug", "start_date", "supported_currencies", "updated_at", "venue", "website_url"], "contact_inquiries": ["assigned_to", "conference_type", "contacted_at", "converted", "converted_at", "converted_to_conference_id", "created_at", "email", "expected_attendees", "follow_up_date", "id", "ip_address", "message", "name", "notes", "organization", "phone", "priority", "service_type", "source", "status", "updated_at", "user_agent"], "user_profiles": ["active", "bank_account_currency", "bank_account_holder", "bank_account_number", "bank_address", "bank_name", "created_at", "default_vat_percentage", "email", "full_name", "id", "last_login", "organization", "phone", "role", "swift_bic", "updated_at", "vat_label"], "conference_permissions": ["can_check_in", "can_delete_data", "can_edit_conference", "can_export_data", "can_generate_certificates", "can_manage_abstracts", "can_manage_payments", "can_manage_registration_form", "can_view_all_registrations", "can_view_analytics", "can_view_registrations", "conference_id", "granted_at", "granted_by", "id", "notes", "user_id"], "admin_audit_log": ["action", "created_at", "details", "id", "ip_address", "resource_id", "resource_type", "user_agent", "user_id"], "user_activity_log": ["action", "created_at", "details", "id", "ip_address", "resource_id", "resource_type", "session_id", "user_agent", "user_email", "user_id"], "subscription_plans": ["active", "created_at", "currency", "description", "display_order", "features", "id", "max_conferences", "max_registrations_per_conference", "max_storage_gb", "name", "price_monthly", "price_yearly", "slug", "stripe_price_id_monthly", "stripe_price_id_yearly", "stripe_product_id", "updated_at"], "subscriptions": ["billing_cycle", "canceled_at", "conferences_used", "created_at", "currency", "expires_at", "id", "inquiry_id", "plan_id", "price", "registrations_used", "starts_at", "status", "storage_used_gb", "stripe_customer_id", "stripe_invoice_id", "stripe_payment_intent_id", "stripe_subscription_id", "updated_at", "user_id"], "payment_offers": ["billing_cycle", "created_at", "created_by", "custom_price", "discount_percent", "expires_at", "id", "inquiry_id", "paid_at", "plan_id", "sent_at", "status", "stripe_payment_link_id", "stripe_payment_link_url", "updated_at"], "participant_profiles": ["account_activated_at", "auth_user_id", "avatar_url", "country", "created_at", "email", "email_notifications", "first_name", "has_account", "id", "institution", "last_login", "last_name", "loyalty_points", "loyalty_tier", "marketing_consent", "phone", "profile_data", "total_events_attended", "updated_at"], "participant_registrations": ["abstract_id", "abstract_submitted", "accommodation_data", "amount_paid", "cancellation_reason", "cancelled_at", "certificate_id", "certificate_issued_at", "checked_in", "checked_in_at", "conference_id", "currency", "custom_data", "id", "participant_id", "payment_intent_id", "payment_status", "refund_amount", "refund_issued", "registered_at", "registration_fee_type", "registration_id", "registration_number", "status", "updated_at"], "participant_account_invites": ["accepted_at", "email", "expires_at", "id", "invite_token", "participant_id", "sent_at", "status"], "participant_loyalty_discounts": ["applied", "applied_at", "conference_id", "created_at", "discount_amount", "discount_percentage", "discount_type", "id", "participant_id", "valid_from", "valid_until"], "payment_reminders": ["conference_id", "created_at", "email_body", "email_error", "email_subject", "id", "metadata", "registration_id", "reminder_count", "reminder_type", "scheduled_for", "sent_at", "status", "updated_at"], "supported_currencies": ["active", "code", "created_at", "decimal_places", "name", "sort_order", "symbol"], "conference_pages": ["conference_id", "content", "created_at", "custom_css", "hero_background_color", "hero_image_url", "hero_info_cards", "hero_layout_type", "hero_logo_url", "hero_subtitle", "hero_title", "id", "meta_description", "meta_title", "og_image_url", "published", "slug", "sort_order", "title", "updated_at"], "support_tickets": ["assigned_to_user_id", "category", "conference_id", "created_at", "created_by_email", "created_by_user_id", "description", "id", "priority", "resolved_at", "status", "subject", "updated_at"], "custom_registration_fees": ["capacity", "conference_id", "created_at", "currency", "display_order", "id", "is_active", "name", "price_gross", "price_net", "updated_at", "valid_from", "valid_to"]}'::jsonb;
  tbl TEXT;
  cols JSONB;
  col TEXT;
  bucket_id TEXT;
  cnt BIGINT;
  missing_cols TEXT[];
BEGIN
  DROP TABLE IF EXISTS pg_temp.schema_audit_all;
  CREATE TEMP TABLE schema_audit_all (kategorija TEXT, stavka TEXT, status TEXT);

  -- 1) TABLICE / KOLONE - jedan red po tablici (sve nedostajuće kolone zajedno),
  -- da rezultat stane u jedan screenshot/copy-paste umjesto desetaka redaka.
  FOR tbl, cols IN SELECT * FROM jsonb_each(schema_def) LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      INSERT INTO schema_audit_all VALUES ('1_TABLICA/KOLONA', tbl, 'CIJELA TABLICA NE POSTOJI');
    ELSE
      missing_cols := ARRAY[]::TEXT[];
      FOR col IN SELECT jsonb_array_elements_text(cols) LOOP
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
        ) THEN
          missing_cols := array_append(missing_cols, col);
        END IF;
      END LOOP;
      IF array_length(missing_cols, 1) > 0 THEN
        INSERT INTO schema_audit_all
          VALUES ('1_TABLICA/KOLONA', tbl, 'NEDOSTAJU KOLONE: ' || array_to_string(missing_cols, ', '));
      END IF;
    END IF;
  END LOOP;

  -- 2) STORAGE BUCKETOVI (storage.buckets uvijek postoji u Supabaseu)
  FOR bucket_id IN SELECT * FROM (VALUES ('registration-attachments'), ('conference-logos'), ('abstracts'), ('page-images')) AS v(bucket_id) LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets b WHERE b.id = bucket_id) THEN
      INSERT INTO schema_audit_all VALUES ('2_STORAGE BUCKET', bucket_id, 'NEDOSTAJE');
    ELSE
      INSERT INTO schema_audit_all VALUES ('2_STORAGE BUCKET', bucket_id, 'OK');
    END IF;
  END LOOP;

  -- 3) SEED PODACI (planovi pretplate i valute — potrebni za rad platforme)
  IF to_regclass('public.subscription_plans') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM subscription_plans' INTO cnt;
    INSERT INTO schema_audit_all VALUES ('3_SEED PODACI', 'subscription_plans', cnt::text || ' redak(a)');
  ELSE
    INSERT INTO schema_audit_all VALUES ('3_SEED PODACI', 'subscription_plans', 'TABLICA NE POSTOJI');
  END IF;

  IF to_regclass('public.supported_currencies') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM supported_currencies' INTO cnt;
    INSERT INTO schema_audit_all VALUES ('3_SEED PODACI', 'supported_currencies', cnt::text || ' redak(a)');
  ELSE
    INSERT INTO schema_audit_all VALUES ('3_SEED PODACI', 'supported_currencies', 'TABLICA NE POSTOJI');
  END IF;
END $$;

-- JEDINI rezultat koji treba pogledati - sve u jednoj tablici:
SELECT * FROM schema_audit_all ORDER BY kategorija, stavka;
