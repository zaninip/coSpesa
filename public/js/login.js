import { supabase, setLanguage, initLang } from "./app.js";
lucide.createIcons();

document.addEventListener("DOMContentLoaded", async () => {
    await initLang(); // inizializza lingua
    const langSelect = document.getElementById("lang-select");
    langSelect.value = localStorage.getItem("lang") || "it";
    langSelect.addEventListener("change", e => setLanguage(e.target.value));

    document.getElementById("login").addEventListener("click", async () => {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            showModal({
                title: "Errore login",
                message: error.message,
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
        } else {
            window.location.href = "dashboard.html";
        }
    });
});