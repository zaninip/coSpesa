import { supabase, requireAuth, showModal, initMobileTooltips } from "./app.js";
let user = null;

document.addEventListener("DOMContentLoaded", async () => {
    lucide.createIcons();
    initMobileTooltips(); // attiva i tooltip su mobile
    user = await requireAuth();
    await loadShoppingLists();

    // logout
    document
        .getElementById("logout")
        .addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    });

    // modali open/close
    const createModal = document.getElementById("create-modal");
    const createContent = document.getElementById("create-content");
    document
        .getElementById("open-create-modal")
        .addEventListener("click", () => {
        createModal.classList.remove("hidden");
        setTimeout(
            () => createContent.classList.remove("scale-95", "opacity-0"),
            10,
        );
        });
    document
        .getElementById("close-create")
        .addEventListener("click", closeCreate);
    document
        .getElementById("cancel-create")
        .addEventListener("click", closeCreate);
    function closeCreate() {
        createContent.classList.add("scale-95", "opacity-0");
        setTimeout(() => createModal.classList.add("hidden"), 150);
    }

    const joinModal = document.getElementById("join-modal");
    const joinContent = document.getElementById("join-content");
    document
        .getElementById("open-join-modal")
        .addEventListener("click", () => {
        joinModal.classList.remove("hidden");
        setTimeout(
            () => joinContent.classList.remove("scale-95", "opacity-0"),
            10,
        );
        });
    document
        .getElementById("close-join")
        .addEventListener("click", closeJoin);
    document
        .getElementById("cancel-join")
        .addEventListener("click", closeJoin);
    function closeJoin() {
        joinContent.classList.add("scale-95", "opacity-0");
        setTimeout(() => joinModal.classList.add("hidden"), 150);
    }

    // conferma crea
    document
        .getElementById("confirm-create")
        .addEventListener("click", async () => {
        const title = document.getElementById("create-title").value.trim();
        if (!title) {
            showModal({
                title: "Attenzione",
                message: "Inserisci un nome valido",
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
            return;
        }
        const code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
        const { data, error } = await supabase
            .from("shopping_lists")
            .insert([{ title, code, owner_id: user.id }])
            .select()
            .single();            
        if (error) {
            showModal({
            title: "Errore creazione",
            message: error.message,
            buttons: [{ label: "OK", class: "btn btn-primary" }]
            })};
        await supabase
            .from("shopping_participants")
            .insert([{ shopping_id: data.id, user_id: user.id }]);
        showModal({
            title: "Spesa creata",
            message: `Codice: ${data.code}`,
            buttons: [{ label: "OK", class: "btn btn-primary" }]
        });
        closeCreate();
        loadShoppingLists();
    });

    // conferma join
    document
        .getElementById("confirm-join")
        .addEventListener("click", async () => {
        const code = document
            .getElementById("join-code")
            .value.trim()
            .toUpperCase();
        if (!code) {
            showModal({
                title: "Attenzione",
                message: "Inserisci un codice valido",
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
            return;
        }
        const { data: list, error } = await supabase
            .from("shopping_lists")
            .select("id")
            .eq("code", code)
            .single();
        if (error || !list) {
            showModal({
                title: "Errore",
                message: "Codice non valido",
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
            return;
        }
        const { error: jerr } = await supabase
            .from("shopping_participants")
            .insert([{ shopping_id: list.id, user_id: user.id }]);
        if (jerr && !String(jerr.message).includes("duplicate")) {
            showModal({
                title: "Errore unione",
                message: jerr.message,
                buttons: [{ label: "OK", class: "btn btn-primary" }]
            });
            return;
        }
        closeJoin();
        loadShoppingLists();
    });
});

async function loadShoppingLists() {
    const ul = document.getElementById("shopping-list");
    ul.innerHTML = "";
    const { data, error } = await supabase
        .from("shopping_participants")
        .select("shopping_lists(id, title, code)")
        .eq("user_id", user.id);

    if (error) {
        ul.innerHTML = `<li class="muted">Errore caricamento.</li>`;
        return;
    }
    if (!data || !data.length) {
        ul.innerHTML = `<li class="muted">Nessuna spesa ancora creata o unita</li>`;
        return;
    }

    const tpl = document.getElementById("tpl-list-item");
    data.forEach((row) => {
        const list = row.shopping_lists;
        const li = tpl.content.cloneNode(true);
        const tWrap = li.querySelector(".title");
        tWrap.dataset.full = list.title;                              // testo completo per tooltip
        tWrap.querySelector(".clip").textContent = list.title;        // testo visibile troncato
        li.querySelector(".open").addEventListener(
        "click",
        () => (window.location.href = `shopping.html?id=${list.id}`),
        );
        li.querySelector(".code").addEventListener("click", () => {
        navigator.clipboard.writeText(list.code);
        showModal({
            title: "Codice copiato",
            message: `Il codice della spesa <b>${list.code}</b> è stato copiato negli appunti.`,
            buttons: [{ label: "OK", class: "btn btn-primary" }]
        });
        });
        li.querySelector(".hide").addEventListener("click", async () => {
        await supabase
            .from("shopping_participants")
            .delete()
            .eq("shopping_id", list.id)
            .eq("user_id", user.id);
        loadShoppingLists();
        });
        ul.appendChild(li);
    });
    lucide.createIcons();
}