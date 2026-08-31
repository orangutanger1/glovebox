# Unrepainted English art

The five fourth-pass frames exactly as authored, at 1242x2688 — baked English
headline, baked grey subtitle, glow intact. These are the files the four native
English locales ship (`en-US`, `en-GB`, `en-AU`, `en-CA`); those locale
directories under `store/screenshots/` are copies of what is here, not renders.

`ship shots render` with no locale argument repaints every locale's caption band
and will overwrite them. Render the twelve translated locales by name:

    ship shots render de-DE es-ES es-MX fr-CA fr-FR it ja ko nl-NL pl pt-BR sv

or restore afterwards:

    for l in en-US en-GB en-AU en-CA; do
      cp store/screenshots-art/IPHONE_65/*.png "store/screenshots/$l/IPHONE_65/"
    done

`store/screenshots-raw/` is a different thing: the same art with the band
snapped to black and the subtitle erased, which is the base the caption-band
renderer repaints for the translated locales.
