import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm";

export function showModal({ title, message, buttons }) {
  const modal = document.getElementById("app-modal");
  if (!modal) return;

  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;

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
