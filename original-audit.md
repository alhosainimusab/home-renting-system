# Audit of the original submission

Each bug below was reproduced by running the submitted files in Chromium with the input shown. The CDN copy of jQuery was stubbed locally because the test machine had no internet, except in #13, which tests the no-internet case on purpose.

| # | Bug | Input | Result |
|---|-----|-------|--------|
| 1 | Login accepts any credentials | username `nobody`, password `wrong` | Redirected to the logged-in home page |
| 2 | Empty login accepted | both fields blank | Redirected to the logged-in home page |
| 3 | Role read from the URL | open `main_loggedin.html?landlord` without logging in | Landlord-only "Rent List" appears |
| 4 | Broken query parsing | open `main_loggedin.html` (no `?`), click Rent | Navigates to `rent.html?file:///…/main_loggedin.html`, leaking the local path into the URL |
| 5 | No sign-up validation | password `abc`, confirm `xyz`, email `not-an-email` | Account "created", user logged in |
| 6 | Silent failure without a user type | sign up with no Renter/Landlord choice | Button does nothing, no message |
| 7 | Sign-up button mislabelled | — | Button text is "Sign In" |
| 8 | "Forget password" goes to sign-up | — | Link points to the sign-up page |
| 9 | Search does nothing after login | type `zzz`, press Enter on Rent page | All 3 houses still listed |
| 10 | Rent does nothing | click Rent, confirm the dialog | Nothing saved, no feedback |
| 11 | Chat cannot send | type `hello`, press Enter | Chat stays empty |
| 12 | Duplicate element IDs | — | 3 elements share `id="con"` (also `id="chat"`, `id="introduction"`) |
| 13 | jQuery needed for a no-op | load Rent page offline, click a house | `$ is not defined`; details never open |
| 14 | Log out text not clickable | click "Log out" text on Profile | Nothing happens; only the small icon works |
| 15 | Copy-paste labels | Landlord page | All three cards read "Person 1 profile" |

Other problems found by reading the files: six pages copy the same header, sidebar, chat and navigation code; `<button>`, `<p>` and `<div>` placed directly inside `<tr>`; `test.html` is an unrelated tutorial example; `prototype_SAD` is empty; the `.png` diagrams and logo are JPEG files; the `.docx` time sheet is a renamed Markdown file.
