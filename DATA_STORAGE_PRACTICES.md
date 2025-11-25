# 📊 Praksa pohrane podataka - Vodič

## 🔍 Trenutno stanje

**Podaci se pohranjuju SAMO u Supabase bazu podataka** - to je jedina lokacija gdje se podaci trajno spremaju.

### Gdje se podaci spremaju:
- ✅ **Supabase PostgreSQL baza** - glavna lokacija za sve podatke
- ✅ **Supabase Storage** - za uploadane datoteke (abstracts)
- ❌ **Nigdje drugdje na webu** - podaci se ne spremaju na druge lokacije

## 🌐 Praksa sa sličnim platformama

### 1. **Eventbrite, Meetup, Eventzilla**
- Koriste vlastitu bazu podataka (obično PostgreSQL ili MySQL)
- **Backup strategija**: Automatski dnevni backupi
- **Export opcije**: CSV/Excel export za organizatore
- **Sigurnost**: SSL enkripcija, GDPR compliance

### 2. **Google Forms, Typeform**
- Podaci se spremaju u Google Sheets ili vlastitu bazu
- **Backup**: Automatski backupi u cloud storage
- **Export**: Mogućnost preuzimanja CSV/Excel
- **Sigurnost**: Enterprise-level sigurnost

### 3. **Konferencijske platforme (ConfTool, EasyChair)**
- Vlastita baza podataka
- **Backup**: Redovni backupi (dnevni/tjedni)
- **Export**: CSV, Excel, PDF export
- **Sigurnost**: Enkripcija, access control

## ✅ Best Practices za vašu aplikaciju

### 1. **Glavna pohrana (Supabase)**
✅ **Trenutno implementirano:**
- Podaci se spremaju u Supabase PostgreSQL bazu
- Automatski backupi (Supabase nudi dnevne backupove)
- SSL enkripcija u tranzitu i mirovanju

### 2. **Backup strategija**

#### Opcija A: Supabase automatski backupi (preporučeno)
- Supabase automatski radi backup baze podataka
- Možete ručno kreirati backup u Supabase Dashboard → Database → Backups
- Backup se može preuzeti kao SQL dump

#### Opcija B: Redovni export podataka
- Admin panel već ima **CSV export** funkcionalnost
- Preporuka: Redovno (tjedno/mjesečno) eksportirati podatke
- Spremiti backup CSV datoteke na sigurnu lokaciju

#### Opcija C: Automatski backup API
- Kreirati cron job ili scheduled task
- Automatski eksportirati podatke u CSV/JSON
- Spremiti u cloud storage (Google Drive, Dropbox, AWS S3)

### 3. **Sigurnost podataka**

✅ **Trenutno implementirano:**
- Row Level Security (RLS) u Supabase
- Service Role Key za API pristup
- SSL enkripcija

⚠️ **Preporuke za production:**
- Ograničiti RLS politike samo na admin korisnike
- Koristiti Supabase Auth za autentifikaciju admina
- Redovno ažurirati API ključeve
- Implementirati rate limiting za API rute

### 4. **GDPR i compliance**

✅ **Trebate implementirati:**
- Privacy Policy stranica
- Terms of Service
- Cookie consent (ako koristite cookies)
- Mogućnost brisanja podataka (Right to be forgotten)
- Export podataka za korisnika (Right to data portability)

## 🚀 Preporučene dodatne funkcionalnosti

### 1. **Automatski backup API endpoint**

Kreirati API endpoint koji automatski eksportira podatke:

```typescript
// app/api/admin/backup/route.ts
// Eksportira sve registracije u JSON/CSV format
// Može se pozvati iz cron joba ili scheduled taska
```

### 2. **Email backup**

- Slanje redovnih backup emailova adminu
- CSV prilog sa svim registracijama

### 3. **Cloud storage backup**

- Automatski upload backupa u Google Drive/Dropbox/AWS S3
- Enkriptirani backupi

### 4. **Audit log**

- Zapisivanje svih promjena podataka
- Tko je kada pristupio podacima
- Povijest izmjena

## 📋 Checklist za production

- [ ] Redovni backupi (dnevni/tjedni)
- [ ] CSV export funkcionalnost (✅ već postoji)
- [ ] GDPR compliance (Privacy Policy, Terms)
- [ ] Sigurna autentifikacija admina
- [ ] Rate limiting za API
- [ ] Monitoring i alerting
- [ ] Disaster recovery plan
- [ ] Data retention policy

## ⚠️ Važne napomene

1. **Supabase je cloud servis** - podaci su već u cloudu, ne na vašem serveru
2. **Backup je važan** - Supabase automatski radi backup, ali preporučujem i ručne backupove
3. **GDPR compliance** - Obavezno implementirati za EU korisnike
4. **Sigurnost** - Nikada ne commitajte API ključeve u Git
5. **Access control** - Ograničiti pristup admin panelu samo autoriziranim korisnicima

## 🔗 Korisni linkovi

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Data Protection Best Practices](https://www.owasp.org/index.php/Data_Protection)

