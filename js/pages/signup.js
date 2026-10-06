// Sign-up and edit-profile form (Processes 2.0 and 8.0).
// signup.html            -> create account
// signup.html?mode=edit  -> edit the logged-in user's profile
(function () {
  "use strict";
  const { store, $, toast, avatar } = UI;
  const editing = new URLSearchParams(location.search).get("mode") === "edit";
  const me = store.currentUser();
  if (editing && !me) { location.replace("index.html"); return; }
  if (!editing && me) { location.replace("home.html"); return; }

  UI.init({ page: editing ? "profile" : "signup", auth: editing ? "user" : "public" });

  const form = $("#user-form");
  let imageData = editing ? me.image : "";

  if (editing) {
    document.title = "Edit profile | HomeRent";
    $("#form-title").textContent = "Edit profile";
    $("#submit-btn").textContent = "Save changes";
    $("#cancel-link").href = "profile.html";
    $("#pw-note").textContent = "(leave blank to keep your current password)";
    $("#usertype-field").hidden = true;
    ["username", "fname", "lname", "email", "phone"].forEach((k) => (form.elements[k].value = me[k]));
  }

  function drawPreview() {
    const el = $("#avatar-preview");
    const u = { id: me ? me.id : 0, fname: form.elements.fname.value || "?", lname: form.elements.lname.value || "", image: imageData };
    el.outerHTML = avatar(u, "lg").replace('class="avatar', 'id="avatar-preview" class="avatar');
  }
  drawPreview();
  form.elements.fname.addEventListener("input", drawPreview);
  form.elements.lname.addEventListener("input", drawPreview);

  form.elements.image.addEventListener("change", () => {
    const file = form.elements.image.files[0];
    const err = form.querySelector('[data-for="image"]');
    err.textContent = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { err.textContent = "Use a PNG, JPEG or WebP image."; return; }
    if (file.size > 200 * 1024) { err.textContent = "Image is larger than 200 KB."; form.elements.image.value = ""; return; }
    const r = new FileReader();
    r.onload = () => { imageData = r.result; drawPreview(); };
    r.readAsDataURL(file);
  });

  form.addEventListener("input", (e) => {
    const name = e.target.name;
    if (!name || name === "image") return;
    const err = form.querySelector(`[data-for="${name}"]`);
    if (err) err.textContent = "";
    if (e.target.getAttribute) e.target.setAttribute("aria-invalid", "false");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    delete values.image;
    const errors = HRSValidation.validateUserForm(values, {
      mode: editing ? "edit" : "signup",
      isUsernameTaken: (u) => store.isUsernameTaken(u, editing ? me.id : undefined),
    });
    form.querySelectorAll(".field-error").forEach((p) => {
      if (p.dataset.for !== "image") p.textContent = errors[p.dataset.for] || "";
    });
    form.querySelectorAll("input").forEach((i) => i.setAttribute("aria-invalid", errors[i.name] ? "true" : "false"));
    const first = Object.keys(errors)[0];
    if (first) { (form.elements[first].focus ? form.elements[first] : form.elements[first][0]).focus(); return; }

    if (editing) {
      store.updateProfile(me.id, { ...values, image: imageData });
      toast("Profile saved.");
      setTimeout(() => (location.href = "profile.html"), 600);
    } else {
      store.register({ ...values, image: imageData });
      store.login(values.username, values.password);
      location.href = "home.html";
    }
  });
})();
