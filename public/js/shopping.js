import { supabase, requireAuth, showModal, showError, initMobileTooltips, initLang, setLanguage, translateElement, t, renderHeader } from "./app.js";
let user = null, shoppingId = null, shoppingCode = null;

let detailProductId = null;
let pendingPhotoFile = null;
const productsMap = new Map();

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

    await initLang();
    const langSel = document.getElementById("lang-switch");
    if (langSel) {
        langSel.value = localStorage.getItem("lang") || "it";
        langSel.addEventListener("change", (e) => setLanguage(e.target.value));
    }

    initMobileTooltips();
    user = await requireAuth();

    const params = new URLSearchParams(window.location.search);
    shoppingId = params.get("id");
    if (!shoppingId) window.location.href = "dashboard.html";

    await loadShoppingInfo();
    await loadProducts();
    await loadHistoryProducts();

    document.getElementById("history").addEventListener(
        "click",
        () => (window.location.href = `history.html?id=${shoppingId}`),
    );
    document.getElementById("copy-code").addEventListener("click", () => {
        navigator.clipboard.writeText(shoppingCode);
        showModal({
            title: t("modals.copied"),
            message: t("modals.copiedMessage").replace("{{code}}", shoppingCode),
            buttons: [{ label: t("modals.ok"), class: "btn btn-primary" }]
        });
    });

    document.getElementById("add-product").addEventListener("click", addManual);
    document.getElementById("add-from-history").addEventListener("click", addFromHistory);
    document.getElementById("clear-bought").addEventListener("click", clearBought);
    document.getElementById("clear-all").addEventListener("click", clearAll);

    // Detail panel
    document.getElementById("detail-close").addEventListener("click", closeDetailPanel);
    document.getElementById("detail-cancel").addEventListener("click", closeDetailPanel);
    document.getElementById("product-detail").addEventListener("click", (e) => {
        if (e.target === document.getElementById("product-detail")) closeDetailPanel();
    });
    document.getElementById("detail-photo-area").addEventListener("click", () => {
        document.getElementById("detail-photo-input").click();
    });
    document.getElementById("detail-photo-input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pendingPhotoFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById("detail-photo-img");
            img.src = ev.target.result;
            img.classList.remove("hidden");
            document.getElementById("detail-photo-placeholder").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    });
    document.getElementById("detail-save").addEventListener("click", saveDetailPanel);
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
            buttons: [{ label: t("modals.backDashboard"), class: "btn btn-primary", onClick: () => window.location.href = "dashboard.html" }]
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
    productsMap.clear();
    const { data, error } = await supabase
        .from("shopping_products")
        .select("*")
        .eq("shopping_id", shoppingId)
        .order("created_at", { ascending: true });
    if (error) {
        ul.innerHTML = `<li class="muted">Errore</li>`;
        return;
    }
    data.forEach((p) => ul.appendChild(buildProductLi(p)));
    translateElement(ul);
    lucide.createIcons();
}

function buildProductLi(p) {
    const tpl = document.getElementById("tpl-product");
    const fragment = tpl.content.cloneNode(true);
    const li = fragment.querySelector("li");
    li.dataset.productId = p.id;

    const nWrap = li.querySelector(".name");
    nWrap.dataset.full = p.name;
    nWrap.querySelector(".clip").textContent = p.name;

    if (p.bought) {
        nWrap.classList.add("line-through", "text-gray-400");
        li.querySelector(".buy").disabled = true;
        li.querySelector(".buy").classList.add("opacity-50", "cursor-not-allowed");
    }

    updateProductIndicators(p.id, p, li);

    nWrap.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetailPanel(p.id);
    });

    li.querySelector(".buy").addEventListener("click", () => handleProductBought(p.id, li));
    li.querySelector(".remove").addEventListener("click", () => handleProductRemoved(p.id, li));

    productsMap.set(p.id, { ...p });
    return li;
}

function updateProductIndicators(productId, product, liEl) {
    const p = product ?? productsMap.get(productId);
    if (!p) return;
    const li = liEl || document.querySelector(`[data-product-id="${productId}"]`);
    if (!li) return;
    const indicators = li.querySelector(".indicators");
    if (!indicators) return;

    indicators.innerHTML = "";
    if (p.photo_url) indicators.innerHTML += `<i data-lucide="camera" class="w-3 h-3 text-[var(--brand)]"></i>`;
    if (p.note)      indicators.innerHTML += `<i data-lucide="file-text" class="w-3 h-3 text-[var(--brand)]"></i>`;

    const hasContent = !!(p.photo_url || p.note);
    indicators.classList.toggle("hidden", !hasContent);
    indicators.classList.toggle("flex", hasContent);
    if (hasContent) lucide.createIcons();
}

function appendProduct(p) {
    const ul = document.getElementById("products-list");
    const li = buildProductLi(p);
    ul.appendChild(li);
    translateElement(li);
    lucide.createIcons();
}

// ── Detail panel ──────────────────────────────────────────

function openDetailPanel(productId) {
    const product = productsMap.get(productId);
    if (!product) return;
    detailProductId = productId;
    pendingPhotoFile = null;

    document.getElementById("detail-product-name").textContent = product.name;
    document.getElementById("detail-note").value = product.note || "";
    document.getElementById("detail-photo-input").value = "";

    const img = document.getElementById("detail-photo-img");
    const placeholder = document.getElementById("detail-photo-placeholder");
    if (product.photo_url) {
        img.src = product.photo_url;
        img.classList.remove("hidden");
        placeholder.classList.add("hidden");
    } else {
        img.src = "";
        img.classList.add("hidden");
        placeholder.classList.remove("hidden");
    }

    document.getElementById("product-detail").classList.add("show");
    lucide.createIcons();
}

function closeDetailPanel() {
    document.getElementById("product-detail").classList.remove("show");
    pendingPhotoFile = null;
}

async function saveDetailPanel() {
    const saveBtn = document.getElementById("detail-save");
    saveBtn.disabled = true;

    const note = document.getElementById("detail-note").value.trim() || null;
    const product = productsMap.get(detailProductId);
    let photo_url = product?.photo_url || null;

    if (pendingPhotoFile) {
        const path = `${shoppingId}/${detailProductId}`;
        const { error: uploadError } = await supabase.storage
            .from("product-photos")
            .upload(path, pendingPhotoFile, { upsert: true, contentType: pendingPhotoFile.type });
        if (uploadError) {
            showError(uploadError.message);
            saveBtn.disabled = false;
            return;
        }
        photo_url = supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
        .from("shopping_products")
        .update({ note, photo_url })
        .eq("id", detailProductId);
    if (error) {
        showError(error.message);
        saveBtn.disabled = false;
        return;
    }

    if (product) {
        product.note = note;
        product.photo_url = photo_url;
        updateProductIndicators(detailProductId);
    }

    saveBtn.disabled = false;
    closeDetailPanel();
}

// ── Products ──────────────────────────────────────────────

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
        if (msg.includes("ux_products_per_shopping_name_ci")) msg = t("modals.existingProduct");
        showError(msg);
    } else {
        document.getElementById("new-product").value = "";
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

    const { data: histData } = await supabase
        .from("products_history")
        .select("last_photo_url")
        .eq("shopping_id", shoppingId)
        .eq("name", name)
        .single();
    const photo_url = histData?.last_photo_url || null;

    const { error } = await supabase
        .from("shopping_products")
        .insert([{ shopping_id: shoppingId, name, photo_url }]);
    if (error) {
        let msg = error.message;
        if (msg.includes("ux_products_per_shopping_name_ci")) msg = t("modals.existingProduct");
        showError(msg);
    } else {
        document.getElementById("history-select").value = "";
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
        const nameEl = liEl.querySelector(".name");
        nameEl.classList.add("line-through", "text-gray-400");
        const buyBtn = liEl.querySelector(".buy");
        buyBtn.disabled = true;
        buyBtn.classList.add("opacity-50", "cursor-not-allowed");
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
        if (detailProductId === productId) closeDetailPanel();
        productsMap.delete(productId);
        liEl.classList.add("fade-out");
        setTimeout(() => liEl.remove(), 500);
    }
}

async function clearBought() {
    const { error } = await supabase
        .from("shopping_products")
        .delete()
        .eq("shopping_id", shoppingId)
        .eq("bought", true);
    if (error) {
        showError(error.message);
    } else {
        document.querySelectorAll("#products-list .li .name.line-through")
            .forEach(nameEl => {
                const li = nameEl.closest(".li");
                if (!li) return;
                const pid = li.dataset.productId;
                if (pid) productsMap.delete(pid);
                removeWithAnimation(li, "all");
            });
    }
}

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
        closeDetailPanel();
        productsMap.clear();
        document.querySelectorAll("#products-list .li")
            .forEach(li => removeWithAnimation(li, "all"));
    }
}

function removeWithAnimation(li, type = "single") {
    li.classList.add(type === "all" ? "fade-out-up" : "fade-out");
    setTimeout(() => li.remove(), 500);
}
