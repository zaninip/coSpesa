# 🛒 CoSpesa

CoSpesa è una **web app collaborativa per organizzare la spesa** con amici, famiglia o coinquilini.  
Permette di creare, condividere e gestire liste della spesa in tempo reale, con storico dei prodotti acquistati.

---

## ✨ Funzionalità

- 🔑 Autenticazione utenti (Supabase Authentication)  
- 📝 Creazione spese con codice univoco condivisibile  
- 🤝 Unione a spese esistenti tramite codice  
- 📦 Gestione prodotti:  
  - Aggiunta manuale  
  - Aggiunta da storico personale  
  - Marcatura come comprato ✅ (aggiorna lo storico)  
  - Marcatura come eliminato ❌ (rimosso senza influenzare lo storico)  
- 📊 Storico prodotti con numero acquisti e ultima data  
- 🎨 Design moderno scuro + giallo con Tailwind, Lucide e animazioni fluide  

---

## 📂 Struttura progetto

/index.js             → server Express  
/package.json         → configurazione Node.js  
/public/              → cartella frontend  
  ├── app.js          → connessione Supabase  
  ├── styles.css      → stile custom (dark theme)  
  ├── login.html      → login  
  ├── signup.html     → registrazione  
  ├── dashboard.html  → lista spese e gestione  
  ├── shopping.html   → gestione singola spesa  
  ├── history.html    → storico prodotti  
  └── assets/logo.svg → logo app  

---

## ⚙️ Tecnologie

- Frontend: HTML, TailwindCSS, JavaScript (ESM)  
- Backend: Node.js con Express  
- Database & Auth: Supabase  
- Hosting dev: Replit  

---

## 🚀 Avvio progetto

1. Clona o importa il progetto su Replit  
2. Configura Supabase:  
   - Crea un progetto su Supabase  
   - Copia l’URL e la chiave **anon key** nel file `public/app.js`  
3. Installa le dipendenze:  

    npm install

4. Avvia il server:  

    npm start

5. Apri il progetto in browser → `/login.html`  

---

## 🗄️ Setup Database Supabase

Esegui queste query su Supabase SQL Editor:

    -- Tabelle principali
    create table if not exists shopping_lists (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      code text unique not null,
      owner_id uuid references auth.users(id) on delete cascade,
      created_at timestamp default now()
    );

    create table if not exists shopping_participants (
      id uuid primary key default gen_random_uuid(),
      shopping_id uuid references shopping_lists(id) on delete cascade,
      user_id uuid references auth.users(id) on delete cascade,
      unique (shopping_id, user_id)
    );

    create table if not exists shopping_products (
      id uuid primary key default gen_random_uuid(),
      shopping_id uuid references shopping_lists(id) on delete cascade,
      name text not null,
      count int default 0,
      bought boolean default false,
      created_at timestamp default now()
    );

    -- Storico prodotti per utente
    create table if not exists products_history (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade,
      name text not null,
      total_count int default 0,
      last_bought_at timestamp
    );

    -- Indice univoco case-insensitive per utente+nome
    create unique index if not exists idx_products_history_user_name
      on products_history(user_id, lower(name));

    -- Funzione per incrementare lo storico quando un prodotto è comprato
    create or replace function increment_product_count(pid uuid, uid uuid)
    returns void as $$
    begin
      update shopping_products
        set bought = true
        where id = pid;

      insert into products_history (user_id, name, total_count, last_bought_at)
      select uid, sp.name, 1, now()
      from shopping_products sp
      where sp.id = pid
      on conflict (user_id, lower(name))
      do update set
        total_count = products_history.total_count + 1,
        last_bought_at = now();
    end;
    $$ language plpgsql;

---

## 👥 Autore

Paolo Zanini - progetto sviluppato come esempio di app collaborativa full-stack con Supabase + Node.js + Replit. Codice scritto da Chat GPT-5.

---

## 📜 Licenza

MIT © 2025 – Puoi riutilizzare, modificare e distribuire liberamente.
