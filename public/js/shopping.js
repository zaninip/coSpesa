import { supabase, requireAuth, showModal } from "./app.js";
let user = null,
shoppingId = null;

document.addEventListener("DOMContentLoaded", async () => {
lucide.createIcons();
user = await requireAuth();

const params = new URLSearchParams(window.location.search);
shoppingId = params.get("id");
if (!shoppingId) window.location.href = "dashboard.html";

await loadShoppingInfo();
await loadProducts();
await loadHistoryProducts();

document
    .getElementById("history")
    .addEventListener(
    "click",
    () => (window.location.href = `history.html?id=${shoppingId}`),
    );
document.getElementById("copy-code").addEventListener("click", () => {
    const code = document.getElementById("shopping-code").textContent;
    navigator.clipboard.writeText(code);
    showModal({
    title: "Codice copiato",
    message: `Il codice della spesa <b>${code}</b> è stato copiato negli appunti.`,
    buttons: [{ label: "OK", class: "btn btn-primary" }]
    });
});

document
    .getElementById("add-product")
    .addEventListener("click", addManual);
document
    .getElementById("add-from-history")
    .addEventListener("click", addFromHistory);

document.getElementById("clear-bought")
    .addEventListener("click", clearBought);
document.getElementById("clear-all")
    .addEventListener("click", clearAll);
});

async function loadShoppingInfo() {
const { data, error } = await supabase
    .from("shopping_lists")
    .select("title, code")
    .eq("id", shoppingId)
    .single();
if (error || !data) {
    alert("Errore spesa");
    window.location.href = "dashboard.html";
    return;
}
document.getElementById("shopping-title").textContent = data.title;
document.getElementById("shopping-code").textContent = data.code;
}

async function loadProducts() {
const ul = document.getElementById("products-list");
ul.innerHTML = "";
const { data, error } = await supabase
    .from("shopping_products")
    .select("*")
    .eq("shopping_id", shoppingId)
    .order("created_at", { ascending: true });
if (error) {
    ul.innerHTML = `<li class="muted">Errore</li>`;
    return;
}
const tpl = document.getElementById("tpl-product");
data.forEach((p) => {
    // clona il contenuto del template
    const fragment = tpl.content.cloneNode(true);
    // recupera il vero <li> dal fragment
    const li = fragment.querySelector("li");
    const nWrap = li.querySelector(".name");
    nWrap.dataset.full = p.name;
    nWrap.querySelector(".clip").textContent = p.name;
    if (p.bought) {
    li.querySelector(".name").classList.add("line-through", "text-gray-400");
    li.querySelector(".buy").disabled = true;
    }
    li.querySelector(".buy").addEventListener("click", () =>
    handleProductBought(p.id, li)
    );
    li.querySelector(".remove").addEventListener("click", () =>
    handleProductRemoved(p.id, li)
    );
    // aggiunge il <li> alla lista
    ul.appendChild(li);
});
lucide.createIcons();
}

async function loadHistoryProducts() {
const select = document.getElementById("history-select");
select.innerHTML = `<option value="">— Seleziona prodotto —</option>`;
const { data, error } = await supabase
    .from("products_history")
    .select("name, total_count")
    .eq("shopping_id", shoppingId)
    .order("total_count", { ascending: false });
if (error) return;
data.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = `${p.name} (${p.total_count} volte)`;
    select.appendChild(opt);
});
}

async function addManual() {
const name = document.getElementById("new-product").value.trim();
if (!name) return;
const { error } = await supabase
    .from("shopping_products")
    .insert([{ shopping_id: shoppingId, name }]);
if (error) {
    let msg = error.message;
    if (msg.includes("ux_products_per_shopping_name_ci")) {
    msg = "Prodotto già presente nella spesa";
    }
    showModal({
    title: "Errore",
    message: msg,
    buttons: [{ label: "OK", class: "btn btn-primary" }]
    });
}
else {
    document.getElementById("new-product").value = "";
    loadProducts();
}
}

async function addFromHistory() {
const name = document.getElementById("history-select").value;
if (!name) return;
const { error } = await supabase
    .from("shopping_products")
    .insert([{ shopping_id: shoppingId, name }]);
if (error) {
    let msg = error.message;
    if (msg.includes("ux_products_per_shopping_name_ci")) {
    msg = "Prodotto già presente nella spesa";
    }
    showModal({
    title: "Errore",
    message: msg,
    buttons: [{ label: "OK", class: "btn btn-primary" }]
    });
}
else {
    document.getElementById("history-select").value = "";
    loadProducts();
}
}

async function handleProductBought(productId, liEl) {
const { error } = await supabase.rpc("increment_product_count", {
    pid: productId,
    sid: shoppingId,
});

if (error) {
    alert("Errore: " + error.message);
} else {
    // segna visivamente come comprato
    const nameEl = liEl.querySelector(".name");
    nameEl.classList.add("line-through", "text-gray-400");

    // disabilita il bottone "Comprato"
    liEl.querySelector(".buy").disabled = true;

    // aggiorna lo storico
    loadHistoryProducts();
}
}

async function handleProductRemoved(productId, liEl) {
const { error } = await supabase
    .from("shopping_products")
    .delete()
    .eq("id", productId);

if (error) {
    alert("Errore: " + error.message);
} else {
    // fade-out immediato e rimozione
    liEl.classList.add("fade-out");
    setTimeout(() => liEl.remove(), 500);
}
}

// Elimina solo i prodotti già comprati
async function clearBought() {
const { error } = await supabase
    .from("shopping_products")
    .delete()
    .eq("shopping_id", shoppingId)
    .eq("bought", true);

if (error) {
    alert("Errore: " + error.message);
} else {
    loadProducts();
}
}

// Elimina TUTTI i prodotti (con conferma)
function clearAll() {
showModal({
    title: "Sei sicuro?",
    message: "⚠️ Stai per eliminare TUTTI i prodotti della spesa, anche quelli non comprati.",
    buttons: [
    { label: "No", class: "btn btn-secondary" },
    { label: "Si", class: "btn btn-danger", onClick: clearAllConfirmed }
    ]
});
}

async function clearAllConfirmed() {
const { error } = await supabase
    .from("shopping_products")
    .delete()
    .eq("shopping_id", shoppingId);

if (error) {
    showModal({
    title: "Errore",
    message: error.message,
    buttons: [{ label: "OK", class: "btn btn-primary" }]
    });
} else {
    loadProducts();
}
}

// Tooltip mobile: tap per aprire/chiudere, tap fuori per chiudere
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