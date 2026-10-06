// Main page after login (Fig. 4.3.4.4): a role-specific summary.
(function () {
  "use strict";
  const { store, esc, money, $ } = UI;
  const me = UI.init({ page: "home" });
  if (!me) return;
  const role = store.roleOf(me);
  $("#greeting").textContent = `Welcome, ${me.fname}`;

  if (role === "landlord") {
    const props = store.propertiesOf(me.id);
    const rentals = props.flatMap((p) => store.rentalsForProperty(p.id));
    const unpaid = rentals.filter((r) => r.status === "unpaid").length;
    $("#intro").textContent = "Here's how your properties are doing.";
    $("#summary").innerHTML = `
      <div class="stat"><b>${props.length}</b><span>${props.length === 1 ? "property" : "properties"} listed</span></div>
      <div class="stat"><b>${rentals.length}</b><span>${rentals.length === 1 ? "tenant" : "tenants"}</span></div>
      <div class="stat ${unpaid ? "stat-warn" : ""}"><b>${unpaid}</b><span>unpaid this month</span></div>`;
    $("#activity").innerHTML = `<p><a class="btn btn-primary" href="rent-list.html">Open rent list</a></p>`;
  } else {
    const mine = store.rentalsOfRenter(me.id);
    const due = mine.filter((r) => r.status === "unpaid").length;
    $("#intro").textContent = "Find a place, message the landlord, and keep track of your rentals.";
    $("#summary").innerHTML = `
      <div class="stat"><b>${mine.length}</b><span>${mine.length === 1 ? "rental" : "rentals"}</span></div>
      <div class="stat ${due ? "stat-warn" : ""}"><b>${due}</b><span>${due === 1 ? "payment due" : "payments due"}</span></div>`;
    $("#activity").innerHTML = mine.length
      ? `<h2>My rentals</h2><ul class="rows">${mine.map((r) => `
          <li><span class="dot dot-${r.status}" aria-hidden="true"></span>
            <span class="grow"><b>${esc(r.property ? r.property.name : "Removed listing")}</b>
            <small>${r.property ? esc(r.property.city) + ", " + money(r.property.price) + "/month" : ""}</small></span>
            <span class="badge badge-${r.status}">${r.status === "paid" ? "Paid" : "Payment due"}</span></li>`).join("")}</ul>`
      : `<p>You haven't rented anything yet. <a href="rent.html">Browse places to rent</a>.</p>`;
  }
})();
