/**
 * Client-side data layer for the prototype.
 *
 * Tables mirror the ERD in the report (USER_TYPE, USER, PROPERTY, RENTAL,
 * MESSAGE) and are persisted in localStorage, so the prototype behaves like a
 * real app without a server. Two deliberate changes from the original ERD:
 *   - USER gets a passwordHash column (the ERD had no password attribute).
 *   - PROPERTY no longer holds rental_ID: one property can have many rentals,
 *     so the foreign key belongs on RENTAL only.
 *
 * NOTE: hashPassword() is a demo-only FNV-1a hash so that plain-text passwords
 * are never stored. It is NOT secure; a real backend would use bcrypt/argon2.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HRSStore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DB_KEY = "hrs:db:v1";
  const SESSION_KEY = "hrs:session";

  function hashPassword(pw) {
    let h = 0x811c9dc5;
    const s = "hrs-demo-salt:" + pw;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  function memoryStorage() {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  }

  function seedData() {
    const pw = hashPassword("Demo@1234");
    const day = (n) => new Date(Date.UTC(2024, 4, n)).toISOString().slice(0, 10);
    return {
      userTypes: [
        { id: 1, name: "renter" },
        { id: 2, name: "landlord" },
      ],
      users: [
        { id: 1, userTypeId: 2, fname: "Aina", lname: "Rahman", username: "demo_landlord", email: "aina.landlord@example.com", phone: "+60 12-000 1001", passwordHash: pw, image: "" },
        { id: 2, userTypeId: 2, fname: "Daniel", lname: "Lim", username: "daniel_lim", email: "daniel.lim@example.com", phone: "+60 12-000 1002", passwordHash: pw, image: "" },
        { id: 3, userTypeId: 2, fname: "Priya", lname: "Nair", username: "priya_n", email: "priya.nair@example.com", phone: "+60 12-000 1003", passwordHash: pw, image: "" },
        { id: 4, userTypeId: 1, fname: "Omar", lname: "Haddad", username: "demo_renter", email: "omar.renter@example.com", phone: "+60 12-000 2001", passwordHash: pw, image: "" },
        { id: 5, userTypeId: 1, fname: "Mei", lname: "Tan", username: "mei_tan", email: "mei.tan@example.com", phone: "+60 12-000 2002", passwordHash: pw, image: "" },
      ],
      properties: [
        { id: 1, userId: 1, name: "Taman Universiti terrace", address: "12 Jalan Pendidikan 3", city: "Parit Raja", price: 900, image: "assets/img/house-1.svg", description: "Three-bedroom terrace, five minutes from campus. Fully furnished with Wi-Fi." },
        { id: 2, userId: 1, name: "Single room near the bus stop", address: "4 Jalan Kenanga 1", city: "Parit Raja", price: 280, image: "assets/img/room-1.svg", description: "Private room in a shared house. Utilities included, shared kitchen." },
        { id: 3, userId: 2, name: "Batu Pahat town apartment", address: "88 Jalan Rahmat", city: "Batu Pahat", price: 1200, image: "assets/img/house-2.svg", description: "Two-bedroom apartment above the shops, walking distance to the market." },
        { id: 4, userId: 2, name: "Riverside bungalow", address: "3 Lorong Sungai Simpang", city: "Batu Pahat", price: 2100, image: "assets/img/house-3.svg", description: "Four-bedroom bungalow with a garden, suitable for families." },
        { id: 5, userId: 3, name: "Studio for short stays", address: "21 Jalan Bakawali", city: "Johor Bahru", price: 1500, image: "assets/img/room-2.svg", description: "Self-contained studio, available weekly or monthly." },
        { id: 6, userId: 3, name: "Seaside house", address: "7 Jalan Pantai Minyak Beku", city: "Batu Pahat", price: 1800, image: "assets/img/house-4.svg", description: "Three-bedroom house a short walk from the beach." },
      ],
      rentals: [
        { id: 1, userId: 4, propertyId: 1, date: day(1), status: "paid" },
        { id: 2, userId: 5, propertyId: 1, date: day(3), status: "unpaid" },
        { id: 3, userId: 5, propertyId: 3, date: day(6), status: "paid" },
      ],
      messages: [
        { id: 1, fromUserId: 4, toUserId: 1, message: "Hi, is the terrace still available next semester?", datetime: "2024-05-02T09:15:00Z" },
        { id: 2, fromUserId: 1, toUserId: 4, message: "Yes, from September. Would you like to view it?", datetime: "2024-05-02T09:40:00Z" },
      ],
    };
  }

  function createStore(storage) {
    storage = storage || memoryStorage();

    function load() {
      try {
        const raw = storage.getItem(DB_KEY);
        if (raw) return JSON.parse(raw);
      } catch (_) { /* corrupted or unavailable: fall through to seed */ }
      const db = seedData();
      save(db);
      return db;
    }
    function save(db) {
      try { storage.setItem(DB_KEY, JSON.stringify(db)); } catch (_) { /* quota / private mode */ }
    }
    const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    const publicUser = (u) => {
      if (!u) return null;
      const { passwordHash, ...rest } = u;
      return rest;
    };

    let db = load();
    const mutate = (fn) => { const r = fn(db); save(db); return r; };

    const api = {
      reset() { db = seedData(); save(db); storage.removeItem(SESSION_KEY); },

      // ---- USER_TYPE / USER -------------------------------------------------
      roleOf(user) {
        const t = db.userTypes.find((x) => x.id === (user && user.userTypeId));
        return t ? t.name : null;
      },
      getUser: (id) => publicUser(db.users.find((u) => u.id === id)),
      isUsernameTaken(username, exceptId) {
        const n = String(username).toLowerCase();
        return db.users.some((u) => u.username.toLowerCase() === n && u.id !== exceptId);
      },
      listLandlords(query) {
        const q = (query || "").trim().toLowerCase();
        return db.users
          .filter((u) => api.roleOf(u) === "landlord")
          .filter((u) => !q || [u.username, u.fname, u.lname, u.fname + " " + u.lname].some((s) => s.toLowerCase().includes(q)))
          .map(publicUser);
      },
      register(f) {
        if (api.isUsernameTaken(f.username)) throw new Error("Username taken");
        const type = db.userTypes.find((t) => t.name === f.userType);
        if (!type) throw new Error("Unknown user type");
        return mutate((d) => {
          const u = {
            id: nextId(d.users), userTypeId: type.id,
            fname: f.fname.trim(), lname: f.lname.trim(), username: f.username.trim(),
            email: f.email.trim(), phone: f.phone.trim(),
            passwordHash: hashPassword(f.password), image: f.image || "",
          };
          d.users.push(u);
          return publicUser(u);
        });
      },
      updateProfile(id, f) {
        if (api.isUsernameTaken(f.username, id)) throw new Error("Username taken");
        return mutate((d) => {
          const u = d.users.find((x) => x.id === id);
          if (!u) throw new Error("User not found");
          Object.assign(u, {
            fname: f.fname.trim(), lname: f.lname.trim(), username: f.username.trim(),
            email: f.email.trim(), phone: f.phone.trim(),
          });
          if (f.image !== undefined) u.image = f.image;
          if (f.password) u.passwordHash = hashPassword(f.password);
          return publicUser(u);
        });
      },

      // ---- Session (Process 1.0 Login) --------------------------------------
      login(username, password) {
        const n = String(username || "").trim().toLowerCase();
        const u = db.users.find((x) => x.username.toLowerCase() === n);
        if (!u || u.passwordHash !== hashPassword(password || "")) return null;
        storage.setItem(SESSION_KEY, String(u.id));
        return publicUser(u);
      },
      logout() { storage.removeItem(SESSION_KEY); },
      currentUser() {
        const id = Number(storage.getItem(SESSION_KEY));
        return id ? api.getUser(id) : null;
      },

      // ---- PROPERTY (Processes 3.0 search, 7.0 add/remove) ------------------
      searchProperties(query) {
        const q = (query || "").trim().toLowerCase();
        return db.properties.filter((p) =>
          !q || [p.name, p.address, p.city, p.description].some((s) => s.toLowerCase().includes(q))
        );
      },
      getProperty: (id) => db.properties.find((p) => p.id === id) || null,
      propertiesOf: (userId) => db.properties.filter((p) => p.userId === userId),
      addProperty(landlordId, f) {
        const owner = db.users.find((u) => u.id === landlordId);
        if (api.roleOf(owner) !== "landlord") throw new Error("Only landlords can add properties");
        return mutate((d) => {
          const p = {
            id: nextId(d.properties), userId: landlordId,
            name: f.name.trim(), address: f.address.trim(), city: f.city.trim(),
            price: Math.round(Number(f.price)), description: (f.description || "").trim(),
            image: f.image || "assets/img/house-" + (((d.properties.length) % 4) + 1) + ".svg",
          };
          d.properties.push(p);
          return p;
        });
      },
      removeProperty(landlordId, propertyId) {
        return mutate((d) => {
          const p = d.properties.find((x) => x.id === propertyId);
          if (!p || p.userId !== landlordId) throw new Error("Not your property");
          d.properties = d.properties.filter((x) => x.id !== propertyId);
          d.rentals = d.rentals.filter((r) => r.propertyId !== propertyId);
          return true;
        });
      },

      // ---- RENTAL (Process 5.0) --------------------------------------------
      rent(renterId, propertyId) {
        const renter = db.users.find((u) => u.id === renterId);
        const prop = api.getProperty(propertyId);
        if (api.roleOf(renter) !== "renter") throw new Error("Only renters can rent");
        if (!prop) throw new Error("Property not found");
        const existing = db.rentals.find((r) => r.userId === renterId && r.propertyId === propertyId);
        if (existing) return existing;
        return mutate((d) => {
          const r = { id: nextId(d.rentals), userId: renterId, propertyId, date: new Date().toISOString().slice(0, 10), status: "unpaid" };
          d.rentals.push(r);
          return r;
        });
      },
      rentalsForProperty(propertyId) {
        return db.rentals.filter((r) => r.propertyId === propertyId)
          .map((r) => ({ ...r, renter: api.getUser(r.userId) }));
      },
      rentalsOfRenter(renterId) {
        return db.rentals.filter((r) => r.userId === renterId)
          .map((r) => ({ ...r, property: api.getProperty(r.propertyId) }));
      },
      setRentalStatus(landlordId, rentalId, status) {
        if (!["paid", "unpaid"].includes(status)) throw new Error("Bad status");
        return mutate((d) => {
          const r = d.rentals.find((x) => x.id === rentalId);
          const p = r && d.properties.find((x) => x.id === r.propertyId);
          if (!p || p.userId !== landlordId) throw new Error("Not your rental");
          r.status = status;
          return r;
        });
      },
      /** Sends an in-app reminder to every unpaid renter of a property. Returns how many were sent. */
      remindUnpaid(landlordId, propertyId) {
        const p = api.getProperty(propertyId);
        if (!p || p.userId !== landlordId) throw new Error("Not your property");
        const unpaid = db.rentals.filter((r) => r.propertyId === propertyId && r.status === "unpaid");
        unpaid.forEach((r) => api.sendMessage(landlordId, r.userId,
          `Reminder: your rent for "${p.name}" (RM ${p.price}) is due. Please pay at your earliest convenience.`));
        return unpaid.length;
      },

      // ---- MESSAGE (Process 6.0) -------------------------------------------
      sendMessage(fromUserId, toUserId, text) {
        const msg = String(text || "").trim();
        if (!msg) throw new Error("Empty message");
        if (msg.length > 1000) throw new Error("Message too long");
        if (fromUserId === toUserId) throw new Error("Cannot message yourself");
        if (!db.users.some((u) => u.id === toUserId)) throw new Error("Recipient not found");
        return mutate((d) => {
          const m = { id: nextId(d.messages), fromUserId, toUserId, message: msg, datetime: new Date().toISOString() };
          d.messages.push(m);
          return m;
        });
      },
      conversation(a, b) {
        return db.messages
          .filter((m) => (m.fromUserId === a && m.toUserId === b) || (m.fromUserId === b && m.toUserId === a))
          .sort((x, y) => x.datetime.localeCompare(y.datetime));
      },
      /** People the user has exchanged messages with, most recent first. */
      contactsOf(userId) {
        const last = new Map();
        db.messages.forEach((m) => {
          if (m.fromUserId !== userId && m.toUserId !== userId) return;
          const other = m.fromUserId === userId ? m.toUserId : m.fromUserId;
          if (!last.has(other) || last.get(other) < m.datetime) last.set(other, m.datetime);
        });
        return [...last.entries()].sort((x, y) => y[1].localeCompare(x[1])).map(([id]) => api.getUser(id)).filter(Boolean);
      },
    };
    return api;
  }

  return { createStore, hashPassword, seedData, memoryStorage, DB_KEY, SESSION_KEY };
});
