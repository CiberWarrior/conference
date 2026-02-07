## Docs index (canonical)

Ovaj folder sadrži samo **aktualnu** dokumentaciju. Ako nešto ne radi kako piše ovdje, tretiraj dokument kao bug i ažuriraj ga.

### Setup & local development
- `QUICK_START.md`: minimalni koraci za pokretanje projekta
- `LOCALHOST_TESTING_CHECKLIST.md`: provjera lokalnog okruženja i feature flow-ovi
- `GDE_NACI_SUPABASE_KLJUCEVE.md`: gdje pronaći Supabase ključeve

### Deployment
- `DEPLOYMENT_CHECKLIST.md`: produkcijski checklist (env varijable, Stripe, email, RLS)
- `VERCEL_DEPLOY.md`: Vercel specifični koraci

### Registration & pricing
- `CUSTOM_REGISTRATION_FEE_DESIGN.md`: novi sustav kotizacija (custom_registration_fees)
- `REGISTRATION_FORM_FIELDS_GUIDE.md`: polja forme (custom fields)

### Payments / Stripe / emails
- `PAYMENT_OPTIONS_GUIDE.md`
- `PAYMENT_TERMS_QUICK_SETUP.md`
- `STRIPE_SETUP_LATER.md`

### Rate limiting
- `UPSTASH_SETUP.md`
- `RATE_LIMITING_AND_PERFORMANCE_EXPLAINED.md`

### Admin & access
- `ADMIN_ACCESS.md`
- `USER_MANAGEMENT_GUIDE.md`

---

## Policy: brisanje dokumenata

- **Ne brišemo** ništa osim ako pretraga **dokaže** da nema referenci u projektu.
- Ako nismo sigurni → **ne brišemo**; umjesto toga stavljamo stavku u **Kandidate za pregled** ispod.

### Već uklonjeno (povijesno)

- `AUTH_REFACTOR_SUMMARY.md`, `AUTH_REFACTOR_COMPLETED.md` – brisani ranije; **postojale su reference** u `AUTH_REFACTOR_FINAL.md` (popis dokumentacije). Reference u AUTH_REFACTOR_FINAL su uklonjene da ne upućuju na nepostojeće datoteke.
- `FEE_STRUCTURE_UPDATE.md` – brisan ranije; pretraga po imenu datoteke: **nema referenci** u kodu.
- `049_debug_conferences.sql`, `000_complete_setup.sql` – brisani ranije; pretraga: **nema referenci** u projektu (migracije se ne importaju po imenu).

### Kandidati za pregled (nema referenci u kodu – **nisu obrisani**)

Rezultati pretrage (grep po nazivu datoteke / uobičajenom nazivu dokumenta) – **0 rezultata** u cijelom projektu:

| Dokument | Napomena |
|----------|----------|
| `CODE_REVIEW_SUMMARY.md` | Nema referenci. |
| `FINAL_VERIFICATION.md` | Nema referenci. |
| `EVENT_ARCHITECTURE_PROPOSAL.md` | Nema referenci. |
| `WEBPACK_CACHE_WARNING.md` | Nema referenci. |
| `PAYMENT_OPTIONS_VISUALIZATION.md` | Nema referenci. |
| `DEVELOPER_REVIEW_AND_ROADMAP.md` | Nema referenci. |
| `ENHANCED_REGISTRATION_UX.md` | Nema referenci. |
| `LOGGING.md` | Nema referenci. |
| `LOGGING_BEST_PRACTICES.md` | Nema referenci. |
| `TROUBLESHOOTING_BUILD_ERRORS.md` | Nema referenci. |
| `CREATE_TEST_USER.sql` | Nema referenci (SQL skripta u docs/). |

Sljedeći dokumenti **imaju** međusobne reference (npr. PAYMENT_TERMS → MULTIPLE_PARTICIPANTS_FEATURE; PARTICIPANT_* reference jedni na druge) – **nisu kandidati** za brisanje bez daljnje odluke:  
`MULTIPLE_PARTICIPANTS_FEATURE.md`, `MULTIPLE_PARTICIPANTS_SUMMARY.md`, `PARTICIPANT_ACCOUNT_SYSTEM.md`, `PARTICIPANT_SYSTEM_QUICK_START.md`, `PARTICIPANT_SYSTEM_IMPLEMENTATION_SUMMARY.md`, `PAYMENT_TERMS_QUICK_SETUP.md`.
