// Rent list, landlords only (Figs. 4.3.4.14, 4.3.4.15) plus Process 7.0 add/remove property.
(function () {
  "use strict";
  const { store, esc, money, $, openModal, closeModal, toast, avatar, fullName } = UI;
  const me = UI.init({ page: "rent-list", auth: "landlord" });
  if (!me) return;
  const grid = $("#my-grid");

  function draw() {
    const props = store.propertiesOf(me.id);
    grid.innerHTML = props.length ? props.map((p) => {
      const rs = store.rentalsForProperty(p.id);
      const unpaid = rs.filter((r) => r.status === "unpaid").length;
      return `<li><button type="button" class="tile" data-id="${p.id}">
        <img src="${esc(p.image)}" alt="">
        <span class="tile-body"><b>${esc(p.name)}</b><small>${rs.length} tenant${rs.length === 1 ? "" : "s"}${unpaid ? `, <span class="text-warn">${unpaid} unpaid</span>` : ""}</small>
        <span class="price">${money(p.price)}<small>/month</small></span></span></button></li>`;
    }).join("") : `<li class="empty">You have no listings. Use <b>Add property</b> to create one.</li>`;
    grid.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => detail(Number(b.dataset.id))));
  }

  function detail(id) {
    const p = store.getProperty(id);
    const rs = store.rentalsForProperty(id);
    const body = openModal(`
      <div class="detail">
        <img src="${esc(p.image)}" alt="">
        <div>
          <h2>${esc(p.name)}</h2>
          <p class="muted">${esc(p.address)}, ${esc(p.city)}, ${money(p.price)}/month</p>
          <h3>Tenants</h3>
          ${rs.length ? `<ul class="rows">${rs.map((r) => `
            <li>${avatar(r.renter, "sm")}<span class="grow"><b>${esc(fullName(r.renter))}</b><small>since ${esc(r.date)}</small></span>
              <span class="badge badge-${r.status}">${r.status === "paid" ? "Paid" : "Unpaid"}</span>
              <button type="button" class="btn btn-small btn-ghost" data-rental="${r.id}" data-status="${r.status}">
                ${r.status === "paid" ? "Mark unpaid" : "Mark paid"}</button></li>`).join("")}</ul>`
          : `<p class="muted">Nobody has rented this property yet.</p>`}
          <div class="actions">
            <button type="button" class="btn btn-primary" id="remind" ${rs.some((r) => r.status === "unpaid") ? "" : "disabled"}>Remind unpaid tenants</button>
            <button type="button" class="btn btn-danger" id="remove">Remove listing</button>
          </div>
        </div>
      </div>`, { label: p.name, wide: true });

    body.querySelectorAll("[data-rental]").forEach((b) => b.addEventListener("click", () => {
      store.setRentalStatus(me.id, Number(b.dataset.rental), b.dataset.status === "paid" ? "unpaid" : "paid");
      draw(); detail(id);
    }));
    $("#remind", body).addEventListener("click", () => {
      const n = store.remindUnpaid(me.id, id);
      UI.renderSidebar(me);
      toast(`Reminder sent to ${n} tenant${n === 1 ? "" : "s"} by chat.`);
    });
    $("#remove", body).addEventListener("click", () => {
      if (!confirm(`Remove "${p.name}"? Its rental records are removed too.`)) return;
      store.removeProperty(me.id, id); closeModal(); draw(); toast("Listing removed.");
    });
  }

  $("#add-property").addEventListener("click", () => {
    const body = openModal(`
      <h2>Add property</h2>
      <form id="prop-form" novalidate>
        <label for="p-name">Listing name</label><input id="p-name" name="name" required><p class="field-error" data-for="name"></p>
        <label for="p-address">Street address</label><input id="p-address" name="address" required><p class="field-error" data-for="address"></p>
        <div class="row">
          <div><label for="p-city">City</label><input id="p-city" name="city" required><p class="field-error" data-for="city"></p></div>
          <div><label for="p-price">Monthly rent (RM)</label><input id="p-price" name="price" type="number" min="1" step="1" required><p class="field-error" data-for="price"></p></div>
        </div>
        <label for="p-desc">Description</label><textarea id="p-desc" name="description" rows="3" maxlength="500"></textarea>
        <p class="field-error" data-for="description"></p>
        <div class="actions"><button class="btn btn-primary" type="submit">Add property</button></div>
      </form>`, { label: "Add property" });
    $("#prop-form", body).addEventListener("input", (e) => {
      const err = body.querySelector(`[data-for="${e.target.name}"]`);
      if (err) err.textContent = "";
    });
    $("#prop-form", body).addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      const errs = HRSValidation.validatePropertyForm(f);
      body.querySelectorAll(".field-error").forEach((p) => (p.textContent = errs[p.dataset.for] || ""));
      if (Object.keys(errs).length) return;
      store.addProperty(me.id, f); closeModal(); draw(); toast("Property added.");
    });
  });

  draw();
})();
