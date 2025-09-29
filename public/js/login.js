import { supabase } from "./app.js";
lucide.createIcons();

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