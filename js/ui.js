/**
 * Shared layout and UI helpers used by every page:
 * header + navigation, chat sidebar, chat panel, modal dialogs, toasts.
 * Replaces the header/sidebar/chat markup and navigation functions that were
 * copy-pasted into six separate HTML files in the original prototype.
 */
(function () {
  "use strict";

  let storage;
  try { storage = window.localStorage; storage.getItem("x"); }
  catch (_) { storage = HRSStore.memoryStorage(); }
  const store = HRSStore.createStore(storage);

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, el = document) => el.querySelector(sel);
  const fullName = (u) => (u ? `${u.fname} ${u.lname}` : "");
  const money = (n) => "RM " + Number(n).toLocaleString("en-MY");

  function avatar(u, size = "md") {
    if (!u) return "";
    if (u.image) return `<img class="avatar avatar-${size}" src="${esc(u.image)}" alt="">`;
    const initials = (u.fname[0] || "") + (u.lname[0] || "");
    const hue = (u.id * 67) % 360;
    return `<span class="avatar avatar-${size}" style="--hue:${hue}" aria-hidden="true">${esc(initials.toUpperCase())}</span>`;
  }

  // ---- Toast --------------------------------------------------------------
  function toast(msg) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast"; t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---- Modal --------------------------------------------------------------
  let lastFocus = null;
  function openModal(html, { label = "Dialog", wide = false } = {}) {
    closeModal();
    lastFocus = document.activeElement;
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.id = "modal";
    wrap.innerHTML = `<div class="modal${wide ? " modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(label)}">
        <button type="button" class="icon-btn modal-close" aria-label="Close">&times;</button>
        <div class="modal-body">${html}</div></div>`;
    wrap.addEventListener("click", (e) => { if (e.target === wrap) closeModal(); });
    $(".modal-close", wrap).addEventListener("click", closeModal);
    document.body.appendChild(wrap);
    document.body.classList.add("no-scroll");
    const f = $("input, button:not(.modal-close), select, textarea", wrap);
    (f || $(".modal-close", wrap)).focus();
    return $(".modal-body", wrap);
  }
  function closeModal() {
    const m = $("#modal");
    if (!m) return;
    m.remove();
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if ($("#modal")) closeModal(); else closeChat(); }
  });

  // ---- Login dialog (Fig. 4.3.3.1) -----------------------------------------
  function openLogin(reason) {
    const body = openModal(`
      <h2>Log in</h2>
      ${reason ? `<p class="muted">${esc(reason)}</p>` : ""}
      <form id="login-form" novalidate>
        <label for="li-username">Username</label>
        <input id="li-username" name="username" autocomplete="username" required>
        <label for="li-password">Password</label>
        <input id="li-password" name="password" type="password" autocomplete="current-password" required>
        <p class="form-error" id="li-error" role="alert"></p>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
      </form>
      <p class="small"><a href="signup.html">Create an account</a> &nbsp;|&nbsp;
        <a href="#" id="li-forgot">Forgot password?</a></p>
      <p class="hint">Demo accounts: <code>demo_renter</code> or <code>demo_landlord</code>, password <code>Demo@1234</code></p>
    `, { label: "Log in" });
    $("#login-form", body).addEventListener("input", () => { $("#li-error", body).textContent = ""; });
    $("#login-form", body).addEventListener("submit", (e) => {
      e.preventDefault();
      const u = store.login($("#li-username", body).value, $("#li-password", body).value);
      if (!u) { $("#li-error", body).textContent = "Username or password is incorrect."; return; }
      location.href = "home.html";
    });
    $("#li-forgot", body).addEventListener("click", (e) => {
      e.preventDefault();
      $("#li-error", body).textContent = "Password reset needs the email service, which is outside this prototype's scope.";
    });
  }

  // ---- Header -------------------------------------------------------------
  function renderHeader(page, user, { search } = {}) {
    const role = user ? store.roleOf(user) : null;
    const links = user
      ? [["home", "home.html", "Home"], ["rent", "rent.html", "Rent"], ["landlords", "landlords.html", "Landlords"],
         ...(role === "landlord" ? [["rent-list", "rent-list.html", "Rent list"]] : []),
         ["profile", "profile.html", "Profile"]]
      : [["index", "index.html", "Home"], ["rent", "#login", "Rent"], ["landlords", "#login", "Landlords"]];

    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <a class="brand" href="${user ? "home.html" : "index.html"}">
        <img src="assets/img/logo.svg" alt="" width="36" height="36"><span>HomeRent</span></a>
      <nav aria-label="Main"><ul>
        ${links.map(([k, href, label]) => `<li><a href="${href}" ${k === page ? 'aria-current="page"' : ""} data-k="${k}">${label}</a></li>`).join("")}
      </ul></nav>
      ${search ? `<form class="search" role="search">
          <label class="sr-only" for="q">${esc(search.label)}</label>
          <input id="q" type="search" placeholder="${esc(search.placeholder)}" autocomplete="off">
        </form>` : ""}
      <div class="header-end">
        ${user
          ? `<span class="who">${avatar(user, "sm")}<span>${esc(user.username)}<small>${esc(role)}</small></span></span>
             <button type="button" class="btn btn-ghost" id="logout">Log out</button>`
          : `<button type="button" class="btn btn-primary" id="signin">Log in</button>`}
      </div>`;
    document.body.prepend(header);

    header.querySelectorAll('a[href="#login"]').forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); openLogin("Log in or sign up to browse rentals and landlords."); }));
    const si = $("#signin", header); if (si) si.addEventListener("click", () => openLogin());
    const lo = $("#logout", header); if (lo) lo.addEventListener("click", () => { store.logout(); location.href = "index.html"; });

    if (search) {
      const form = $(".search", header), input = $("#q", header);
      form.addEventListener("submit", (e) => { e.preventDefault(); search.onSubmit && search.onSubmit(input.value); });
      if (search.onInput) input.addEventListener("input", () => search.onInput(input.value));
    }
  }

  // ---- Chat (Process 6.0, Fig. 4.3.2.5) ------------------------------------
  let chatWith = null;
  function renderSidebar(user) {
    const side = $("#sidebar");
    if (!side) return;
    const contacts = store.contactsOf(user.id);
    side.innerHTML = `<h2 class="side-title">Chats</h2>
      ${contacts.length
        ? `<ul class="contacts">${contacts.map((c) => `
            <li><button type="button" data-chat="${c.id}" ${chatWith === c.id ? 'aria-current="true"' : ""}>
              ${avatar(c, "sm")}<span>${esc(fullName(c))}<small>@${esc(c.username)}</small></span></button></li>`).join("")}</ul>`
        : `<p class="muted small">No conversations yet. Use <b>Contact now</b> on a property or landlord to start one.</p>`}`;
    side.querySelectorAll("[data-chat]").forEach((b) => b.addEventListener("click", () => openChat(Number(b.dataset.chat))));
  }

  function openChat(otherId) {
    const me = store.currentUser();
    const other = store.getUser(otherId);
    if (!me || !other || me.id === other.id) return;
    chatWith = other.id;
    let panel = $("#chat-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "chat-panel";
      panel.setAttribute("aria-label", "Chat");
      document.body.appendChild(panel);
    }
    panel.innerHTML = `
      <header>${avatar(other, "sm")}<div><b>${esc(fullName(other))}</b><small>@${esc(other.username)} (${esc(store.roleOf(other))})</small></div>
        <button type="button" class="icon-btn" id="chat-close" aria-label="Close chat">&times;</button></header>
      <ol class="messages" id="chat-log"></ol>
      <form id="chat-form"><label class="sr-only" for="chat-input">Message</label>
        <input id="chat-input" placeholder="Type a message and press Enter" maxlength="1000" autocomplete="off">
        <button class="btn btn-primary" type="submit">Send</button></form>`;
    panel.classList.add("open");
    const log = $("#chat-log", panel);
    const draw = () => {
      const msgs = store.conversation(me.id, other.id);
      log.innerHTML = msgs.length
        ? msgs.map((m) => `<li class="${m.fromUserId === me.id ? "mine" : "theirs"}"><p>${esc(m.message)}</p>
            <time datetime="${m.datetime}">${new Date(m.datetime).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}</time></li>`).join("")
        : `<li class="empty">Say hello to ${esc(other.fname)}.</li>`;
      log.scrollTop = log.scrollHeight;
    };
    draw();
    $("#chat-close", panel).addEventListener("click", closeChat);
    $("#chat-form", panel).addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#chat-input", panel);
      try { store.sendMessage(me.id, other.id, input.value); input.value = ""; draw(); renderSidebar(me); }
      catch (err) { toast(err.message); }
    });
    $("#chat-input", panel).focus();
    renderSidebar(me);
  }
  function closeChat() {
    const p = $("#chat-panel");
    if (p) p.classList.remove("open");
    chatWith = null;
    const me = store.currentUser();
    if (me) renderSidebar(me);
  }

  /**
   * Boot a page. `auth`: "public" | "user" | "landlord".
   * Returns the logged-in user (or null on public pages).
   */
  function init({ page, auth = "user", search } = {}) {
    const user = store.currentUser();
    if (auth !== "public" && !user) { location.replace("index.html"); return null; }
    if (auth === "landlord" && store.roleOf(user) !== "landlord") { location.replace("home.html"); return null; }
    renderHeader(page, user, { search });
    if (user) renderSidebar(user);
    return user;
  }

  window.UI = { store, init, esc, $, avatar, fullName, money, toast, openModal, closeModal, openLogin, openChat, renderSidebar };
})();
