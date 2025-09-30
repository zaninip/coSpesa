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

// Carica lingua salvata o di sistema
export async function initLang() {
  const saved = localStorage.getItem("lang");
  const browser = navigator.language.slice(0, 2); // "it", "fr", "en"
  const lang = saved || (["it", "fr", "en"].includes(browser) ? browser : "en");
  await setLanguage(lang);
}
