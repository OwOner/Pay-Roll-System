SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict kdkItX0FrCivgfkz7agtAmuZM3dWTCHLzmm5LiaUGQjPE1vMDVYBSNiuWkd0UXV

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '4e5e3b23-1b40-481b-8902-974234784363', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin@nexus.com","user_id":"c69d867e-151b-4f47-b979-7e23f066879a","user_phone":""}}', '2026-09-16 02:49:29.612582+00', ''),
	('00000000-0000-0000-0000-000000000000', '25f709ae-a5b5-42bf-a6e4-d9e0488b0679', '{"action":"login","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-16 02:49:43.246459+00', ''),
	('00000000-0000-0000-0000-000000000000', '79789e87-2cc7-4d72-bd37-2babcbdf3a64', '{"action":"login","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-09-16 02:49:44.504627+00', ''),
	('00000000-0000-0000-0000-000000000000', '5e023b56-ec7e-4189-ada9-6f0c6b81ff51', '{"action":"token_refreshed","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"token"}', '2026-09-16 04:51:22.093725+00', ''),
	('00000000-0000-0000-0000-000000000000', '73c36576-e2e0-42f7-826e-9288fdf87b14', '{"action":"token_revoked","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"token"}', '2026-09-16 04:51:22.096932+00', ''),
	('00000000-0000-0000-0000-000000000000', '24baad68-457b-474f-9d42-d9dce80b7299', '{"action":"token_refreshed","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"token"}', '2026-09-16 06:15:03.173436+00', ''),
	('00000000-0000-0000-0000-000000000000', '26fbb059-3e69-4ac8-82b2-d533ccb845f1', '{"action":"token_revoked","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"token"}', '2026-09-16 06:15:03.175041+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e142eb0b-2382-4ef4-ade5-8d55aaa65755', '{"action":"token_refreshed","actor_id":"c69d867e-151b-4f47-b979-7e23f066879a","actor_username":"admin@nexus.com","actor_via_sso":false,"log_type":"token"}', '2026-09-16 06:15:03.257153+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c69d867e-151b-4f47-b979-7e23f066879a', 'authenticated', 'authenticated', 'admin@nexus.com', '$2a$10$WqA8IOugTtlsZ4hhFItnEeiaaUUS6RfZGAHdKWUKQX/wr7WItEIMe', '2026-09-16 02:49:29.614105+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-16 02:49:44.505524+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-09-16 02:49:29.606392+00', '2026-09-16 06:15:03.178571+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c69d867e-151b-4f47-b979-7e23f066879a', 'c69d867e-151b-4f47-b979-7e23f066879a', '{"sub": "c69d867e-151b-4f47-b979-7e23f066879a", "email": "admin@nexus.com", "email_verified": false, "phone_verified": false}', 'email', '2026-09-16 02:49:29.610894+00', '2026-09-16 02:49:29.610933+00', '2026-09-16 02:49:29.610933+00', '164348d3-c71e-4ca7-ace4-b34b57beace8');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('ab4bdbe1-44d4-41bd-95de-78daac63abbf', 'c69d867e-151b-4f47-b979-7e23f066879a', '2026-09-16 02:49:43.247464+00', '2026-09-16 02:49:43.247464+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL),
	('c5c8bc9c-1888-4f7c-b14a-a98b2a3ac309', 'c69d867e-151b-4f47-b979-7e23f066879a', '2026-09-16 02:49:44.505846+00', '2026-09-16 06:15:03.262159+00', NULL, 'aal1', NULL, '2026-09-16 06:15:03.262118', 'Next.js Middleware', '172.19.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('ab4bdbe1-44d4-41bd-95de-78daac63abbf', '2026-09-16 02:49:43.251739+00', '2026-09-16 02:49:43.251739+00', 'password', '6d3fdf00-a509-4536-a016-86c2d1c1a49d'),
	('c5c8bc9c-1888-4f7c-b14a-a98b2a3ac309', '2026-09-16 02:49:44.510112+00', '2026-09-16 02:49:44.510112+00', 'password', 'f2f489ba-e036-4074-9c86-f623108007d2');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'owldclpvnkux', 'c69d867e-151b-4f47-b979-7e23f066879a', false, '2026-09-16 02:49:43.249321+00', '2026-09-16 02:49:43.249321+00', NULL, 'ab4bdbe1-44d4-41bd-95de-78daac63abbf'),
	('00000000-0000-0000-0000-000000000000', 2, 'cwcpd3b3seso', 'c69d867e-151b-4f47-b979-7e23f066879a', true, '2026-09-16 02:49:44.508073+00', '2026-09-16 04:51:22.098096+00', NULL, 'c5c8bc9c-1888-4f7c-b14a-a98b2a3ac309'),
	('00000000-0000-0000-0000-000000000000', 3, 'u4bi4kdnwy6q', 'c69d867e-151b-4f47-b979-7e23f066879a', true, '2026-09-16 04:51:22.102042+00', '2026-09-16 06:15:03.175644+00', 'cwcpd3b3seso', 'c5c8bc9c-1888-4f7c-b14a-a98b2a3ac309'),
	('00000000-0000-0000-0000-000000000000', 4, 'qwtkwgari3gz', 'c69d867e-151b-4f47-b979-7e23f066879a', false, '2026-09-16 06:15:03.17748+00', '2026-09-16 06:15:03.17748+00', 'u4bi4kdnwy6q', 'c5c8bc9c-1888-4f7c-b14a-a98b2a3ac309');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: work_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."work_policies" ("id", "name", "description", "scheduled_hours_per_day", "scheduled_days_per_week", "rest_days", "rest_days_paid", "daily_rate_method", "annualization_factor", "ot_enabled", "requires_ot_approval", "ut_deduction_enabled", "night_differential_enabled", "custom_day_rules", "is_active", "created_at", "updated_at", "is_company_default") VALUES
	('f50f6027-72da-4182-bf59-7c5ea32758f0', 'Standard Corporate Policy', NULL, 8.00, 5.00, '["Saturday", "Sunday"]', false, 'annualized_261', 261.00, true, true, true, true, '{}', true, '2026-09-16 02:43:35.66991+00', '2026-09-16 02:43:35.66991+00', true);


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employees" ("id", "employee_code", "first_name", "middle_name", "last_name", "email", "phone", "address", "birth_date", "department_id", "position_id", "employment_status", "employment_type", "date_hired", "termination_date", "avatar_url", "sss_number", "philhealth_number", "pagibig_number", "tin_number", "bank_name", "bank_account", "created_at", "updated_at", "gender", "location", "work_schedule", "is_payroll_exempt") VALUES
	('352ee643-08b4-48c8-a962-e3c8ef0cfd16', 'EMP-0001-6Z', 'Juan', NULL, 'Dela Cruz', 'juan.delacruz1789527059616@example.com', '09171234567', NULL, NULL, NULL, NULL, 'Active', 'Regular', '2026-01-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 02:50:59.629305+00', '2026-09-16 02:50:59.629305+00', 'Male', NULL, '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}', false),
	('c29d4c50-e56e-4be4-8ff3-fe66e6742beb', 'EMP-0003-8G', 'Carlos', NULL, 'Reyes', 'carlos.reyes1789527059616@example.com', '09191234567', NULL, NULL, NULL, NULL, 'Active', 'Project-based', '2026-03-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 02:50:59.691269+00', '2026-09-16 02:50:59.691269+00', 'Male', NULL, '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}', false),
	('455e93ab-afab-4d27-83a0-d6c96bdec470', 'EMP-0004-2X', 'Elena', NULL, 'Gomez', 'elena.gomez1789527059616@example.com', '09201234567', NULL, NULL, NULL, NULL, 'Active', 'Regular', '2025-11-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 02:50:59.71439+00', '2026-09-16 02:50:59.71439+00', 'Female', NULL, '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}', false),
	('aa67510c-2c89-4b4d-bcb0-6da937016cdc', 'EMP-0002-97', 'Maria', NULL, 'Santos', 'maria.santos1789527059616@example.com', '09181234567', NULL, NULL, NULL, NULL, 'Active', 'Contractual', '2026-06-01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 02:50:59.670687+00', '2026-09-16 02:53:39.587661+00', 'Female', NULL, '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}', false);


--
-- Data for Name: _deprecated_employee_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _deprecated_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: attendance_revisions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cash_advances; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: company_statutory_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cash_advance_repayments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."company_settings" ("id", "company_name", "address", "tin", "email", "phone", "logo_url", "created_at", "updated_at", "sss_number", "philhealth_number", "pagibig_number") VALUES
	('d6ca19f6-38cf-4f71-b239-0d3c5785458b', 'Gogreen Payroll', 'Metro Manila, Philippines', '', '', '', NULL, '2026-09-16 02:43:35.572095+00', '2026-09-16 06:32:37.971211+00', '', '', '');


--
-- Data for Name: employee_compensation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employee_compensation_history" ("id", "employee_id", "salary_type", "basic_salary", "daily_rate", "hourly_rate", "pay_frequency", "working_hours_per_day", "working_days_per_week", "effective_from", "effective_to", "created_at", "updated_at", "salary_basis", "weekly_rate") VALUES
	('46e2bd2d-1be0-4666-bbbd-8addb2af55cb', '352ee643-08b4-48c8-a962-e3c8ef0cfd16', 'Monthly', 600.00, NULL, NULL, 'Weekly', 8.00, 5.00, '2026-07-26', '2026-08-15', '2026-09-16 02:52:03.554963+00', '2026-09-16 02:52:27.702234+00', 'Monthly', NULL),
	('3981a6f0-4a08-48cf-b2ae-c1eec7286f4a', '352ee643-08b4-48c8-a962-e3c8ef0cfd16', 'Daily', 600.00, 600.00, NULL, 'Weekly', 8.00, 5.00, '2026-08-16', NULL, '2026-09-16 02:52:27.722175+00', '2026-09-16 02:52:27.722175+00', 'Daily', NULL),
	('3be05234-e5b0-49bc-9383-e423eedcf7c6', '455e93ab-afab-4d27-83a0-d6c96bdec470', 'Daily', 500.00, 500.00, NULL, 'Weekly', 8.00, 5.00, '2026-07-26', NULL, '2026-09-16 02:53:00.509904+00', '2026-09-16 02:53:00.509904+00', 'Daily', NULL),
	('ef384a9e-0f9e-41ce-9b36-20f41ff8b9b9', 'c29d4c50-e56e-4be4-8ff3-fe66e6742beb', 'Daily', 500.00, 500.00, NULL, 'Weekly', 8.00, 5.00, '2026-08-16', NULL, '2026-09-16 02:53:31.955575+00', '2026-09-16 02:53:31.955575+00', 'Daily', NULL),
	('3e2662a1-db3a-4bf9-af65-d3f02e35e01d', 'aa67510c-2c89-4b4d-bcb0-6da937016cdc', 'Daily', 800.00, 800.00, NULL, 'Weekly', 8.00, 5.00, '2026-08-16', NULL, '2026-09-16 02:54:14.603054+00', '2026-09-16 02:54:14.603054+00', 'Daily', NULL);


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: employee_leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: employee_statutory_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employee_statutory_profiles" ("id", "employee_id", "sss_applicable", "philhealth_applicable", "pagibig_applicable", "effective_from", "effective_to", "reason", "created_by", "created_at", "updated_at", "tax_applicable", "is_mwe") VALUES
	('bb2077ce-5f68-429e-b85a-9db57fd85acf', '352ee643-08b4-48c8-a962-e3c8ef0cfd16', true, true, true, '2026-01-15', NULL, 'Initial setup on hire', NULL, '2026-09-16 02:50:59.645806+00', '2026-09-16 02:50:59.645806+00', true, false),
	('37847cc7-d951-424c-8a55-c7e9936b2ce5', 'aa67510c-2c89-4b4d-bcb0-6da937016cdc', true, true, true, '2026-06-01', NULL, 'Initial setup on hire', NULL, '2026-09-16 02:50:59.677755+00', '2026-09-16 02:50:59.677755+00', true, false),
	('36c2beb0-b96f-4359-8d62-212b4a84111b', 'c29d4c50-e56e-4be4-8ff3-fe66e6742beb', true, true, true, '2026-03-10', NULL, 'Initial setup on hire', NULL, '2026-09-16 02:50:59.696809+00', '2026-09-16 02:50:59.696809+00', true, false),
	('847dcccc-31a4-49eb-8eff-f27c1f2e470d', '455e93ab-afab-4d27-83a0-d6c96bdec470', true, true, true, '2025-11-20', NULL, 'Initial setup on hire', NULL, '2026-09-16 02:50:59.720963+00', '2026-09-16 02:50:59.720963+00', true, false);


--
-- Data for Name: employee_work_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employee_work_policies" ("id", "employee_id", "work_policy_id", "effective_from", "effective_to", "created_at", "updated_at") VALUES
	('4acd88b0-71ca-4844-badf-c1ededf996fa', '352ee643-08b4-48c8-a962-e3c8ef0cfd16', 'f50f6027-72da-4182-bf59-7c5ea32758f0', '2026-01-15', NULL, '2026-09-16 02:50:59.658179+00', '2026-09-16 02:50:59.658179+00'),
	('d2011fba-1502-4f87-b21f-1d933d646c9e', 'c29d4c50-e56e-4be4-8ff3-fe66e6742beb', 'f50f6027-72da-4182-bf59-7c5ea32758f0', '2026-03-10', NULL, '2026-09-16 02:50:59.704474+00', '2026-09-16 02:50:59.704474+00');


--
-- Data for Name: government_contribution_tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."government_contribution_tables" ("id", "contribution_type", "name", "effective_from", "effective_to", "is_active", "created_at", "updated_at", "agency", "reference_number", "source_url", "notes", "version", "table_type", "source_agency", "issuance_reference", "statutory_effective_from", "status") VALUES
	('a8a413a8-cc14-4745-8b85-462a69d9c65f', 'SSS', 'SSS Contribution Schedule — Circular No. 2024-006', '2025-01-01', NULL, true, '2026-09-16 03:10:13.411613+00', '2026-09-16 03:10:13.443787+00', NULL, NULL, 'https://www.sss.gov.ph/sss-contribution-table/', NULL, NULL, 'government', 'Social Security System', 'SSS Circular No. 2024-006', '2025-01-01', 'Published'),
	('f5bfaa82-6d59-4629-ba92-fe314faf483a', 'SSS', 'SSS 2026', '2026-01-01', NULL, true, '2026-09-16 03:10:23.358719+00', '2026-09-16 03:10:23.358719+00', NULL, NULL, NULL, NULL, NULL, 'government', NULL, NULL, NULL, 'Draft'),
	('f6a9485a-1713-4a3c-b1fe-323c9d415a93', 'PhilHealth', 'PhilHealth 5% 2026', '2026-01-01', NULL, true, '2026-09-16 03:10:23.382803+00', '2026-09-16 03:10:23.382803+00', NULL, NULL, NULL, NULL, NULL, 'government', NULL, NULL, NULL, 'Draft'),
	('a6cf40d2-a809-4e75-b58c-032f70194adc', 'Pag-IBIG', 'Pag-IBIG 2026', '2026-01-01', NULL, true, '2026-09-16 03:10:23.398534+00', '2026-09-16 03:10:23.398534+00', NULL, NULL, NULL, NULL, NULL, 'government', NULL, NULL, NULL, 'Draft');


--
-- Data for Name: government_contribution_brackets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."government_contribution_brackets" ("id", "contribution_table_id", "salary_min", "salary_max", "employee_amount", "employer_amount", "employee_rate", "employer_rate", "created_at", "updated_at", "monthly_salary_credit", "regular_ss_employee", "regular_ss_employer", "mpf_employee", "mpf_employer", "ec_employer") VALUES
	('31ed49d9-85a9-418a-b261-e87bf32b63ae', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 0.00, 5249.99, 250.00, 500.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 5000.00, 250.00, 500.00, 0.00, 0.00, 10.00),
	('809190fc-7b52-4182-aa90-cc6494aee404', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 5250.00, 5749.99, 275.00, 550.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 5500.00, 275.00, 550.00, 0.00, 0.00, 10.00),
	('5a24bf16-b928-4576-99f8-b8b143cebb2e', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 5750.00, 6249.99, 300.00, 600.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 6000.00, 300.00, 600.00, 0.00, 0.00, 10.00),
	('5c79c9e1-9042-43cc-bf46-59b0991818ce', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 6250.00, 6749.99, 325.00, 650.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 6500.00, 325.00, 650.00, 0.00, 0.00, 10.00),
	('918e4cc6-2574-48b5-a28d-a22daa42d02b', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 6750.00, 7249.99, 350.00, 700.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 7000.00, 350.00, 700.00, 0.00, 0.00, 10.00),
	('ac77256c-db5b-4f0c-9c6f-65106a8f982a', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 7250.00, 7749.99, 375.00, 750.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 7500.00, 375.00, 750.00, 0.00, 0.00, 10.00),
	('b735abeb-c15c-4c84-85e1-490caa7bc9c8', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 7750.00, 8249.99, 400.00, 800.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 8000.00, 400.00, 800.00, 0.00, 0.00, 10.00),
	('463b7dc0-4f69-4496-a801-d6913bbb1cbc', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 8250.00, 8749.99, 425.00, 850.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 8500.00, 425.00, 850.00, 0.00, 0.00, 10.00),
	('0d0359d4-9030-4244-a1f5-7cb2be742f73', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 8750.00, 9249.99, 450.00, 900.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 9000.00, 450.00, 900.00, 0.00, 0.00, 10.00),
	('82f25d97-3505-49ae-bb0b-5a675d871cc3', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 9250.00, 9749.99, 475.00, 950.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 9500.00, 475.00, 950.00, 0.00, 0.00, 10.00),
	('8952b503-e7be-48a4-813a-1795c33fb027', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 9750.00, 10249.99, 500.00, 1000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 10000.00, 500.00, 1000.00, 0.00, 0.00, 10.00),
	('6b7a30c9-3b7d-4c9c-84d2-afa04f634826', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 10250.00, 10749.99, 525.00, 1050.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 10500.00, 525.00, 1050.00, 0.00, 0.00, 10.00),
	('0742a3b5-8cfd-4e55-88bb-7e2ca2e37d43', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 10750.00, 11249.99, 550.00, 1100.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 11000.00, 550.00, 1100.00, 0.00, 0.00, 10.00),
	('42dabc23-92c3-4355-ba00-8cd58fdb89bf', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 11250.00, 11749.99, 575.00, 1150.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 11500.00, 575.00, 1150.00, 0.00, 0.00, 10.00),
	('b7459476-99fc-4621-84cc-c54c1715a16c', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 11750.00, 12249.99, 600.00, 1200.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 12000.00, 600.00, 1200.00, 0.00, 0.00, 10.00),
	('0a2173f6-7e53-4554-b65a-706b68bb2850', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 12250.00, 12749.99, 625.00, 1250.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 12500.00, 625.00, 1250.00, 0.00, 0.00, 10.00),
	('cfe524ec-df4c-43b0-beb9-4cce6809e4cf', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 12750.00, 13249.99, 650.00, 1300.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 13000.00, 650.00, 1300.00, 0.00, 0.00, 10.00),
	('705135d1-d335-4e2f-b755-db4cdcfb2ec5', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 13250.00, 13749.99, 675.00, 1350.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 13500.00, 675.00, 1350.00, 0.00, 0.00, 10.00),
	('1ff6a451-7dd9-4d72-ae5b-a6a7b99938c8', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 13750.00, 14249.99, 700.00, 1400.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 14000.00, 700.00, 1400.00, 0.00, 0.00, 10.00),
	('0ed80391-3636-4018-bc65-3cbd7613b9a4', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 14250.00, 14749.99, 725.00, 1450.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 14500.00, 725.00, 1450.00, 0.00, 0.00, 10.00),
	('1b9aa5ee-a269-467d-86a5-2754a7e8c9d8', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 14750.00, 15249.99, 750.00, 1500.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 15000.00, 750.00, 1500.00, 0.00, 0.00, 30.00),
	('6690db84-f506-46e2-b8db-2f27c774852c', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 15250.00, 15749.99, 775.00, 1550.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 15500.00, 775.00, 1550.00, 0.00, 0.00, 30.00),
	('960630e6-92f0-44b4-b635-d46d7708ff27', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 15750.00, 16249.99, 800.00, 1600.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 16000.00, 800.00, 1600.00, 0.00, 0.00, 30.00),
	('78edc867-98c9-44a3-957a-4e3b61400848', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 16250.00, 16749.99, 825.00, 1650.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 16500.00, 825.00, 1650.00, 0.00, 0.00, 30.00),
	('7d82832e-a2b2-4713-983b-73f31f4c73d9', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 16750.00, 17249.99, 850.00, 1700.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 17000.00, 850.00, 1700.00, 0.00, 0.00, 30.00),
	('e9791204-325c-4bf4-947b-4fb7333af11d', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 17250.00, 17749.99, 875.00, 1750.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 17500.00, 875.00, 1750.00, 0.00, 0.00, 30.00),
	('06e89266-5a4a-4e55-b2bd-3057fbb61f62', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 17750.00, 18249.99, 900.00, 1800.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 18000.00, 900.00, 1800.00, 0.00, 0.00, 30.00),
	('41250e7c-a2b7-4912-a447-cdbc0097a22d', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 18250.00, 18749.99, 925.00, 1850.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 18500.00, 925.00, 1850.00, 0.00, 0.00, 30.00),
	('456eaf7c-1b8b-41b1-8d1e-081f4bd6259a', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 18750.00, 19249.99, 950.00, 1900.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 19000.00, 950.00, 1900.00, 0.00, 0.00, 30.00),
	('d72c5a01-2080-4b3b-9529-ddecd482085b', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 19250.00, 19749.99, 975.00, 1950.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 19500.00, 975.00, 1950.00, 0.00, 0.00, 30.00),
	('6f62da57-8ec4-4ecc-91db-10a820c8be1e', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 19750.00, 20249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 20000.00, 1000.00, 2000.00, 0.00, 0.00, 30.00),
	('9310c3d2-d790-4fdc-b166-01eb10d0b90a', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 20250.00, 20749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 20500.00, 1000.00, 2000.00, 25.00, 50.00, 30.00),
	('d7d21259-63f4-40c9-804a-97f9a9d1eced', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 20750.00, 21249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 21000.00, 1000.00, 2000.00, 50.00, 100.00, 30.00),
	('501f826e-1ee5-4cfb-9585-e30a07c847e3', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 21250.00, 21749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 21500.00, 1000.00, 2000.00, 75.00, 150.00, 30.00),
	('144b06a3-4879-4c49-8701-c6b1b75dc067', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 21750.00, 22249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 22000.00, 1000.00, 2000.00, 100.00, 200.00, 30.00),
	('1e3b87a5-3b38-4984-b63c-514e7e1104f6', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 22250.00, 22749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 22500.00, 1000.00, 2000.00, 125.00, 250.00, 30.00),
	('2425b5b2-3c9f-43ac-a75a-3f9a7b646bbb', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 22750.00, 23249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 23000.00, 1000.00, 2000.00, 150.00, 300.00, 30.00),
	('f2a28c8d-89b2-49ce-a184-3a6b6c7d14e1', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 23250.00, 23749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 23500.00, 1000.00, 2000.00, 175.00, 350.00, 30.00),
	('69c655ed-bae5-4912-aa75-8828f7285edf', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 23750.00, 24249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 24000.00, 1000.00, 2000.00, 200.00, 400.00, 30.00),
	('3c066680-c00b-4497-bead-60677dab5357', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 24250.00, 24749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 24500.00, 1000.00, 2000.00, 225.00, 450.00, 30.00),
	('d29fd42c-7b99-4193-9826-8341626b951b', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 24750.00, 25249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 25000.00, 1000.00, 2000.00, 250.00, 500.00, 30.00),
	('06c4c37d-6ac1-4104-a0fe-00b3094f7b63', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 25250.00, 25749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 25500.00, 1000.00, 2000.00, 275.00, 550.00, 30.00),
	('8dc4d3ef-c8b8-4c82-9dc3-e3506976b2a7', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 25750.00, 26249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 26000.00, 1000.00, 2000.00, 300.00, 600.00, 30.00),
	('73f36280-827d-4c89-963f-89b402b0d822', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 26250.00, 26749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 26500.00, 1000.00, 2000.00, 325.00, 650.00, 30.00),
	('404012d4-4e94-45eb-91c3-0b9b59a53005', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 26750.00, 27249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 27000.00, 1000.00, 2000.00, 350.00, 700.00, 30.00),
	('fbfa02da-a816-4934-8362-007b157dfcef', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 27250.00, 27749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 27500.00, 1000.00, 2000.00, 375.00, 750.00, 30.00),
	('53bc6bfb-ba41-47aa-8d0a-2da85e23c90e', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 27750.00, 28249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 28000.00, 1000.00, 2000.00, 400.00, 800.00, 30.00),
	('2c8d0b5b-f57d-40eb-9d10-9dd2e906abe2', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 28250.00, 28749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 28500.00, 1000.00, 2000.00, 425.00, 850.00, 30.00),
	('cb2b45a1-c4c1-4b9e-bce2-075129648471', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 28750.00, 29249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 29000.00, 1000.00, 2000.00, 450.00, 900.00, 30.00),
	('3cfe33a1-815e-4316-80f7-429e9db4d117', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 29250.00, 29749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 29500.00, 1000.00, 2000.00, 475.00, 950.00, 30.00),
	('eb05a1b4-919c-412b-a00a-c1301fb32457', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 29750.00, 30249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 30000.00, 1000.00, 2000.00, 500.00, 1000.00, 30.00),
	('88cc4115-5aab-487c-b561-32eab306a906', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 30250.00, 30749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 30500.00, 1000.00, 2000.00, 525.00, 1050.00, 30.00),
	('efb71822-ccae-4fb1-b9b6-60a6b3324df4', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 30750.00, 31249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 31000.00, 1000.00, 2000.00, 550.00, 1100.00, 30.00),
	('ddbacd80-d40b-49b2-a6e6-884420dabd9c', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 31250.00, 31749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 31500.00, 1000.00, 2000.00, 575.00, 1150.00, 30.00),
	('97b5cee7-e485-4446-91ea-7eb210cb48c6', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 31750.00, 32249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 32000.00, 1000.00, 2000.00, 600.00, 1200.00, 30.00),
	('f22ee5b2-d4ae-452a-956a-2c7c0185f94b', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 32250.00, 32749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 32500.00, 1000.00, 2000.00, 625.00, 1250.00, 30.00),
	('24047e87-85f6-46f1-8068-5dfb542629c4', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 32750.00, 33249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 33000.00, 1000.00, 2000.00, 650.00, 1300.00, 30.00),
	('8f92c73e-fc53-44fc-8bc1-d8ca37a79165', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 33250.00, 33749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 33500.00, 1000.00, 2000.00, 675.00, 1350.00, 30.00),
	('c2750c1d-90a0-470a-94f7-b2300b87cda5', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 33750.00, 34249.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 34000.00, 1000.00, 2000.00, 700.00, 1400.00, 30.00),
	('220f2b3f-a950-4e7f-9aa5-5062e809999b', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 34250.00, 34749.99, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 34500.00, 1000.00, 2000.00, 725.00, 1450.00, 30.00),
	('bf8fc99e-a14a-43b2-aa9c-c963406f2395', 'a8a413a8-cc14-4745-8b85-462a69d9c65f', 34750.00, NULL, 1000.00, 2000.00, 0.0000, 0.0000, '2026-09-16 03:10:13.435372+00', '2026-09-16 03:10:13.435372+00', 35000.00, 1000.00, 2000.00, 750.00, 1500.00, 30.00),
	('ff7f45fb-592c-4a14-97bb-f8f1d4112099', 'f5bfaa82-6d59-4629-ba92-fe314faf483a', 0.00, 999999.00, 1350.00, 2850.00, 0.0000, 0.0000, '2026-09-16 03:10:23.375267+00', '2026-09-16 03:10:23.375267+00', NULL, 0.00, 0.00, 0.00, 0.00, 0.00),
	('82b6e2e1-4705-4c76-9c81-13cf49e7e862', 'f6a9485a-1713-4a3c-b1fe-323c9d415a93', 10000.00, 100000.00, 0.00, 0.00, 0.0250, 0.0250, '2026-09-16 03:10:23.390935+00', '2026-09-16 03:10:23.390935+00', NULL, 0.00, 0.00, 0.00, 0.00, 0.00),
	('f0bdcb4c-cd7c-435f-946d-72dda6387aa8', 'a6cf40d2-a809-4e75-b58c-032f70194adc', 0.00, 999999.00, 0.00, 0.00, 0.0200, 0.0200, '2026-09-16 03:10:23.405025+00', '2026-09-16 03:10:23.405025+00', NULL, 0.00, 0.00, 0.00, 0.00, 0.00);


--
-- Data for Name: holiday_pay_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "name", "description", "created_at", "updated_at") VALUES
	('fc6c159f-b658-4ef4-9226-f5987faf867a', 'Super Admin', 'Full system access including configuration and user management.', '2026-09-16 02:43:34.721024+00', '2026-09-16 02:43:34.721024+00'),
	('ed6fc56b-fc2f-4b5f-ab14-c405bb3f6d0f', 'Payroll Admin', 'Can process payroll and manage employees, but cannot change core system settings.', '2026-09-16 02:43:34.721024+00', '2026-09-16 02:43:34.721024+00'),
	('b9a0a08d-15e6-46a0-9e2c-b55ca41969b3', 'Viewer', 'Read-only access to dashboard and reports.', '2026-09-16 02:43:34.721024+00', '2026-09-16 02:43:34.721024+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "role_id", "full_name", "email", "created_at", "updated_at", "employee_id", "permissions") VALUES
	('c69d867e-151b-4f47-b979-7e23f066879a', 'fc6c159f-b658-4ef4-9226-f5987faf867a', 'Nexus Admin', 'admin@nexus.com', '2026-09-16 02:49:29.606046+00', '2026-09-16 02:49:29.64398+00', NULL, '{}');


--
-- Data for Name: pagibig_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pagibig_configs" ("id", "name", "table_type", "status", "source_agency", "issuance_reference", "source_url", "statutory_effective_from", "effective_from", "effective_to", "is_active", "employee_rate_low", "employee_rate_high", "salary_threshold", "employer_rate", "max_compensation", "created_at", "updated_at", "created_by") VALUES
	('0a91b723-ad81-47bc-b27f-b14efc11344b', 'Pag-IBIG Contribution Schedule — HDMF Circular No. 460', 'government', 'Published', 'Home Development Mutual Fund (Pag-IBIG)', 'HDMF Circular No. 460', 'https://www.pagibigfund.gov.ph/', '2024-02-01', '2024-02-01', NULL, true, 0.010000, 0.020000, 1500.00, 0.020000, 10000.00, '2026-09-16 03:10:13.456435+00', '2026-09-16 03:10:13.456435+00', NULL);


--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_earnings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payroll_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: philhealth_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."philhealth_configs" ("id", "name", "table_type", "status", "source_agency", "issuance_reference", "source_url", "statutory_effective_from", "effective_from", "effective_to", "is_active", "premium_rate", "floor_mbs", "ceiling_mbs", "created_at", "updated_at", "created_by") VALUES
	('bf886353-0052-4dc2-a51b-1813841a265f', 'PhilHealth Premium Rate (Advisory 2025-0002 / RA 11223)', 'government', 'Published', 'Philippine Health Insurance Corporation', 'PhilHealth Advisory No. 2025-0002 / RA 11223 (UHC Act)', 'https://www.philhealth.gov.ph/', '2025-01-01', '2025-01-01', NULL, true, 0.050000, 10000.00, 100000.00, '2026-09-16 03:10:13.450215+00', '2026-09-16 03:10:13.450215+00', NULL);


--
-- Data for Name: statutory_schedule_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tax_tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tax_tables" ("id", "name", "effective_from", "effective_to", "is_active", "created_at", "updated_at", "agency", "reference_number", "source_url", "notes", "version") VALUES
	('3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'TRAIN/CREATE Law 2023 Onwards', '2023-01-01', NULL, true, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00', NULL, NULL, NULL, NULL, NULL),
	('5f67cbff-ad29-4741-aae8-8784065f1be4', 'BIR TRAIN Law Tax Table (RR 11-2018, Annex E)', '2018-01-01', NULL, true, '2026-09-16 03:10:38.967946+00', '2026-09-16 03:10:38.967946+00', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: tax_brackets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tax_brackets" ("id", "tax_table_id", "pay_frequency", "tax_status", "minimum_income", "maximum_income", "base_tax", "excess_rate", "created_at", "updated_at") VALUES
	('48778308-e522-4c4b-bb64-dd6a3a75721e', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 0.00, 685.00, 0.00, 0.0000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('65cd6044-3df7-48e0-aece-e91ae49408f6', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 685.00, 1095.00, 0.00, 0.1500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('cb4c424f-c761-46d0-9a47-50bc43725975', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 1096.00, 2191.00, 61.65, 0.2000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('b53cbe5c-1bb0-45ff-86d9-43b24716e989', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 2192.00, 5478.00, 280.85, 0.2500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('fbf5a12d-7b3b-47b1-a461-a8cef364cb62', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 5479.00, 21917.00, 1102.60, 0.3000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('6d2b12a7-0ab1-4ca7-8f42-995dcd7141d4', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Daily', 'Single/Married', 21918.00, NULL, 6034.00, 0.3500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('a9f7ae77-f9e4-4071-866d-221a0b0e8fb0', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 0.00, 4808.00, 0.00, 0.0000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('5fc97ae6-caf5-4f1d-b255-8b7eb8ad793c', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 4808.00, 7691.00, 0.00, 0.1500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('6387b048-b915-44a1-8a3c-7cecc46646a6', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 7692.00, 15384.00, 432.60, 0.2000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('681dc95d-a01d-4822-bb29-3b17b382d6fd', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 15385.00, 38461.00, 1971.20, 0.2500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('6ab08dc1-ad34-477f-87f0-2727d53d43a1', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 38462.00, 153845.00, 7740.45, 0.3000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('79b9fb1a-64b2-4c4c-9ffc-388f19f9b460', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Weekly', 'Single/Married', 153846.00, NULL, 42355.65, 0.3500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('af732d4a-fe64-433a-90fc-474ecca190ae', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 0.00, 10417.00, 0.00, 0.0000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('3ced962f-0ab8-497c-9615-3d4847b10137', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 10417.00, 16666.00, 0.00, 0.1500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('919c6859-bf97-4a66-b7f4-eda4ef2c26cf', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 16667.00, 33332.00, 937.50, 0.2000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('7fd83fe2-fa8a-4273-97bc-00b289b7a225', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 33333.00, 83332.00, 4270.70, 0.2500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('7b0e84ff-029e-4462-8a6a-f9dc9361dede', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 83333.00, 333332.00, 16770.70, 0.3000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('646302c7-eb02-466b-850c-3c6b41f38861', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Semi-Monthly', 'Single/Married', 333333.00, NULL, 91770.70, 0.3500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('433a2538-fa56-4265-87a3-4f8f34606158', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 0.00, 20833.00, 0.00, 0.0000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('000f1b03-a218-42f7-93ad-9a588c7c5442', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 20833.00, 33332.00, 0.00, 0.1500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('3ee1b9a8-fabf-482f-b772-e21dc672b5ee', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 33333.00, 66666.00, 1875.00, 0.2000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('e78ffee4-689c-4293-a43d-704dc7766566', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 66667.00, 166666.00, 8541.80, 0.2500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('9a851125-152d-4664-ab64-9cea1c6ca155', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 166667.00, 666666.00, 33541.80, 0.3000, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('aced5a0f-7e56-4289-80fa-0b543ec2df9b', '3f4e6cbb-b9c3-4cd4-b577-670d8e80297b', 'Monthly', 'Single/Married', 666667.00, NULL, 183541.80, 0.3500, '2026-09-16 02:43:35.84289+00', '2026-09-16 02:43:35.84289+00'),
	('c4841007-1daf-4c98-8aa9-ca2429035d25', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 0.00, 4807.99, 0.00, 0.0000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('74b1f618-3584-4e3f-80ea-70efdbe0fa68', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 4808.00, 7691.99, 0.00, 0.1500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('eaa9131f-82f5-4e2f-ae45-5296a9c572c6', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 7692.00, 15384.99, 432.60, 0.2000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('513b1fa7-de52-4d34-9df5-de1351a7dcab', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 15385.00, 38461.99, 1971.20, 0.2500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('5258651f-3384-476b-a32d-95c9656dcf0f', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 38462.00, 153845.99, 7740.45, 0.3000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('a7502768-3c79-4d12-a251-b807384dfcb3', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Weekly', 'Single/Married', 153846.00, NULL, 42355.65, 0.3500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('69df526b-aac2-451e-82f4-6e393ff4089b', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 0.00, 10416.99, 0.00, 0.0000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('47bb598e-d422-485c-8ea1-01f98890c392', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 10417.00, 16666.99, 0.00, 0.1500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('4288df2f-4955-43f4-b3fb-3ca3fea28e27', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 16667.00, 33332.99, 937.50, 0.2000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('b4da73fe-8975-4587-9b55-e974ca4e7eea', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 33333.00, 83332.99, 4270.70, 0.2500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('98f88cb1-2edd-45d5-8dbe-e6648564dc75', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 83333.00, 333332.99, 16770.70, 0.3000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('4d87adf3-327e-4e55-be9d-0fe6a510132a', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Semi-Monthly', 'Single/Married', 333333.00, NULL, 91770.70, 0.3500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('52006808-e97e-4976-9c7b-4ed66a4b7987', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 0.00, 20832.99, 0.00, 0.0000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('fe15a083-4755-43f3-9e7e-383935a2a3c1', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 20833.00, 33332.99, 0.00, 0.1500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('f6423ef2-122d-4318-9160-1e15b2c1ff42', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 33333.00, 66666.99, 1875.00, 0.2000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('e1ad6bec-f68b-4984-89b5-bd278c1d48fb', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 66667.00, 166666.99, 8541.80, 0.2500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('f1caec94-7838-4584-bb0b-b3c7c8bb9d5c', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 166667.00, 666666.99, 33541.80, 0.3000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('ca106fba-21eb-4ad7-9242-80673c749acf', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Monthly', 'Single/Married', 666667.00, NULL, 183541.80, 0.3500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('0748622a-58b3-4683-bc09-aaa9be2dd979', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 0.00, 684.99, 0.00, 0.0000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('c257c713-d161-491a-9fba-3559f7ac760b', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 685.00, 1095.99, 0.00, 0.1500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('93161282-2648-4ede-be99-add31781e838', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 1096.00, 2191.99, 61.65, 0.2000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('418fd2b4-e90e-41c2-b006-f3de1cca266f', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 2192.00, 5478.99, 280.85, 0.2500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('ce80bd7e-ca7d-4804-81a6-ce7f6189af4f', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 5479.00, 21917.99, 1102.60, 0.3000, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00'),
	('636c3416-2c9b-4fe0-ad9b-b422a1655985', '5f67cbff-ad29-4741-aae8-8784065f1be4', 'Daily', 'Single/Married', 21918.00, NULL, 6034.30, 0.3500, '2026-09-16 03:10:38.981786+00', '2026-09-16 03:10:38.981786+00');


--
-- Data for Name: timesheets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: timesheet_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: timesheet_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type", "versioning_status") VALUES
	('avatars', 'avatars', NULL, '2026-09-16 02:43:35.29694+00', '2026-09-16 02:43:35.29694+00', true, false, NULL, NULL, NULL, 'STANDARD', 'DISABLED');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 4, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict kdkItX0FrCivgfkz7agtAmuZM3dWTCHLzmm5LiaUGQjPE1vMDVYBSNiuWkd0UXV

RESET ALL;
