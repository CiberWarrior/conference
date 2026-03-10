# ✅ Dovršavanje i testiranje – MeetFlow

**Svrha:** Jasan plan za završetak projekta i testiranje prije produkcije.

---

## 1. Status provjere (već urađeno)

| Provjera | Rezultat |
|----------|----------|
| `npm run lint` | ✅ No ESLint errors |
| `npm test` | ✅ 63 testa prolaze |
| `npm run build` | Pokreni ručno (traje ~1–2 min) |

---

## 2. Brze aktivnosti (30 min – opcijno)

### A. Database indeksi (≈30 sekundi)

Ako još nisu primijenjeni u Supabase:

1. Otvori: `scripts/apply-performance-indexes-fast.sql`
2. Kopiraj sadržaj
3. Supabase Dashboard → SQL Editor → paste → Run

**Rezultat:** brže učitavanje (3–5x).

### B. Build provjera

```bash
npm run build
```

Ako build padne, pogledaj grešku u terminalu.

---

## 3. Ručno testiranje – flow po flow

### Test korisnici

| Uloga | Email | Password | Stranica |
|------|-------|----------|----------|
| Super Admin | screatives.info@gmail.com | (tvoj password) | `/auth/admin-login` |
| Conference Admin | pingu2111@yahoo.com | (tvoj password) | `/auth/admin-login` |
| Sudionik | test@participant.com | (magic link / signup) | Registracija |

### Checklist – Admin dio

- [ ] Admin login radi (session ostaje nakon refresh)
- [ ] Dashboard se učitava
- [ ] Lista konferencija radi
- [ ] Kreiranje/uređivanje konferencije radi
- [ ] Registration fees / kotizacije – pregled i uređivanje
- [ ] Registrations – lista, filter, export (ako postoji)
- [ ] Abstracts – pregled, odobravanje/odbijanje
- [ ] Users – pregled ako imaš super_admin
- [ ] Check-in (QR/scan) – ako se koristi
- [ ] Certificates – slanje ako postoji

### Checklist – Javni dio

- [ ] Homepage `/` se učitava
- [ ] Stranica konferencije `/conferences/[slug]` radi
- [ ] Registracija `/conferences/[slug]/register` – kompletna registracija
- [ ] Plaćanje (Stripe test kartica: `4242 4242 4242 4242`) – minimalna test transakcija
- [ ] Sažetak (abstract) – submit `/conferences/[slug]/submit-abstract`
- [ ] Custom stranice – ako postoje `/conferences/[slug]/p/[pageSlug]`
- [ ] Promjena jezika (HR/EN) radi

### Checklist – Email i plaćanje

- [ ] Confirmation email stiže nakon registracije
- [ ] Stripe webhook – provjeri u Stripe Dashboard da su eventi uspješni
- [ ] Kotizacija 0 EUR – nema Stripe plaćanja, samo potvrda

---

## 4. Prije deploya (Deployment Checklist)

Kratka provjera prema `docs/00_ACTIVE/DEPLOYMENT_CHECKLIST.md`:

- [ ] Kod je pushan na GitHub
- [ ] Sve env varijable postavljene u Vercel (Supabase, Stripe, Resend, Upstash)
- [ ] Stripe webhook na production URL: `https://tvoj-domain.com/api/stripe-webhook`
- [ ] Supabase migracije primijenjene
- [ ] RLS policies omogućene

---

## 5. Redoslijed rada

```
1. npm run dev                    → Otvori localhost:3000
2. Test Admin flow (login, dashboard, konferencije)
3. Test Registration flow (nova registracija)
4. (Opcionalno) Test plaćanja s Stripe test karticom
5. npm run build                  → Provjeri da build prolazi
6. Deploy na Vercel
7. Smoke test na produkciji (login, jedna registracija)
```

---

## 6. Ako nešto ne radi

| Problem | Gdje gledati |
|---------|---------------|
| Build greška | Terminal output, `next build` |
| Auth ne radi | Supabase Auth, RLS, `lib/auth.ts` |
| Plaćanje ne radi | Stripe Dashboard (logs), `/api/stripe-webhook` |
| Email ne stiže | Resend dashboard, `lib/` email funkcije |
| Spore stranice | Database indeksi – provjeri jesu li primijenjeni |

---

**Kraj checkliste.** Nakon ove provjere projekt je spreman za produkciju i testiranje stvarnih korisnika.
