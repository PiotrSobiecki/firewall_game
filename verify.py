import os
import sys
from playwright.sync_api import sync_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "5173"
os.makedirs("shots", exist_ok=True)
msgs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 540, "height": 920})
    page.on("console", lambda m: msgs.append((m.type, m.text)))
    page.on("pageerror", lambda e: msgs.append(("pageerror", str(e))))

    page.goto(f"http://localhost:{PORT}")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)  # Phaser boot -> Menu
    page.screenshot(path="shots/menu.png")

    page.keyboard.press("Enter")  # start game
    page.wait_for_timeout(4000)  # let viruses spawn / shield draw
    page.screenshot(path="shots/game.png")

    browser.close()

print("=== CONSOLE ===")
for t, x in msgs:
    print(f"[{t}] {x}")
errs = [m for m in msgs if m[0] in ("error", "pageerror", "warning")]
print("=== ERROR/WARN COUNT:", len(errs), "===")
