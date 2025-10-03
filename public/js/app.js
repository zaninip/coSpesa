import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm";

export function showModal({ title, message, buttons }) {
  const modal = document.getElementById("app-modal");
  if (!modal) return;

  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").innerHTML = message;

  const btnContainer = document.getElementById("modal-buttons");
  btnContainer.innerHTML = "";

  buttons.forEach(btn => {
    const b = document.createElement("button");
    b.textContent = btn.label;
    b.className = btn.class || "btn btn-secondary";
    b.onclick = () => {
      modal.classList.remove("show");
      if (btn.onClick) btn.onClick();
    };
    btnContainer.appendChild(b);
  });

  modal.classList.add("show");
}

export function showError(message, titleKey = "modals.error") {
  showModal({
    title: t(titleKey),
    message: message,
    buttons: [{ label: t("modals.ok"), class: "btn btn-primary" }]
  });
}

export function showSuccess(title, message) {
  showModal({
    title: title,
    message: message,
    buttons: [{ label: t("modals.ok"), class: "btn btn-primary" }]
  });
}

const supabaseUrl = "https://rwfloolnybguuswbrwre.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Zmxvb2xueWJndXVzd2Jyd3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg4NDQsImV4cCI6MjA3MzI1NDg0NH0.fDqj7LeAPMEP9FjemFA_LE-K4xP6JkTw0rQsQ6OU-X8";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth guard
export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session.user;
}

// Tooltip mobile: tap per aprire/chiudere, tap fuori per chiudere
export function initMobileTooltips() {
  
  document.addEventListener('click', (e) => {
  const isTouchOnly = window.matchMedia('(hover: none)').matches; // true su smartphone/tablet
  if (!isTouchOnly) return; // su desktop gestiamo via :hover in CSS

  const target = e.target.closest('.has-tooltip');

  if (target) {
      // Chiudi altri tooltip aperti
      document.querySelectorAll('.has-tooltip.show-tip').forEach(el => {
      if (el !== target) el.classList.remove('show-tip');
      });
      // Toggle su quello toccato
      target.classList.toggle('show-tip');
  } else {
      // Tap fuori: chiudi tutti
      document.querySelectorAll('.has-tooltip.show-tip').forEach(el => el.classList.remove('show-tip'));
  }
  });
}

let translations = {};
let currentLang = "it";

export async function setLanguage(lang) {
  try {
    const res = await fetch(`/languages/${lang}.json`);
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyTranslations();
  } catch (e) {
    console.error("Errore caricamento lingua:", e);
  }
}

export function t(key) {
  return key.split(".").reduce((o, k) => (o ? o[k] : null), translations) || key;
}

// Applica traduzioni a tutti gli elementi con data-lang
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) el.textContent = text;
  });
}

// Traduci un elemento specifico (e i suoi figli)
export function translateElement(container) {
  const root = container || document;
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) el.textContent = text;
  });
}

// Carica lingua salvata o di sistema
export async function initLang() {
  const saved = localStorage.getItem("lang");
  const browser = navigator.language.slice(0, 2); // "it", "fr", "en", "es"
  const lang = saved || (["it", "fr", "en", "es"].includes(browser) ? browser : "en");
  await setLanguage(lang);

  updateLanguageSelector(lang); // aggiorna selettore visuale
}

function updateLanguageSelector(lang) {
  const langFlag = document.getElementById("lang-flag");
  const langLabel = document.getElementById("lang-label");
  
  if (langFlag && langLabel) {
    langFlag.src = `assets/flags/${lang}.svg`;
    langLabel.textContent = lang.toUpperCase();
  }
}


// HEADER COMPONENT
export function renderHeader(badgeKey, buttons = []) {
  const header = document.querySelector('header');
  if (!header) return;
  
  // Determina se il logo deve essere cliccabile
  const isAuthPage = badgeKey === 'login.badge' || badgeKey === 'signup.badge';
  const logoHTML = isAuthPage 
    ? `<img src="assets/logo.svg" class="h-8 sm:h-9" alt="CoSpesa" />`
    : `<a href="dashboard.html"><img src="assets/logo.svg" class="h-8 sm:h-9" alt="CoSpesa" /></a>`;
  
  header.innerHTML = `
    <div class="container flex items-center justify-between py-3">
      <div class="flex items-center gap-3">
        ${logoHTML}
        <span class="badge" data-i18n="${badgeKey}">Badge</span>
      </div>
      <div class="flex items-center gap-2" id="header-buttons"></div>
    </div>
  `;
  
  // Aggiungi pulsanti personalizzati
  const btnContainer = document.getElementById('header-buttons');
  buttons.forEach(btn => {
    btnContainer.insertAdjacentHTML('beforeend', btn);
  });
  
  // Aggiungi sempre il language switcher alla fine
  btnContainer.insertAdjacentHTML('beforeend', getLanguageSwitcherHTML());
  
  lucide.createIcons();
  initLanguageMenu();
}

function getLanguageSwitcherHTML() {
  return `
    <div id="lang-switch" class="relative">
      <button id="lang-btn" class="input flex items-center gap-2 px-2 py-1 cursor-pointer min-w-[70px] sm:min-w-[90px]">
        <img id="lang-flag" src="assets/flags/it.svg" class="w-5 h-5" alt="IT">
        <span id="lang-label" class="hidden sm:inline">IT</span>
        <i data-lucide="chevron-down" class="w-4 h-4"></i>
      </button>
      <div id="lang-menu" class="absolute right-0 mt-2 hidden bg-[#0f0f0f] border border-[#2a2a2a] rounded-md shadow-lg z-50 min-w-[100px]">
        <button data-lang="it" class="flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] w-full text-left">
          <img src="assets/flags/it.svg" class="w-5 h-5" alt="IT"><span>IT</span>
        </button>
        <button data-lang="en" class="flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] w-full text-left">
          <img src="assets/flags/en.svg" class="w-5 h-5" alt="EN"><span>EN</span>
        </button>
        <button data-lang="fr" class="flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] w-full text-left">
          <img src="assets/flags/fr.svg" class="w-5 h-5" alt="FR"><span>FR</span>
        </button>
        <button data-lang="es" class="flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] w-full text-left">
          <img src="assets/flags/es.svg" class="w-5 h-5" alt="ES"><span>ES</span>
        </button>
      </div>
    </div>
  `;
}

export function initLanguageMenu() {
  const langBtn = document.getElementById("lang-btn");
  const langMenu = document.getElementById("lang-menu");
  if (!langBtn) return; // se la pagina non ha selettore

  // toggle menu
  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langMenu.classList.toggle("hidden");
  });

  // click fuori → chiude
  document.addEventListener("click", (e) => {
    if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
      langMenu.classList.add("hidden");
    }
  });

  // selezione lingua
  langMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang;
      await setLanguage(lang);
      updateLanguageSelector(lang);
      langMenu.classList.add("hidden");
    });
  });
}