import { supabase, setLanguage, initLang } from "../app.js";
lucide.createIcons();

document.addEventListener("DOMContentLoaded", async () => {
    await initLang(); // inizializza lingua
    const langSelect = document.getElementById("lang-select");
    langSelect.value = localStorage.getItem("lang") || "it";
    langSelect.addEventListener("change", e => setLanguage(e.target.value));
    
    document.getElementById("signup").addEventListener("click", async () => {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            showModal({
                title: "Errore registrazione",
                message: error.message,
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
        } else {
            showModal({
                title: "Registrazione completata",
                message: "Ora effettua il login.",
                buttons: [{
                label: "OK",
                class: "btn btn-primary",
                onClick: () => window.location.href = "login.html"
                }]
            });
        }
    });
});