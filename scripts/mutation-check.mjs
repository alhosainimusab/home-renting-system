// Mutation check: deliberately breaks the code in 10 ways and confirms the
// unit tests fail each time. A mutant that "survives" means a missing test.
// Usage: node scripts/mutation-check.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const mutants = [
  ["js/store.js", 'u.passwordHash !== hashPassword(password || "")', "false", "login ignores password"],
  ["js/store.js", 'if (api.roleOf(renter) !== "renter") throw new Error("Only renters can rent");', "", "landlords allowed to rent"],
  ["js/store.js", 'r.propertyId === propertyId && r.status === "unpaid"', "r.propertyId === propertyId", "reminder sent to paid tenants"],
  ["js/store.js", 'if (!p || p.userId !== landlordId) throw new Error("Not your rental");', "", "edit another landlord's rental"],
  ["js/store.js", "d.rentals = d.rentals.filter((r) => r.propertyId !== propertyId);", "", "orphan rentals after delete"],
  ["js/store.js", "if (f.password) u.passwordHash", "if (true) u.passwordHash", "blank password overwrites on edit"],
  ["js/store.js", "u.username.toLowerCase() === n && u.id !== exceptId", "u.username === username && u.id !== exceptId", "case-sensitive duplicate check"],
  ["js/validation.js", 'if (!/[^A-Za-z0-9]/.test(pw || "")) problems.push("a symbol");', "", "symbol rule dropped"],
  ["js/validation.js", 'if (pw !== (f.cpassword || ""))', "if (false)", "confirm-password check dropped"],
  ["js/validation.js", "price <= 0", "price < 0", "zero rent accepted"],
];

let survived = 0;
for (const [file, from, to, name] of mutants) {
  const original = readFileSync(file, "utf8");
  if (!original.includes(from)) throw new Error(`Mutation target not found: ${name}`);
  writeFileSync(file, original.replace(from, to));
  try {
    const caught = spawnSync(process.execPath, ["--test"], { encoding: "utf8" }).status !== 0;
    if (!caught) survived++;
    console.log(`${caught ? "caught  " : "SURVIVED"}  ${name}`);
  } finally {
    writeFileSync(file, original);
  }
}
console.log(`\n${mutants.length - survived}/${mutants.length} mutants caught`);
process.exit(survived ? 1 : 0);
