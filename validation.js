/**
 * Form validation rules for sign-up / edit-profile and property forms.
 * Pure functions: no DOM access, so they can be unit-tested with `node --test`.
 *
 * The password rule comes from the report's non-functional requirement
 * (Section 3.4): passwords must mix letters, numbers and symbols.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HRSValidation = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;
  const NAME_RE = /^[\p{L}][\p{L}' .-]{0,39}$/u;

  const listJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

  function passwordProblems(pw) {
    const problems = [];
    if (!pw || pw.length < 8) problems.push("at least 8 characters");
    if (!/[A-Za-z]/.test(pw || "")) problems.push("a letter");
    if (!/[0-9]/.test(pw || "")) problems.push("a number");
    if (!/[^A-Za-z0-9]/.test(pw || "")) problems.push("a symbol");
    return problems;
  }

  /**
   * Validate the sign-up / edit-profile form.
   * @param {object} f form values
   * @param {object} opts { mode: "signup" | "edit", isUsernameTaken: fn }
   * @returns {object} map of field -> error message (empty when valid)
   */
  function validateUserForm(f, opts = {}) {
    const mode = opts.mode || "signup";
    const isTaken = opts.isUsernameTaken || (() => false);
    const e = {};
    const v = (k) => (f[k] == null ? "" : String(f[k]).trim());

    if (!USERNAME_RE.test(v("username")))
      e.username = "Use 3–20 letters, numbers or underscores.";
    else if (isTaken(v("username")))
      e.username = "This username is already taken.";

    if (mode === "signup" && !["renter", "landlord"].includes(v("userType")))
      e.userType = "Choose Renter or Landlord.";

    if (!NAME_RE.test(v("fname"))) e.fname = "Enter your first name.";
    if (!NAME_RE.test(v("lname"))) e.lname = "Enter your last name.";

    const pw = f.password || "";
    const pwRequired = mode === "signup" || pw.length > 0;
    if (pwRequired) {
      const p = passwordProblems(pw);
      if (p.length) e.password = "Password needs " + listJoin(p) + ".";
      if (pw !== (f.cpassword || "")) e.cpassword = "Passwords do not match.";
    }

    if (!EMAIL_RE.test(v("email"))) e.email = "Enter a valid email address.";
    if (!PHONE_RE.test(v("phone")))
      e.phone = "Enter a phone number with 7–15 digits, e.g. +60 12-345 6789.";

    return e;
  }

  function validatePropertyForm(f) {
    const e = {};
    const v = (k) => (f[k] == null ? "" : String(f[k]).trim());
    if (v("name").length < 3) e.name = "Give the property a name (3+ characters).";
    if (v("address").length < 5) e.address = "Enter the street address.";
    if (v("city").length < 2) e.city = "Enter the city.";
    const price = Number(f.price);
    if (!Number.isFinite(price) || price <= 0 || price > 1000000)
      e.price = "Enter a monthly rent greater than 0.";
    if (v("description").length > 500) e.description = "Keep the description under 500 characters.";
    return e;
  }

  return { validateUserForm, validatePropertyForm, passwordProblems };
});
