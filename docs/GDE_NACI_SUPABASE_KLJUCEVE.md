# 🔑 Gdje pronaći Supabase API ključeve - Detaljni vodič

## ⚠️ VAŽNO: API Docs ≠ Settings > API

Ako vidite **"API docs"** ili **"API Documentation"**, to nije to što trebate!

Trebate **Settings > API** gdje se nalaze **Project URL** i **API keys**.

## 📍 Korak 1: Pronađite Settings

1. **U lijevom sidebaru** (lijevo od ekrana) tražite:
   - Ikonicu **zupčanika** ⚙️
   - Ili tekst **"Settings"**

2. **Kliknite na Settings** (ne na API docs!)

## 📍 Korak 2: Otvorite API sekciju

Nakon što kliknete Settings, vidjet ćete podmeni s opcijama:

- General
- **API** ← OVO KLIKNITE!
- Database
- Auth
- Storage
- Edge Functions
- itd.

**Kliknite na "API"** (ne na "API docs"!)

## 📍 Korak 3: Pronađite Project URL i API Keys

Nakon što kliknete Settings → API, vidjet ćete stranicu koja izgleda ovako:

```
┌─────────────────────────────────────────┐
│  Settings > API                         │
├─────────────────────────────────────────┤
│                                          │
│  Project URL                            │  ← OVO TRAŽITE!
│  ┌───────────────────────────────────┐ │
│  │ https://xxxxx.supabase.co    [📋] │ │  ← Kliknite 📋 da kopirate
│  └───────────────────────────────────┘ │
│                                          │
│  Project API keys                        │  ← OVO TRAŽITE!
│                                          │
│  anon public                             │
│  ┌───────────────────────────────────┐ │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6... │ │  ← Kliknite 📋 da kopirate
│  │                            [📋] │ │
│  └───────────────────────────────────┘ │
│                                          │
│  service_role                            │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••• │ │
│  │                      [Reveal] [📋]│ │  ← Kliknite Reveal, pa 📋
│  └───────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

## 🎯 Razlika između "API docs" i "Settings > API"

| API docs | Settings > API |
|----------|---------------|
| Dokumentacija API-ja | Project URL i API keys |
| Kako koristiti API | Ključevi za pristup |
| Ne trebate ovo! | **OVO TREBATE!** |

## 📋 Korak-po-korak:

1. ✅ U lijevom sidebaru kliknite **Settings** (⚙️)
2. ✅ U Settings meniju kliknite **API** (ne API docs!)
3. ✅ Vidjet ćete **Project URL** na vrhu - kliknite 📋 da kopirate
4. ✅ Vidjet ćete **Project API keys** - kopirajte anon i service_role keys

## 🆘 Ako i dalje ne možete pronaći:

Recite mi:
- Vidite li Settings u sidebaru?
- Kada kliknete Settings, vidite li opciju "API"?
- Što vidite kada kliknete na "API"?

Mogu vam pomoći kroz browser da točno pokažem!
