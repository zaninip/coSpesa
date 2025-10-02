import { supabase, initLang, showModal } from "./app.js";

document.addEventListener("DOMContentLoaded", async () => {
    lucide.createIcons();

    await initLang(); // inizializza lingua
    
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