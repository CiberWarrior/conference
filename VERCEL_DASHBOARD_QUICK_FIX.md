# ⚡ Brzo Rešenje - Dashboard se ne učitava na Vercel-u

## 🔍 Prvo proveri ovo (5 minuta)

### 1. Environment Variables na Vercel-u

1. Idi na [Vercel Dashboard](https://vercel.com/dashboard)
2. Izaberi tvoj projekat
3. Idi na **Settings** → **Environment Variables**
4. Proveri da li postoje:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY
```

**Ako ne postoje:**
- Dodaj ih sa vrednostima iz Supabase Dashboard-a
- **VAŽNO:** Nakon dodavanja, idi na **Deployments** i klikni **Redeploy** na poslednjem deployment-u

### 2. Provera u Browser Console

1. Otvori dashboard stranicu na Vercel-u
2. Pritisni **F12** (Developer Tools)
3. Idi na **Console** tab
4. Traži error poruke (crveno)

**Najčešći errori:**
- `Supabase is not configured` → Environment variables nisu postavljene
- `Unauthorized` → User nema admin role
- `Failed to fetch` → Network problem ili Supabase down

### 3. Provera Supabase

1. Idi na [Supabase Dashboard](https://app.supabase.com)
2. Proveri da li je projekat **aktivan**
3. Proveri **Settings** → **API** → kopiraj URL i anon key

### 4. Provera User Role

1. Idi na Supabase Dashboard → **Table Editor**
2. Otvori tabelu `user_profiles`
3. Pronađi svoj user (po email-u)
4. Proveri:
   - `role` = `'super_admin'` ili `'conference_admin'`
   - `active` = `true`

---

## 🛠️ Brzo Rešenje

### Ako vidiš error "Supabase is not configured":

1. **Dodaj environment variables na Vercel-u:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

2. **Redeploy:**
   - Vercel Dashboard → Deployments → ... (tri tačke) → Redeploy

3. **Sačekaj 2-3 minuta** i osveži stranicu

### Ako vidiš error "Unauthorized":

1. Proveri da li si ulogovan
2. Proveri `user_profiles` tabelu u Supabase
3. Postavi `role` i `active = true`

### Ako dashboard se učitava ali je prazan:

1. Proveri da li imaš konferencije u bazi
2. Proveri RLS policies u Supabase
3. Proveri Network tab u browser console

---

## 📞 Gde naći podatke

### Supabase URL i Keys:
1. Supabase Dashboard → Settings → API
2. **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
3. **anon public** key = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **service_role** key = `SUPABASE_SERVICE_ROLE_KEY` (⚠️ tajna!)

### Vercel Environment Variables:
1. Vercel Dashboard → Tvoj projekat → Settings → Environment Variables
2. Dodaj svaku varijablu posebno
3. **Production, Preview, Development** - izaberi sve tri

---

## ✅ Checklist

- [ ] Environment variables su postavljene na Vercel-u
- [ ] Projekat je redeploy-ovan
- [ ] Supabase projekat je aktivan
- [ ] User ima admin role u `user_profiles`
- [ ] User je `active = true`
- [ ] Browser console nema error poruke

---

## 🚨 Ako i dalje ne radi

1. **Proveri Vercel Logs:**
   - Vercel Dashboard → Tvoj projekat → Logs
   - Traži error poruke

2. **Proveri Supabase Logs:**
   - Supabase Dashboard → Logs
   - Traži failed requests

3. **Testiraj lokalno:**
   - `npm run dev`
   - Proveri da li radi lokalno
   - Ako radi lokalno, problem je u Vercel konfiguraciji

---

**Vreme potrebno:** 5-10 minuta
