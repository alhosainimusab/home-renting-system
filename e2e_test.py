"""
End-to-end browser test: walks through every user flow in a real Chromium
and fails on any assertion or JavaScript error.

    pip install playwright && python -m playwright install chromium
    python tests/e2e/e2e_test.py                 # opens the pages via file://
    python tests/e2e/e2e_test.py --screenshots   # also regenerates docs/screenshots/
"""
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT.as_uri() + "/"
OUT = str(ROOT / "docs" / "screenshots") + "/"
SHOOT = "--screenshots" in sys.argv
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width":1280,"height":800}, device_scale_factor=1)
        pg = await ctx.new_page()
        errs=[]
        pg.on("pageerror", lambda e: errs.append("PAGEERROR "+str(e)))
        pg.on("console", lambda m: errs.append("CONSOLE "+m.text) if m.type=="error" else None)
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        async def shot(n, full=False):
            if SHOOT:
                await pg.mouse.move(0, 799)  # park the cursor so no card shows a hover state
                await pg.screenshot(path=OUT+n+".png", full_page=full)
        await pg.goto(BASE+"index.html"); await shot("landing")
        # public: rent asks login
        await pg.click("nav >> text=Rent"); await pg.wait_for_selector("#login-form")
        await pg.fill("#li-username","demo_renter"); await pg.fill("#li-password","bad"); await pg.click("#login-form button")
        assert "incorrect" in await pg.text_content("#li-error")
        await pg.fill("#li-password","Demo@1234")
        assert await pg.text_content("#li-error")=="", "error should clear while typing"
        await pg.fill("#li-password","Demo@1234"); await shot("login")
        
        await pg.click("#login-form button"); await pg.wait_for_url("**/home.html")
        await shot("home-renter")
        assert "Rent list" not in await pg.text_content("nav")
        # rent-list guard for renter
        await pg.goto(BASE+"rent-list.html"); await pg.wait_for_url("**/home.html")
        await pg.goto(BASE+"rent.html")
        assert await pg.locator("#property-grid .tile").count()==6
        await pg.fill("#q","batu pahat"); await pg.wait_for_timeout(100)
        assert await pg.locator("#property-grid .tile").count()==3, await pg.locator("#property-grid .tile").count()
        await shot("rent-search")
        await pg.fill("#q",""); await pg.wait_for_timeout(100)
        await pg.click("#property-grid .tile >> nth=4")  # studio, Priya
        await pg.wait_for_selector("#do-rent"); await shot("rent-detail")
        await pg.click("#do-rent"); await pg.wait_for_timeout(200)
        assert await pg.locator("#do-rent").is_disabled()
        await pg.click("#do-contact"); await pg.wait_for_selector("#chat-panel.open")
        await pg.fill("#chat-input","Hi Priya, I just rented the studio. When can I move in?"); await pg.press("#chat-input","Enter")
        await pg.wait_for_timeout(200); await pg.wait_for_timeout(2700)
        await shot("chat")
        await pg.fill("#chat-input","<img src=x onerror=alert(1)>"); await pg.press("#chat-input","Enter"); await pg.wait_for_timeout(100)
        assert "<img" in await pg.text_content("#chat-log .mine >> nth=-1")  # escaped, not rendered
        assert await pg.locator("#chat-log img").count()==0
        # landlords page
        await pg.goto(BASE+"landlords.html")
        assert await pg.locator("#landlord-grid .tile").count()==3
        await pg.fill("#q","daniel"); await pg.wait_for_timeout(100)
        assert await pg.locator("#landlord-grid .tile").count()==1
        await pg.click("#landlord-grid .tile"); await pg.wait_for_selector(".detail-person"); await shot("landlord-detail")
        await pg.keyboard.press("Escape")
        # profile + edit
        await pg.goto(BASE+"profile.html"); 
        await pg.click("text=Edit profile"); await pg.wait_for_url("**mode=edit")
        assert await pg.input_value("#f-username")=="demo_renter"
        await pg.fill("#f-phone","12"); await pg.click("#submit-btn")
        assert "phone" in (await pg.text_content('[data-for="phone"]')).lower()
        await pg.fill("#f-phone","+60 11-222 3333"); await pg.click("#submit-btn"); await pg.wait_for_url("**/profile.html")
        assert "+60 11-222 3333" in await pg.text_content("#profile-card")
        await pg.click("#logout"); await pg.wait_for_url("**/index.html")
        # signup validation
        await pg.goto(BASE+"signup.html")
        await pg.fill("#f-username","demo_landlord"); await pg.fill("#f-password","weakpass"); await pg.click("#submit-btn")
        await pg.evaluate("window.scrollTo(0,0)"); await shot("signup-validation", full=True)
        assert "taken" in await pg.text_content('[data-for="username"]')
        assert "number" in await pg.text_content('[data-for="password"]')
        await pg.fill("#f-username","new_landlord"); await pg.check('input[value="landlord"]')
        await pg.fill("#f-fname","Farah"); await pg.fill("#f-lname","Ismail")
        await pg.fill("#f-password","Strong#123"); await pg.fill("#f-cpassword","Strong#123")
        await pg.fill("#f-email","farah@example.com"); await pg.fill("#f-phone","+60 13-444 5555")
        await pg.click("#submit-btn"); await pg.wait_for_url("**/home.html")
        assert "Rent list" in await pg.text_content("nav")
        await pg.click("#logout")
        # landlord flow
        await pg.goto(BASE+"index.html"); await pg.click("#signin")
        await pg.fill("#li-username","demo_landlord"); await pg.fill("#li-password","Demo@1234"); await pg.click("#login-form button")
        await pg.wait_for_url("**/home.html"); 
        await pg.goto(BASE+"rent-list.html"); await shot("rent-list")
        await pg.click("#my-grid .tile >> nth=0"); await pg.wait_for_selector("#remind"); await shot("rent-list-tenants")
        await pg.click("#remind"); await pg.wait_for_timeout(200)
        assert "Reminder sent to 1" in await pg.text_content("#toast")
        await pg.click('[data-rental="2"]'); await pg.wait_for_timeout(100)
        assert await pg.locator("#remind").is_disabled()
        await pg.keyboard.press("Escape")
        await pg.click("#add-property"); await pg.click("#prop-form button")
        assert await pg.text_content('[data-for="price"]')
        await pg.fill("#p-name","Muar shophouse room"); await pg.fill("#p-address","5 Jalan Abdullah"); await pg.fill("#p-city","Muar"); await pg.fill("#p-price","400")
        await pg.fill("#p-desc","Furnished room above a shophouse, near the Muar bus terminal.")
        await pg.wait_for_selector("#toast:not(.show)")  # let the earlier toast fade out
        await shot("add-property")
        
        await pg.click("#prop-form button"); await pg.wait_for_timeout(100)
        assert await pg.locator("#my-grid .tile").count()==3
        # mobile
        await pg.set_viewport_size({"width":390,"height":844}); await pg.goto(BASE+"rent.html"); await shot("mobile-rent")
        await pg.set_viewport_size({"width":1280,"height":800})
        # reset
        await pg.goto(BASE+"profile.html"); await pg.click("#reset-data"); await pg.wait_for_url("**/index.html")
        assert not errs, errs
        print("E2E PASS: all flows OK, no JavaScript errors")
        await b.close()
asyncio.run(main())
