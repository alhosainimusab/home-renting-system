const test = require("node:test");
const assert = require("node:assert/strict");
const { validateUserForm, validatePropertyForm, passwordProblems } = require("../js/validation.js");

const good = {
  username: "new_user", userType: "renter", fname: "Siti", lname: "Aminah",
  password: "Rent@2024", cpassword: "Rent@2024", email: "siti@example.com", phone: "+60 12-345 6789",
};

test("accepts a complete, valid sign-up", () => {
  assert.deepEqual(validateUserForm(good), {});
});

test("password must mix letters, numbers and symbols (report NFR)", () => {
  assert.deepEqual(passwordProblems("Rent@2024"), []);
  assert.ok(passwordProblems("password").includes("a number"));
  assert.ok(passwordProblems("password1").includes("a symbol"));
  assert.ok(passwordProblems("12345678!").includes("a letter"));
  assert.ok(passwordProblems("Ab1!").includes("at least 8 characters"));
});

test("password message reads naturally", () => {
  const e = validateUserForm({ ...good, password: "weakpass", cpassword: "weakpass" });
  assert.equal(e.password, "Password needs a number and a symbol.");
});

test("confirm password must match", () => {
  const e = validateUserForm({ ...good, cpassword: "Rent@2025" });
  assert.equal(Object.keys(e).join(), "cpassword");
});

test("rejects bad username, email, phone and missing user type", () => {
  const e = validateUserForm({ ...good, username: "a b", email: "x@y", phone: "12", userType: "" });
  assert.deepEqual(Object.keys(e).sort(), ["email", "phone", "userType", "username"]);
});

test("reports a taken username", () => {
  const e = validateUserForm(good, { isUsernameTaken: () => true });
  assert.match(e.username, /taken/);
});

test("edit mode: password optional, user type not required", () => {
  const { password, cpassword, userType, ...rest } = good;
  assert.deepEqual(validateUserForm({ ...rest, password: "", cpassword: "" }, { mode: "edit" }), {});
  assert.ok(validateUserForm({ ...rest, password: "weak", cpassword: "weak" }, { mode: "edit" }).password);
});

test("names allow accents and apostrophes", () => {
  assert.deepEqual(validateUserForm({ ...good, fname: "Zoë", lname: "O'Neil" }), {});
});

test("property form", () => {
  assert.deepEqual(validatePropertyForm({ name: "Room A", address: "1 Jalan Satu", city: "Batu Pahat", price: "350" }), {});
  const e = validatePropertyForm({ name: "", address: "", city: "", price: "-5" });
  assert.deepEqual(Object.keys(e).sort(), ["address", "city", "name", "price"]);
  assert.ok(validatePropertyForm({ name: "Room A", address: "1 Jalan Satu", city: "BP", price: "abc" }).price);
});

test("property price boundaries: 0 rejected, 1 accepted", () => {
  const base = { name: "Room A", address: "1 Jalan Satu", city: "Batu Pahat" };
  assert.ok(validatePropertyForm({ ...base, price: "0" }).price);
  assert.equal(validatePropertyForm({ ...base, price: "1" }).price, undefined);
  assert.ok(validatePropertyForm({ ...base, price: "1000001" }).price);
});
