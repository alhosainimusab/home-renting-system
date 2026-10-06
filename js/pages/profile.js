// User profile page (Fig. 4.3.4.12).
(function () {
  "use strict";
  const { store, esc, $, avatar, fullName } = UI;
  const me = UI.init({ page: "profile" });
  if (!me) return;
  $("#profile-card").innerHTML = `
    ${avatar(me, "xl")}
    <div>
      <h2>${esc(fullName(me))}</h2>
      <dl>
        <dt>Username</dt><dd>@${esc(me.username)}</dd>
        <dt>Account type</dt><dd>${esc(store.roleOf(me))}</dd>
        <dt>Email</dt><dd>${esc(me.email)}</dd>
        <dt>Phone</dt><dd>${esc(me.phone)}</dd>
      </dl>
      <a class="btn btn-primary" href="signup.html?mode=edit">Edit profile</a>
    </div>`;
  $("#reset-data").addEventListener("click", () => {
    if (!confirm("Reset all demo data? Accounts and chats you created will be deleted.")) return;
    store.reset(); location.href = "index.html";
  });
})();
