# Real Estate Reservation Frontend

## Pokretanje projekta

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mock API (JSON Server)

```bash
cd mock-api
npm install
npm run api
```

API se pokreće na `http://localhost:7000`.  
Frontend se pokreće na `http://localhost:5173`.

> Oba servera moraju biti pokrenuta istovremeno.

### Demo kredencijali

```
Email:    agent@agencija.rs
Lozinka:  admin123
```

---

## Tehnologije

| Oblast | Tehnologija |
|---|---|
| Framework | React 19 + Vite |
| Jezik | TypeScript |
| Rutiranje | React Router v7 (data router) |
| Forme | React Hook Form + Zod v4 |
| HTTP | Axios |
| Stilovi | Tailwind CSS v4 + shadcn/ui |
| Notifikacije | Sonner (toast) |
| Mock API | JSON Server |
| Datum | date-fns |
| Tema | Prilagođeni ThemeProvider (light / dark / system) |

---

## Implementirane stranice

| Stranica | Ruta | Opis |
|---|---|---|
| Login | `/login` | Mock autentifikacija, validacija forme |
| Dashboard | `/dashboard` | Statistike, mini grafikon, poslednjih 5 nekretnina i rezervacija |
| Nekretnine | `/properties` | Tabela sa 8 filtera, sortiranje, paginacija, brisanje |
| Nova nekretnina | `/properties/create` | Forma sa 7 sekcija, validacija, auto cena/m² |
| Detalj nekretnine | `/properties/:id` | Galerija, info kartice, lista rezervacija, promena statusa |
| Izmena nekretnine | `/properties/:id/edit` | Ista forma, pre-popunjena sa postojećim podacima |
| Klijenti | `/clients` | Tabela sa filterima, broj rezervacija po klijentu |
| Novi klijent | `/clients/create` | Forma sa preferisanim gradovima (checkbox) |
| Detalj klijenta | `/clients/:id` | Kontakt, budžet, istorija obilazaka |
| Izmena klijenta | `/clients/:id/edit` | Ista forma, pre-popunjena |
| Rezervacije | `/reservations` | Tabela, filteri, brza promena statusa, otkazivanje |
| Nova rezervacija | `/reservations/create` | Preview nekretnine i klijenta, provera duplikata, pre-popunjavanje iz URL-a |
| Detalj rezervacije | `/reservations/:id` | Timeline statusa, kartice klijenta i nekretnine |
| Kalendar | `/calendar` | Mesečni grid sa tačkama po statusu, panel sa terminima dana |
| Podešavanja | `/settings` | CRUD šifarnici: gradovi, tipovi, statusi nekretnina i rezervacija |

---

## Mock podaci

Podaci se nalaze u `mock-api/db.json`. JSON Server ih servira kao REST API. Takođe je moguće i promeniti port na kome mock api radi u fajlu `mock-api/package.json` u delu pokretanja servera flag `-p`

### Kolekcije

| Endpoint | Opis | Početni broj zapisa |
|---|---|---|
| `/properties` | Nekretnine (stanovi, kuće, lokali, placevi) | 17 |
| `/clients` | Klijenti agencije | 8 |
| `/reservations` | Zakazani obilasci | 16 |
| `/cities` | Šifarnik gradova | 8 |
| `/propertyTypes` | Tipovi nekretnina | 4 |
| `/propertyStatuses` | Statusi nekretnina | 4 |
| `/reservationStatuses` | Statusi rezervacija | 4 |
| `/users` | Korisnici (samo za mock login) | 1 |

### Promena podataka

Otvoriti `mock-api/db.json` i direktno editovati JSON. JSON Server automatski detektuje promene i restartuje API bez ponovnog pokretanja.

### Primeri API poziva (JSON Server v1 sintaksa)

```bash
# Filtriranje
GET /properties?status=active&city=Beograd

# Sortiranje
GET /properties?_sort=price          # rastuće
GET /properties?_sort=-createdAt     # opadajuće (prefix -)

# Paginacija
GET /properties?_page=1&_per_page=10

# Filtriranje rezervacija po nekretnini
GET /reservations?propertyId=1
```
Kompletna dokumentacija JSON Server-a dostupna je na sledećem [linku](https://github.com/typicode/json-server#readme)

