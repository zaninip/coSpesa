import { supabase } from "./app.js";
lucide.createIcons();

document.getElementById("signup").addEventListener("click", async () => {
const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;
const { error } = await supabase.auth.signUp({ email, password });
if (error) alert("Errore registrazione: " + error.message);
else {
    alert("Registrazione effettuata! Ora effettua il login.");
    window.location.href = "login.html";
}
});