# 🔧 Troubleshooting Build Errors

## Problem: "Module not found: Can't resolve '@tiptap/react'"

### ✅ Provjera 1: Da li su paketi instalirani?

**U terminalu pokreni:**
```bash
cd "/Users/renata/Desktop/Conference Platform"

# Provjeri da node_modules postoji
ls -la node_modules/@tiptap

# Provjeri specifično @tiptap/react
ls -la node_modules/@tiptap/react
```

**Očekivani rezultat:**
- Trebao bi vidjeti listu @tiptap paketa
- `node_modules/@tiptap/react` folder trebao bi postojati

---

### ✅ Provjera 2: Da li je package.json ispravan?

**Provjeri da u `package.json` postoji:**
```json
"dependencies": {
  "@tiptap/react": "^3.16.0",
  "@tiptap/starter-kit": "^3.16.0",
  // ... ostali paketi
}
```

---

### 🔧 Rješenje 1: Reinstaliraj dependencies

```bash
cd "/Users/renata/Desktop/Conference Platform"

# Obriši node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Reinstaliraj sve
npm install
```

---

### 🔧 Rješenje 2: Obriši Next.js cache

Next.js cache može uzrokovati probleme nakon git pull-a:

```bash
cd "/Users/renata/Desktop/Conference Platform"

# Obriši .next folder (Next.js cache)
rm -rf .next

# Restart dev server
npm run dev
```

---

### 🔧 Rješenje 3: Kombinirano (Preporučeno)

```bash
cd "/Users/renata/Desktop/Conference Platform"

# 1. Obriši cache i node_modules
rm -rf .next node_modules package-lock.json

# 2. Reinstaliraj dependencies
npm install

# 3. Restart dev server
npm run dev
```

---

### 🔧 Rješenje 4: Provjeri Node.js verziju

Tiptap zahtijeva Node.js 16+:

```bash
# Provjeri verziju
node --version

# Trebalo bi biti v16 ili više
```

Ako imaš stariju verziju, update-aj Node.js:
- Preuzmi s [nodejs.org](https://nodejs.org/)
- Ili koristi nvm: `nvm install 18 && nvm use 18`

---

### 🔧 Rješenje 5: Provjeri da nema konflikata verzija

```bash
# Provjeri instalirane verzije
npm list @tiptap/react @tiptap/starter-kit

# Ako vidiš greške, forsiraj reinstalaciju
npm install @tiptap/react@^3.16.0 @tiptap/starter-kit@^3.16.0 --force
```

---

## Problem: "Cannot find module 'lowlight'"

### Rješenje:
```bash
npm install lowlight@^3.3.0
```

---

## Problem: Build radi, ali dev server ne

### Rješenje:
```bash
# Obriši cache
rm -rf .next

# Restart
npm run dev
```

---

## Problem: "Port 3000 already in use"

### Rješenje:
```bash
# Opcija 1: Koristi drugi port
npm run dev -- -p 3001

# Opcija 2: Pronađi i ubij proces na portu 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## ✅ Quick Diagnostic Commands

**Provjeri sve odjednom:**
```bash
cd "/Users/renata/Desktop/Conference Platform"

echo "=== Node.js Version ==="
node --version

echo "=== npm Version ==="
npm --version

echo "=== node_modules exists? ==="
test -d node_modules && echo "✅ Yes" || echo "❌ No"

echo "=== @tiptap/react installed? ==="
test -d node_modules/@tiptap/react && echo "✅ Yes" || echo "❌ No"

echo "=== .next cache exists? ==="
test -d .next && echo "⚠️ Yes (might need to delete)" || echo "✅ No"
```

---

## 📋 Checklist Prije Testiranja

- [ ] Node.js verzija 16+ (`node --version`)
- [ ] `node_modules` folder postoji
- [ ] `@tiptap/react` je instaliran
- [ ] `.next` cache je obrisan (ako je bio problem)
- [ ] `npm install` je pokrenut nakon git pull-a
- [ ] Dev server je restartan

---

## 🆘 Ako Ništa Ne Pomaže

1. **Provjeri da li radi na drugom računalu:**
   - Ako radi, problem je lokalni
   - Ako ne radi, problem je u kodu

2. **Provjeri git status:**
   ```bash
   git status
   git log --oneline -5
   ```

3. **Provjeri da li su sve migracije primijenjene na Supabase**

4. **Provjeri environment variables u `.env.local`**

---

## 💡 Prevencija

**Uvijek nakon git pull-a:**
```bash
npm install
rm -rf .next
npm run dev
```

**Ili kreiraj script u `package.json`:**
```json
"scripts": {
  "fresh": "rm -rf .next node_modules package-lock.json && npm install && npm run dev"
}
```

Tada možeš pokrenuti: `npm run fresh`
