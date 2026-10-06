// Public landing page (report Fig. 4.3.4.1). Rent, Landlords and the search bar
// ask the visitor to log in first, as described in Section 4.3.3.
(function () {
  "use strict";
  if (UI.store.currentUser()) { location.replace("home.html"); return; }
  UI.init({
    page: "index", auth: "public",
    search: {
      label: "Search properties", placeholder: "Search by city, address or keyword",
      onSubmit: () => UI.openLogin("Log in or sign up to search listings."),
    },
  });
  document.getElementById("hero-login").addEventListener("click", () => UI.openLogin());
})();
