"""Renders icons.json to white-on-transparent PNGs at 1x/2x/3x (24pt) for tinting.
Paths for settings, chevron, oil, filter, coolant, spark and wrench are Feather
icons (MIT); the rest are drawn here in the same 24-unit, 1.8-stroke grammar."""
import json, os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); out = sys.argv[1]
icons = json.load(open(os.path.join(here, "icons.json")))
with sync_playwright() as p:
    b = p.chromium.launch()
    for scale, suffix in [(1, ""), (2, "@2x"), (3, "@3x")]:
        pg = b.new_page(viewport={"width": 200, "height": 200}, device_scale_factor=scale)
        for name, body in icons.items():
            pg.set_content(f"<html><body style='margin:0;background:transparent'><svg id=i xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>{body}</svg></body></html>")
            pg.locator("#i").screenshot(path=os.path.join(out, f"{name}{suffix}.png"), omit_background=True)
        pg.close()
    b.close()
