# Changelog

All notable changes to this project. Dates are when the change was made.

## [1.1.0] - 2026-10-06 — Post-submission rework

### Added
- Working data layer (`js/store.js`) whose tables follow the ERD: users, user types, properties, rentals and messages, saved in `localStorage`.
- Real login with password check, sign-up and edit-profile validation (username, names, password policy from the report, confirm password, email, phone).
- Property search and landlord search that filter as you type.
- Renting a property, landlord rent list with paid/unpaid status, "Mark paid/unpaid", and "Remind unpaid tenants".
- Add and remove property for landlords (DFD process 7.0).
- One-to-one chat that saves messages and lists recent contacts.
- Role-based access: Rent list is landlord-only, enforced from the logged-in user, not the URL.
- 23 unit tests (`node --test`), a mutation check (10/10 deliberate bugs caught), and a Playwright end-to-end test.
- GitHub Actions workflow running unit, mutation and end-to-end tests.
- README, screenshots, `.gitignore`, `.gitattributes`, `docs/original-audit.md`.

### Changed
- Pages renamed for GitHub Pages: `main.html` → `index.html`, `index.html` → `signup.html`, `main_loggedin.html` → `home.html`, `landlord.html` → `landlords.html`, `rentList.html` → `rent-list.html`.
- Seven near-identical stylesheets merged into `css/style.css`; header, sidebar, chat and navigation code moved into `js/ui.js`.
- Layout made responsive down to phone width; keyboard focus and Escape-to-close added.
- ERD corrected in code: `passwordHash` added to `USER`; `rental_ID` removed from `PROPERTY`.
- Sample data replaced with fictional users and listings; stock photos and template logo replaced with original SVGs.

### Removed
- jQuery and Bootstrap (loaded for one no-op line; the page broke without network).
- Group chats (not supported by the ERD's `MESSAGE` table).
- `test.html` (copied tutorial example), empty `prototype_SAD` file, report and time sheet (contain matric numbers and personal data).

### Fixed
- 15 bugs reproduced in the original submission; see `docs/original-audit.md`.

## [1.0.0] - 2024-06 — Course submission
- Static clickable mock-up submitted for BIC21003 System Analysis and Design (group project).
