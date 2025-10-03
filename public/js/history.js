import { supabase, requireAuth, initLang, setLanguage, renderHeader } from "./app.js";
let user = null;
let shoppingId = null;

document.addEventListener("DOMContentLoaded", async () => {
    renderHeader('history.badge', [
        `<a id="back-to-shopping" href="shopping.html?id=${shoppingId}" class="btn btn-secondary flex items-center gap-2">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
            <span class="hidden sm:inline" data-i18n="shopping.badge">Spesa</span>
        </a>`
    ]);

    await initLang(); // inizializza lingua
    const langSel = document.getElementById("lang-switch");
    if (langSel) {
        langSel.value = localStorage.getItem("lang") || "it";
        langSel.addEventListener("change", (e) => setLanguage(e.target.value));
    }
    
    user = await requireAuth();

    const params = new URLSearchParams(window.location.search);
    shoppingId = params.get("id");
    if (!shoppingId) window.location.href = "dashboard.html";

    document.getElementById("back-to-shopping").href = `shopping.html?id=${shoppingId}`;

    await loadHistory();
    });

async function loadHistory() {
    const tb = document.getElementById("history-body");
    tb.innerHTML = "";
    const { data, error } = await supabase
        .from("products_history")
        .select("name, total_count, last_bought_at")
        .eq("shopping_id", shoppingId)
        .order("total_count", { ascending: false });

    if (error) {
        tb.innerHTML = `<tr><td colspan="3" class="muted">Errore</td></tr>`;
        return;
    }
    if (!data || !data.length) {
        tb.innerHTML = `<tr><td colspan="3" class="muted">Nessun prodotto ancora.</td></tr>`;
        return;
    }

    data.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.total_count}</td>
        <td>${r.last_bought_at ? new Date(r.last_bought_at).toLocaleDateString("it-IT") : "-"}</td>
    `;
        tb.appendChild(tr);
    });
}