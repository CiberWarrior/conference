# Izračun PDV-a za turističke agencije (posebni postupak)

Ovaj dokument objašnjava kako u aplikaciji funkcionira obračun poreza na dodanu vrijednost (PDV) kada je organizator konferencije **turistička / putnička agencija** i primjenjuje **posebni postupak oporezivanja** (čl. 91.–94. Zakona o PDV-u).

---

## 1. Pravna osnova

- **Zakon o porezu na dodanu vrijednost (ZPDV)** – čl. 91. do 94.
- **Pravilnik o PDV-u** – čl. 187.
- **Direktiva 2006/112/EZ** – čl. 306.–310.
- **Provedbena uredba Vijeća 282/2011.**

Posebni postupak propisan je zbog specifičnosti djelatnosti: agencija prodaje usluge različitih pružatelja (smještaj, prijevoz, vodič itd.) objedinjene u jednu uslugu. Cilj je da se PDV na usluge smještaja i prijevoza plaća u državi u kojoj se usluga pruža, a kroz oporezivanje **marže** agencije PDV na tu maržu pripada državi sjedišta agencije.

---

## 2. Kada se primjenjuje posebni postupak

Posebni postupak agencija **mora** primjenjivati kada su ispunjena sva tri uvjeta:

1. **Prodaje usluge drugih poreznih obveznika** (npr. hotel, prijevoznik) – ne vlastite.
2. **Prodaje usluge u svoje ime** (ne u tuđe ime i za tuđi račun kao posrednik).
3. **Radi se o uslugama vezanim za putovanje** – barem jedna usluga mora biti **smještaj** ili **prijevoz**.

Ako agencija prodaje **samo kotizaciju** za sudjelovanje na kongresu, a kupcu **ne nudi** smještaj ni prijevoz, posebni postupak se **ne primjenjuje** – primjenjuje se redovni postupak (PDV na punu cijenu, s odbitkom pretporeza). U tom slučaju u aplikaciji **ne uključuj** opciju „Organizator je putnička agencija“.

---

## 3. Porezna osnovica i formula

Prema čl. 92. ZPDV-a i tumačenjima (Porezna uprava, Mišljenje SU; Cutvarić 2019, mint.gov.hr):

- **Porezna osnovica** = **razlika u cijeni** (marža) = ukupna naknada koju plaća kupac (prodajna cijena, bruto) **minus** izravni troškovi agencije za isporuke/usluge od drugih obveznika (iznosi po **ulaznim računima**, bruto).

**Formula:**

```
Marža (bruto) = Prodajna cijena (bruto) − Izravni troškovi (bruto)
```

- **Prodajna cijena (bruto)** = ono što sudionik/kupac plaća (ukupna naknada).
- **Izravni troškovi (bruto)** = iznosi koje agencija plaća dobavljačima – prema ulaznim računima (uključujući PDV na tim računima ako ga pružatelj zaračunava).

„Ostvarena razlika predstavlja ukupnu naknadu u kojoj je sadržan i PDV“ – na tu maržu (bruto) primjenjuje se **preračunata porezna stopa 20%**. Iznos PDV-a koji agencija plaća:

```
PDV na plaćanje = Marža (bruto) × 20%
```

**Napomena:** Na punu prodajnu cijenu ne obračunava se 25% PDV; agencija nema pravo na odbitak pretporeza po ulaznim računima za tu uslugu. Na računu se ne iskazuje iznos PDV-a, već napomena: **„posebni postupak oporezivanja – putničke agencije“**.

---

## 4. Kako to radi u aplikaciji

### 4.1. Postavke u adminu (Postavke konferencije → Kotizacija)

1. **PDV / VAT postavke**  
   Odaberi stopu PDV-a (npr. organizacijski 25%) i način unosa cijena (neto ili bruto). To određuje kako se iz unesene cijene računa **prodajna cijena (bruto)** koju plaća sudionik.

2. **„Organizator je putnička agencija (posebni postupak PDV-a)“**  
   Ako uključiš ovu opciju:
   - Za svaki tip kotizacije (Custom Fee Type) možeš unijeti **Trošak / nabavna cijena (za maržu)**.
   - Trošak = **iznos po ulaznim računima (bruto)** – ono što agencija plaća dobavljačima (npr. hotelu, prijevozniku), uključujući PDV na tim računima ako postoji.

3. **Prikaz u adminu**  
   Za svaki tip kotizacije s unesenim troškom sustav prikazuje:
   - **Neto / Bruto** prodajnu cijenu (prema postavkama PDV-a).
   - **Trošak** (bruto).
   - **Marža** (bruto) = prodajna (bruto) − trošak.
   - **PDV na maržu (20%)** = iznos koji agencija plaća poreznoj upravi na tu maržu.

### 4.2. Što vidi sudionik (javni obrazac za registraciju)

Sudionik **uvijek vidi samo konačnu cijenu (bruto)** – koliko treba platiti. Ne vidi nikakav račun marže niti PDV na maržu. To je u skladu s praksom: na računu za kupca navodi se ukupni iznos i napomena o posebnom postupku, bez isticanja PDV-a.

### 4.3. Primjer izračuna u aplikaciji

- Konferencija: PDV 25%, cijene se unose **bez PDV-a (neto)**.
- Tip kotizacije: unesena cijena **400** EUR (neto).
- Sustav računa: prodajna cijena (bruto) = 400 × 1,25 = **500** EUR (to sudionik plaća).
- Admin unese **trošak (bruto)** = 320 EUR (npr. iznos s računa hotela/prijevoznika).

Tada:

- Marža (bruto) = 500 − 320 = **180** EUR  
- PDV na plaćanje = 180 × 20% = **36** EUR  

U adminu će se prikazati: Neto 400 | Bruto 500 | Trošak 320 | Marža 180 | PDV na maržu (20%): 36 EUR.

---

## 5. Implementacija u kodu

- **`utils/pricing.ts`** – funkcija `getTravelAgencyMarginVat(sellingPriceGross, costGross)`:
  - `margin = sellingPriceGross - costGross` (ne negativno)
  - `vatPayableAmount = margin * 0.20`
  - Vraća `{ margin, vatPayableRate: 20, vatPayableAmount }`.

- **Admin postavke** – u `app/admin/conferences/[id]/settings/page.tsx`:
  - Checkbox „Organizator je putnička agencija“ postavlja `travel_agency_vat_mode`.
  - Za svaki Custom Fee Type opcionalno polje `cost` (bruto).
  - Prikaz marže i PDV-a 20% koristi `getAdminNetGross(...).withVAT` kao prodajnu bruto cijenu i `feeType.cost` kao bruto trošak.

- **Tipovi** – u `types/conference.ts`:
  - `ConferencePricing.travel_agency_vat_mode?: boolean`
  - `CustomFeeType.cost?: number` (izravni trošak, bruto).

---

## 6. Literatura i izvori

- **Porezna uprava RH** – [Mišljenje SU: Oporezivanje putničkih agencija](https://porezna-uprava.gov.hr/Misljenja/Detaljno/1945) (2015.).
- **Cutvarić, M.** – *Porezi i računovodstveni status pojedinih vrsta usluga turističkih agencija…* (mint.gov.hr, stručni ispiti, 2019.).
- Zakon o porezu na dodanu vrijednost (Narodne novine 73/13, 99/13, 148/13, 153/13, 143/14 i dalje).
- Pravilnik o porezu na dodanu vrijednost (Narodne novine 79/13, 85/13, 160/13, 35/14, 157/14 i dalje).

---

*Aplikacija ne izdaje račune; prikaz marže i PDV-a na maržu služi za pregled i planiranje. Za konačan obračun i izdavanje računa s napomenom „posebni postupak oporezivanja – putničke agencije“ koristi se računovodstveni / porezni sustav organizacije.*
