#!/usr/bin/env python3
"""Per-locale keyword research for Glovebox.

The point of this script is the thing translation cannot do: it asks each
national App Store what its own users actually type. `hints` is the live
autocomplete endpoint behind the App Store search bar, so every term it returns
is a query real people in that storefront have run. Seeds are native-language
stems, never translations of the English keyword field, which is why German
comes back "auto wartung" / "scheckheft" instead of the dictionary
"Fahrzeugwartung" nobody searches.

Each surviving term is then scored against the live top 10 of that storefront
(median rating count, how many of the ten are weak apps with <1000 ratings), so
a locale's keyword field can be filled with terms that are both real and
winnable rather than real and hopeless.

    python3 research/locales.py            # all locales
    python3 research/locales.py de-DE fr-FR

Writes research/locale-keywords.json.
"""
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request

HINTS = "https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints"
SEARCH = "https://itunes.apple.com/search"

# storefront id per country, needed by the hints endpoint's store-front header
STOREFRONT = {
    "US": 143441, "GB": 143444, "AU": 143460, "CA": 143455, "FR": 143442,
    "DE": 143443, "ES": 143454, "MX": 143468, "BR": 143503, "IT": 143450,
    "NL": 143452, "PL": 143478, "JP": 143462, "TR": 143480, "SA": 143479,
    "KR": 143466, "SE": 143456, "CZ": 143489, "HU": 143482,
}

# App Store Connect locale -> (storefront country, iTunes search lang, seed stems)
LOCALES = {
    "en-GB": ("GB", "en_gb", [
        "car maintenance", "car service", "service history", "service book",
        "mot remind", "car log", "oil change", "vehicle service",
        "mileage log", "car repair", "garage log",
    ]),
    "en-AU": ("AU", "en_au", [
        "car maintenance", "car service", "log book service", "car log book",
        "oil change", "vehicle maintenance", "rego remind", "service remind",
        "car expenses", "mileage",
    ]),
    "en-CA": ("CA", "en_ca", [
        "car maintenance", "car service", "oil change remind", "vehicle log",
        "maintenance log", "service history", "car repair log", "mileage",
        "winter tire", "car care",
    ]),
    "fr-FR": ("FR", "fr_fr", [
        "entretien voiture", "carnet entretien", "vidange", "revision voiture",
        "controle technique", "suivi entretien", "kilometrage",
        "carnet de bord voiture", "garage auto", "reparation voiture",
    ]),
    "de-DE": ("DE", "de_de", [
        "auto wartung", "wartungsheft", "olwechsel", "scheckheft",
        "kfz wartung", "werkstatt", "tuv erinnerung", "fahrtenbuch",
        "kilometerstand", "auto pflege", "inspektion auto",
    ]),
    "es-ES": ("ES", "es_es", [
        "mantenimiento coche", "revision coche", "cambio de aceite",
        "libro de mantenimiento", "taller coche", "itv", "kilometraje",
        "averias coche", "gastos coche",
    ]),
    "es-MX": ("MX", "es_mx", [
        "mantenimiento auto", "servicio auto", "cambio de aceite",
        "verificacion", "bitacora auto", "kilometraje", "taller mecanico",
        "gastos del carro", "mantenimiento carro",
    ]),
    "pt-BR": ("BR", "pt_br", [
        "manutencao carro", "revisao carro", "troca de oleo",
        "controle de manutencao", "quilometragem", "oficina",
        "gastos do carro", "diario do carro", "manutencao veiculo",
    ]),
    "it": ("IT", "it_it", [
        "manutenzione auto", "tagliando auto", "cambio olio",
        "libretto manutenzione", "revisione auto", "chilometraggio",
        "spese auto", "officina", "scadenze auto",
    ]),
    "nl-NL": ("NL", "nl_nl", [
        "auto onderhoud", "onderhoudsboekje", "apk herinnering",
        "olie verversen", "kilometerstand", "autokosten", "garage auto",
        "onderhoud bijhouden",
    ]),
    # Polish with its diacritics: "przeglad" without the ą is a different string
    # to Apple's index and returned almost nothing, which is how this locale came
    # back with thirteen terms on the first pass.
    "pl": ("PL", "pl_pl", [
        "serwis samochodu", "przegląd techniczny", "wymiana oleju",
        "książka serwisowa", "przebieg auta", "koszty samochodu",
        "naprawa samochodu", "warsztat samochodowy", "opony wymiana",
        "olej silnikowy", "auto koszty", "moje auto",
    ]),
    "ja": ("JP", "ja_jp", [
        "車 整備", "車 メンテナンス", "オイル交換", "整備記録", "車検",
        "走行距離", "カーメンテ", "車 記録", "燃費",
    ]),
    # Canadian French: the CA storefront's own autocomplete, queried in French,
    # which is what surfaces Québec vocabulary (char, changement d'huile) rather
    # than the France terms.
    "fr-CA": ("CA", "fr_ca", [
        "entretien voiture", "changement d'huile", "carnet d'entretien",
        "entretien auto", "kilométrage", "réparation auto", "garage",
        "mécanicien", "pneus d'hiver", "dépenses auto",
    ]),
    "tr": ("TR", "tr_tr", [
        "araç bakım", "araba bakım", "yağ değişimi", "servis kaydı",
        "kilometre takip", "muayene hatırlat", "oto servis", "araç masraf",
    ]),
    "ar-SA": ("SA", "ar_sa", [
        "صيانة السيارة", "تغيير الزيت", "سجل الصيانة", "الفحص الدوري",
        "عداد السيارة", "مصاريف السيارة", "صيانة سيارتي",
    ]),
    "ko": ("KR", "ko_kr", [
        "차량 정비", "엔진오일 교환", "정비 기록", "주행거리", "자동차 관리",
        "차계부", "정기점검", "자동차 소모품", "정비소", "타이어 교환",
        "자동차 정비", "차량 관리",
    ]),
    "sv": ("SE", "sv_se", [
        "bilservice", "oljebyte", "servicebok", "bilkostnader",
        "mätarställning", "besiktning", "underhåll bil", "digital servicebok",
        "bilens service", "verkstad bil", "milmätare",
    ]),
    "cs": ("CZ", "cs_cz", [
        "servis auta", "výměna oleje", "servisní kniha", "kilometry auto",
        "stk kontrola", "náklady na auto", "údržba auta",
    ]),
    "hu": ("HU", "hu_hu", [
        "autó szerviz", "olajcsere", "szervizkönyv", "kilométeróra",
        "műszaki vizsga", "autó költség", "autó karbantartás",
    ]),
}

# suggestions that are an app's marketed name rather than a query people type
BRANDY = re.compile(r"[:：]|—|·|\bapp\b|\bpro\b$", re.I)


# Apple throttles hard: four processes at ~3 req/s earned a wall of 403s and
# 429s that scored zero terms for two locales. One process, one request at a
# time, a floor between requests, and a long backoff on refusal is slower than
# the parallel version was and is the only version that returns data.
MIN_INTERVAL = 1.0
_last = [0.0]


def get(url, headers=None, tries=5):
    req = urllib.request.Request(url, headers=headers or {})
    for attempt in range(tries):
        wait = MIN_INTERVAL - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                body = r.read().decode("utf-8", "replace")
            _last[0] = time.time()
            return body
        except Exception as e:
            _last[0] = time.time()
            throttled = "429" in str(e) or "403" in str(e)
            if attempt == tries - 1:
                print(f"  !! {e}", file=sys.stderr)
                return None
            time.sleep(20 if throttled else 3)


def hints(term, country):
    url = f"{HINTS}?{urllib.parse.urlencode({'clientApplication': 'Software', 'term': term, 'country': country})}"
    body = get(url, {
        "User-Agent": "iTunes-iPhone/12.0 (5; 16GB)",
        "X-Apple-Store-Front": f"{STOREFRONT[country]}-1,29",
    })
    if not body:
        return []
    out = []
    for m in re.finditer(r"<key>term</key>\s*<string>(.*?)</string>", body, re.S):
        out.append(m.group(1).replace("&amp;", "&").strip())
    return out


def stems(seed):
    """The seed plus two truncations, so autocomplete gets room to complete."""
    yield seed
    if len(seed) > 6:
        yield seed[:-2]
    if len(seed) > 9:
        yield seed[:-4]


def harvest(country, seeds):
    found = {}
    for seed in seeds:
        for stem in stems(seed):
            for term in hints(stem, country):
                if BRANDY.search(term):
                    continue
                found.setdefault(term.lower(), set()).add(seed)
            time.sleep(0.3)
    return {t: sorted(s) for t, s in found.items()}


def top10(term, country, lang):
    url = f"{SEARCH}?{urllib.parse.urlencode({'term': term, 'country': country, 'lang': lang, 'entity': 'software', 'limit': 10})}"
    body = get(url)
    if not body:
        return None
    try:
        return json.loads(body).get("results", [])
    except json.JSONDecodeError:
        return None


def score(term, results):
    if not results:
        return None
    titles = [r.get("trackName", "").lower() for r in results]
    counts = [r.get("userRatingCount", 0) or 0 for r in results]
    return {
        "results": len(results),
        "exact_title_matches": sum(1 for t in titles if term in t),
        "median_ratings": int(statistics.median(counts)) if counts else 0,
        "weak_apps": sum(1 for c in counts if c < 1000),
        "top_app": titles[0] if titles else "",
        "top_ratings": counts[0] if counts else 0,
    }


def main():
    """`SKIP_SCORES=1` harvests terms only.

    Apple serves the autocomplete endpoint far more freely than the search
    endpoint, and after a few hundred scoring calls `/search` starts answering
    403 for hours while `/hints` keeps working. The terms are the deliverable —
    they are what goes in a keyword field — so the two are separable, and a
    scoring pass can be re-run later against the same term list.
    """
    want = sys.argv[1:] or list(LOCALES)
    skip_scores = os.environ.get("SKIP_SCORES") == "1"
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "locale-keywords")
    os.makedirs(out_dir, exist_ok=True)
    for locale in want:
        country, lang, seeds = LOCALES[locale]
        print(f"\n=== {locale} ({country})", file=sys.stderr)
        terms = harvest(country, seeds)
        print(f"  {len(terms)} candidate terms", file=sys.stderr)
        scored = {}
        for term in sorted(terms):
            # A term whose competition could not be measured is still a term real
            # people type. Dropping it on a failed lookup silently shrank two
            # locales to a third of their real vocabulary.
            entry = {"seeds": terms[term]}
            if not skip_scores:
                s = score(term, top10(term, country, lang))
                if s:
                    entry.update(s)
            scored[term] = entry
        # one file per locale so locales can be harvested in parallel processes
        path = os.path.join(out_dir, f"{locale}.json")
        json.dump({"country": country, "lang": lang, "terms": scored},
                  open(path, "w"), indent=1, ensure_ascii=False)
        print(f"  {len(scored)} terms -> {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
