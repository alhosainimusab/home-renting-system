// Rent page (Process 3.0 search + 5.0 rent, Figs. 4.3.4.5 to 4.3.4.8).
(function () {
  "use strict";
  const { store, esc, money, $, openModal, closeModal, toast, fullName } = UI;
  const me = UI.init({
    page: "rent",
    search: { label: "Search properties", placeholder: "Search by city, address or keyword", onInput: draw, onSubmit: draw },
  });
  if (!me) return;
  const isRenter = store.roleOf(me) === "renter";
  const grid = $("#property-grid");

  function draw(q = "") {
    const list = store.searchProperties(q);
    $("#result-count").textContent = q ? `${list.length} result${list.length === 1 ? "" : "s"} for "${q}"` : `${list.length} listings`;
    grid.innerHTML = list.length ? list.map((p) => `
      <li><button type="button" class="tile" data-id="${p.id}">
        <img src="${esc(p.image)}" alt="">
        <span class="tile-body"><b>${esc(p.name)}</b><small>${esc(p.city)}</small>
        <span class="price">${money(p.price)}<small>/month</small></span></span>
      </button></li>`).join("")
      : `<li class="empty">No listings match "${esc(q)}". Try a city such as Batu Pahat or Parit Raja.</li>`;
    grid.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => detail(Number(b.dataset.id))));
  }

  function detail(id) {
    const p = store.getProperty(id);
    const owner = store.getUser(p.userId);
    const already = isRenter && store.rentalsOfRenter(me.id).some((r) => r.propertyId === id);
    const body = openModal(`
      <div class="detail">
        <img src="${esc(p.image)}" alt="">
        <div>
          <h2>${esc(p.name)}</h2>
          <p class="muted">${esc(p.address)}, ${esc(p.city)}</p>
          <p class="price big">${money(p.price)}<small>/month</small></p>
          <p>${esc(p.description)}</p>
          <p class="small">Listed by <b>${esc(fullName(owner))}</b> (@${esc(owner.username)})</p>
          <div class="actions">
            ${isRenter ? `<button type="button" class="btn btn-primary" id="do-rent" ${already ? "disabled" : ""}>${already ? "Rented" : "Rent"}</button>` : ""}
            ${owner.id !== me.id ? `<button type="button" class="btn btn-ghost" id="do-contact">Contact now</button>` : `<span class="muted small">This is your listing.</span>`}
          </div>
        </div>
      </div>`, { label: p.name, wide: true });
    const rentBtn = $("#do-rent", body);
    if (rentBtn && !already) rentBtn.addEventListener("click", () => {
      if (!confirm(`Rent "${p.name}" for ${money(p.price)}/month?`)) return;
      store.rent(me.id, id);
      rentBtn.textContent = "Rented"; rentBtn.disabled = true;
      toast(`Rented. ${owner.fname} will see you in their rent list.`);
    });
    const c = $("#do-contact", body);
    if (c) c.addEventListener("click", () => { closeModal(); UI.openChat(owner.id); });
  }

  draw();
})();
