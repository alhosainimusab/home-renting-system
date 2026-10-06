const test = require("node:test");
const assert = require("node:assert/strict");
const { createStore, memoryStorage, hashPassword, SESSION_KEY, DB_KEY } = require("../js/store.js");

const fresh = () => createStore(memoryStorage());

test("seed data follows the ERD tables", () => {
  const s = fresh();
  assert.equal(s.listLandlords().length, 3);
  assert.equal(s.searchProperties().length, 6);
  assert.equal(s.roleOf(s.getUser(4)), "renter");
});

test("login checks the password and never exposes the hash", () => {
  const s = fresh();
  assert.equal(s.login("demo_renter", "wrong"), null);
  const u = s.login("DEMO_RENTER", "Demo@1234");
  assert.equal(u.username, "demo_renter");
  assert.equal(u.passwordHash, undefined);
  assert.equal(s.currentUser().id, u.id);
  s.logout();
  assert.equal(s.currentUser(), null);
});

test("passwords are stored hashed, not in plain text", () => {
  const storage = memoryStorage();
  const s = createStore(storage);
  s.register({ username: "hana", userType: "renter", fname: "Hana", lname: "Ali", email: "h@example.com", phone: "+60 1", password: "Secret#99" });
  const raw = storage.getItem(DB_KEY);
  assert.ok(!raw.includes("Secret#99"));
  assert.ok(raw.includes(hashPassword("Secret#99")));
});

test("register rejects duplicate usernames (case-insensitive)", () => {
  const s = fresh();
  assert.throws(() => s.register({ username: "Demo_Landlord", userType: "renter", fname: "A", lname: "B", email: "a@example.com", phone: "1", password: "x" }), /taken/);
});

test("data persists across store instances (simulated page reload)", () => {
  const storage = memoryStorage();
  const a = createStore(storage);
  a.addProperty(1, { name: "New flat", address: "9 Jalan Baru", city: "Muar", price: "750" });
  const b = createStore(storage);
  assert.equal(b.searchProperties("muar").length, 1);
});

test("search matches name, address, city and description, case-insensitive", () => {
  const s = fresh();
  assert.equal(s.searchProperties("PARIT RAJA").length, 2);
  assert.equal(s.searchProperties("bungalow").length, 1);
  assert.equal(s.searchProperties("jalan rahmat").length, 1);
  assert.equal(s.searchProperties("zzz").length, 0);
  assert.equal(s.listLandlords("priya").length, 1);
});

test("only renters can rent, and renting twice does not duplicate", () => {
  const s = fresh();
  assert.throws(() => s.rent(1, 3), /Only renters/);
  const r1 = s.rent(4, 3);
  const r2 = s.rent(4, 3);
  assert.equal(r1.id, r2.id);
  assert.equal(r1.status, "unpaid");
  assert.equal(s.rentalsForProperty(3).length, 2);
});

test("landlords can only manage their own properties and rentals", () => {
  const s = fresh();
  assert.throws(() => s.addProperty(4, { name: "x", address: "y", city: "z", price: 1 }), /Only landlords/);
  assert.throws(() => s.setRentalStatus(2, 1, "unpaid"), /Not your rental/);
  assert.throws(() => s.removeProperty(2, 1), /Not your property/);
  s.setRentalStatus(1, 2, "paid");
  assert.ok(s.rentalsForProperty(1).every((r) => r.status === "paid"));
});

test("removing a property also removes its rentals", () => {
  const s = fresh();
  s.removeProperty(1, 1);
  assert.equal(s.getProperty(1), null);
  assert.equal(s.rentalsForProperty(1).length, 0);
});

test("remind sends a chat message to each unpaid tenant only", () => {
  const s = fresh();
  assert.equal(s.remindUnpaid(1, 1), 1); // Mei is unpaid, Omar has paid
  const convo = s.conversation(1, 5);
  assert.match(convo[convo.length - 1].message, /Reminder/);
  assert.equal(s.conversation(1, 4).some((m) => /Reminder/.test(m.message)), false);
});

test("messages: validation, ordering and contact list", () => {
  const s = fresh();
  assert.throws(() => s.sendMessage(4, 4, "hi"), /yourself/);
  assert.throws(() => s.sendMessage(4, 1, "   "), /Empty/);
  assert.throws(() => s.sendMessage(4, 99, "hi"), /not found/);
  s.sendMessage(4, 3, "Is the studio free in June?");
  const contacts = s.contactsOf(4).map((u) => u.id);
  assert.deepEqual(contacts, [3, 1]);
  assert.equal(s.conversation(4, 1).length, 2);
});

test("profile update keeps the old password when none is given", () => {
  const s = fresh();
  s.updateProfile(4, { username: "omar_h", fname: "Omar", lname: "Haddad", email: "o@example.com", phone: "+60 1" });
  assert.ok(s.login("omar_h", "Demo@1234"));
  s.updateProfile(4, { username: "omar_h", fname: "Omar", lname: "Haddad", email: "o@example.com", phone: "+60 1", password: "New#pass1" });
  assert.equal(s.login("omar_h", "Demo@1234"), null);
  assert.ok(s.login("omar_h", "New#pass1"));
});

test("corrupted storage falls back to seed data", () => {
  const storage = memoryStorage();
  storage.setItem(DB_KEY, "{not json");
  const s = createStore(storage);
  assert.equal(s.searchProperties().length, 6);
  assert.equal(storage.getItem(SESSION_KEY), null);
});
