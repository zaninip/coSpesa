import { supabase, requireAuth } from "./app.js";
let user = null;
let shoppingId = null;

document.addEventListener("DOMContentLoaded", async () => {
    lucide.createIcons();
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