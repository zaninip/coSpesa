import { supabase } from "./app.js";

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Utente già loggato → vai alla dashboard
    window.location.href = "dashboard.html";
  } else {
    // Utente non loggato → vai al login
    window.location.href = "login.html";
  }
})();