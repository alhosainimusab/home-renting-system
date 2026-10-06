// Landlord page (Process 4.0 search landlord, Figs. 4.3.4.9 to 4.3.4.11).
(function () {
  "use strict";
  const { store, esc, money, $, openModal, closeModal, avatar, fullName } = UI;
  const me = UI.init({
    page: "landlords",
    search: { label: "Search landlords", placeholder: "Search landlords by name or username", onInput: draw, onSubmit: draw },
  });
  if (!me) return;
  const grid = $("#landlord-grid");

  function draw(q = "") {
    const list = store.listLandlords(q);
    $("#result-count").textContent = q ? `${list.length} result${list.length === 1 ? "" : "s"} for "${q}"` : `${list.length} landlords`;
    grid.innerHTML = list.length ? list.map((u) => `
      <li><button type="button" class="tile tile-person" data-id="${u.id}">
        ${avatar(u, "lg")}<span class="tile-body"><b>${esc(fullName(u))}</b><small>@${esc(u.username)}</small>
        <small>${store.propertiesOf(u.id).length} listings</small></span></button></li>`).join("")
      : `<li class="empty">No landlords match "${esc(q)}".</li>`;
    grid.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => detail(Number(b.dataset.id))));
  }

  function detail(id) {
    const u = store.getUser(id);
    const props = store.propertiesOf(id);
    const body = openModal(`
      <div class="detail detail-person">
        ${avatar(u, "xl")}
        <div>
          <h2>${esc(fullName(u))}</h2>
          <p class="muted">@${esc(u.username)}, landlord</p>
          <h3>Listings</h3>
          <ul class="rows">${props.map((p) => `<li><span class="grow"><b>${esc(p.name)}</b><small>${esc(p.city)}</small></span><span>${money(p.price)}</span></li>`).join("") || "<li>No listings yet.</li>"}</ul>
          <div class="actions">${u.id !== me.id ? `<button type="button" class="btn btn-primary" id="do-contact">Contact now</button>` : ""}</div>
        </div>
      </div>`, { label: fullName(u), wide: true });
    const c = $("#do-contact", body);
    if (c) c.addEventListener("click", () => { closeModal(); UI.openChat(u.id); });
  }

  draw();
})();
