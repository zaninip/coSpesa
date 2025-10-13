import { supabase, requireAuth, showModal, showError, initMobileTooltips, initLang, setLanguage, translateElement, t, renderHeader } from "./app.js";
let user = null,
shoppingId = null,
shoppingCode = null;

document.addEventListener("DOMContentLoaded", async () => {
    renderHeader('shopping.badge', [
        `<a href="dashboard.html" class="btn btn-secondary flex items-center gap-2">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
            <span class="hidden sm:inline" data-i18n="dashboard.badge">Dashboard</span>
        </a>`,
        `<button id="history" class="btn btn-secondary flex items-center gap-2">
            <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
            <span class="hidden sm:inline" data-i18n="history.badge">Storico</span>
        </button>`
    ]);

    await initLang(); // inizializza lingua
    const langSel = document.getElementById("lang-switch");
    if (langSel) {
        langSel.value = localStorage.getItem("lang") || "it";
        langSel.addEventListener("change", (e) => setLanguage(e.target.value));
    }
    
    initMobileTooltips(); // attiva i tooltip su mobile
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
            title: t("modals.copied"),
            message: t("modals.copiedMessage").replace("{{code}}", shoppingCode),
            buttons: [{ label: t("modals.ok"), class: "btn btn-primary" }]
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
        showModal({
            title: t("modals.error"),
            message: t("modals.errorLoad"),
            buttons: [{label: t("modals.backDashboard"), class: "btn btn-primary", onClick: () => window.location.href = "dashboard.html"}]
        });
        return;
    }
    document.getElementById("shopping-title").textContent = data.title;
    document.getElementById("shopping-code").textContent = data.code;
    shoppingCode = data.code;
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
        const fragment = tpl.content.cloneNode(true); // clona il contenuto del template
        const li = fragment.querySelector("li"); // recupera il vero <li> dal fragment
        const nWrap = li.querySelector(".name");
        nWrap.dataset.full = p.name;
        nWrap.querySelector(".clip").textContent = p.name;
        if (p.bought) {
            li.querySelector(".name").classList.add("line-through", "text-gray-400");
            li.querySelector(".buy").disabled = true;
            li.querySelector(".buy").classList.add("opacity-50", "cursor-not-allowed");
        }
        li.querySelector(".buy").addEventListener("click", () =>
            handleProductBought(p.id, li)
        );
        li.querySelector(".remove").addEventListener("click", () =>
            handleProductRemoved(p.id, li)
        );
        ul.appendChild(li); // aggiunge il <li> alla lista
    });

    translateElement(ul);
    lucide.createIcons();
}

function appendProduct(p) {
    const ul = document.getElementById("products-list");
    const tpl = document.getElementById("tpl-product");
    const fragment = tpl.content.cloneNode(true);
    const li = fragment.querySelector("li");

    const nWrap = li.querySelector(".name");
    nWrap.dataset.full = p.name;
    nWrap.querySelector(".clip").textContent = p.name;

    if (p.bought) {
        li.querySelector(".name").classList.add("line-through", "text-gray-400");
        li.querySelector(".buy").disabled = true;
        li.querySelector(".buy").classList.add("opacity-50", "cursor-not-allowed");
    }
    li.querySelector(".buy").addEventListener("click", () =>
        handleProductBought(p.id, li)
    );
    li.querySelector(".remove").addEventListener("click", () =>
        handleProductRemoved(p.id, li)
    );
    ul.appendChild(li);
    translateElement(li);
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
        msg = t("modals.existingProduct");
        }
        showError(msg);
    }
    else {
        document.getElementById("new-product").value = "";
        // recupera l’ultimo prodotto inserito
        const { data: inserted } = await supabase
            .from("shopping_products")
            .select("*")
            .eq("shopping_id", shoppingId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (inserted) appendProduct(inserted);
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
        msg = t("modals.existingProduct");
        }
        showError(msg);
    }
    else {
        document.getElementById("history-select").value = "";
        // recupera l’ultimo prodotto inserito
        const { data: inserted } = await supabase
            .from("shopping_products")
            .select("*")
            .eq("shopping_id", shoppingId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (inserted) appendProduct(inserted);
    }
}

async function handleProductBought(productId, liEl) {
    const { error } = await supabase.rpc("increment_product_count", {
        pid: productId,
        sid: shoppingId,
    });

    if (error) {
        showError(error.message);
    } else {
        // segna visivamente come comprato
        const nameEl = liEl.querySelector(".name");
        nameEl.classList.add("line-through", "text-gray-400");

        // disabilita il bottone "Comprato"
        const buyBtn = liEl.querySelector(".buy");
        buyBtn.disabled = true;
        buyBtn.classList.add("opacity-50", "cursor-not-allowed");

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
        showError(error.message);
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
        showError(error.message);
    } else {
        // Trova tutti i prodotti comprati e rimuovili con fade-out
        document.querySelectorAll("#products-list .li .name.line-through")
            .forEach(nameEl => {
            const li = nameEl.closest(".li");
            if (li) removeWithAnimation(li, "all");
        });
    }
}

// Elimina TUTTI i prodotti (con conferma)
function clearAll() {
    showModal({
        title: t("modals.confirm"),
        message: t("modals.confirmDeleteAll"),
        buttons: [
        { label: t("modals.no"), class: "btn btn-secondary" },
        { label: t("modals.ok"), class: "btn btn-danger", onClick: clearAllConfirmed }
        ]
    });
}

async function clearAllConfirmed() {
    const { error } = await supabase
        .from("shopping_products")
        .delete()
        .eq("shopping_id", shoppingId);

    if (error) {
        showError(error.message);
    } else {
        // Rimuovi tutti i prodotti in lista con fade-out
        document.querySelectorAll("#products-list .li")
            .forEach(li => removeWithAnimation(li, "all"));
    }
}

function removeWithAnimation(li, type = "single") {
  if (type === "all") {
    li.classList.add("fade-out-up");
  } else {
    li.classList.add("fade-out");
  }
  setTimeout(() => li.remove(), 500); // 500ms come da CSS
}
