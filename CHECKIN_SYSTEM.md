# ✅ Check-In Sistem - Dokumentacija

## Pregled

Check-in sistem omogućava adminima da brzo i efikasno provere prisustvo učesnika na konferenciji koristeći QR kodove ili ručni unos registration ID-a.

## Funkcionalnosti

### 1. QR Kodovi za Registracije
- Svaki učesnik ima jedinstveni QR kod koji sadrži njihov Registration ID
- QR kodovi se mogu prikazati u admin panelu
- QR kodovi se mogu štampati na badge-ovima ili poslati emailom

### 2. Mobile-Friendly Check-In Stranica
- Stranica optimizovana za mobilne uređaje
- Kamera skeniranje QR kodova
- Ručni unos Registration ID-a
- Real-time feedback nakon check-in-a

### 3. Real-Time Status Tracking
- Status "Checked In" / "Not Checked In"
- Timestamp kada je učesnik check-in-ovao
- Prikaz u registrations listi
- Dashboard statistika

## Kako Koristiti

### Za Admina - Check-In Stranica

1. **Pristup Check-In Stranici:**
   - Otvori admin panel
   - Klikni na "Check-In" u sidebar-u
   - Ili direktno: `/admin/checkin`

2. **Skeniranje QR Koda:**
   - Klikni "Start QR Code Scanner"
   - Dozvoli pristup kameri
   - Usmeri kameru na QR kod učesnika
   - Sistem automatski proverava i ažurira status

3. **Ručni Check-In:**
   - Unesi Registration ID u polje
   - Klikni "Check In"
   - Status se ažurira automatski

### Za Admina - Registrations Lista

1. **Pregled Check-In Statusa:**
   - Otvori `/admin/registrations`
   - Vidi "Check-In" kolonu u tabeli
   - Status: "Checked In" (zeleno) ili "Not Checked In" (sivo)

2. **Prikaz QR Koda:**
   - Klikni na "QR" dugme u tabeli
   - Modal prikazuje QR kod za tu registraciju
   - Možeš kopirati Registration ID

3. **Dashboard Statistika:**
   - Otvori `/admin` dashboard
   - Vidi "Checked In" stat card
   - Prikazuje broj učesnika koji su check-in-ovali

## API Endpoints

### POST `/api/admin/checkin`
Check-in registracije.

**Request:**
```json
{
  "registrationId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully checked in",
  "registration": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "checkedIn": true,
    "checkedInAt": "2025-01-15T10:30:00Z"
  }
}
```

### GET `/api/admin/checkin?registrationId=uuid`
Proveri check-in status registracije.

**Response:**
```json
{
  "checkedIn": true,
  "checkedInAt": "2025-01-15T10:30:00Z",
  "registration": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Baza Podataka

### Migracija
Pokreni migraciju `007_add_checkin_fields.sql` u Supabase SQL Editoru:

```sql
-- Add check-in fields
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON registrations(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in_at ON registrations(checked_in_at);
```

### Polja
- `checked_in` (BOOLEAN) - Da li je učesnik check-in-ovao
- `checked_in_at` (TIMESTAMP) - Kada je učesnik check-in-ovao

## QR Kod Format

QR kod sadrži samo Registration ID (UUID):
```
550e8400-e29b-41d4-a716-446655440000
```

Kada se skenira, sistem:
1. Validira da Registration ID postoji
2. Proverava da li je već check-in-ovao
3. Ažurira status na `checked_in = true`
4. Postavlja `checked_in_at` na trenutni timestamp

## Mobile Optimizacija

Check-in stranica je optimizovana za mobilne uređaje:
- Responsive dizajn
- Kamera pristup sa back camera (facingMode: 'environment')
- Touch-friendly dugmad
- Veliki QR kod prikaz

## Bezbednost

- Check-in endpoint zahteva autentifikaciju (trebalo bi dodati)
- Validacija Registration ID-a
- Zaštita od duplog check-in-a (već check-in-ovani se ne mogu ponovo check-in-ovati)

## Buduća Poboljšanja

- [ ] Badge generisanje sa QR kodom (PDF)
- [ ] Email sa QR kodom pri registraciji
- [ ] Bulk check-in (skeniranje više QR kodova odjednom)
- [ ] Check-in history log
- [ ] Export check-in liste
- [ ] Real-time notifications za check-in

