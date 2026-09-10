// Derive a per-territory price table for pro_weekly from the weekly-subscription
// pricing index, reusing shipkit's FX snapshot and ladder vocabulary.
//
// Two deliberate departures from shipkit's derivePlan, both because a $3.99
// weekly base is far coarser than the monthly bases that table was written for:
//
//  1. Finer ladders. shipkit's charm99 snaps to whole-unit-minus-.01, i.e. steps
//     of 1.00 — a 25% step at this price. Every European uplift in the index
//     (1.15-1.38) lands between 3.99 and 4.99 and gets rounded straight back to
//     3.99, discarding the entire signal. Apple sells .49 midpoints, so charm49
//     is used instead; likewise the Nordic ladder carries kr 35 as well as
//     kr 29/39, so nordic5 replaces whole9 there.
//  2. Only the 49 storefronts the index actually covers are planned. The rest
//     keep their live equalized price rather than inheriting shipkit's
//     purchasing-power basis, which is a different and much more aggressive
//     judgement that nobody asked this plan to enact.
import { TERRITORIES, CONVENTIONS, FX_AS_OF, COMMISSION } from '/home/myen/shipkit/src/lib/pricing.mjs';

const BASE = 3.99;
const FLOOR = 0.75; // max(MIN_PROCEEDS_USD 0.75, ads.targetCpi 1.1 / 3)

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

const LADDERS = {
	...CONVENTIONS,
	charm49: {
		label: 'x.49 / x.99',
		why: 'Apple sells both .49 and .99 price points. At a weekly base the .99-only ladder moves in 25% steps, which rounds every index uplift back onto the base price; the .49 midpoint is the finest real rung.',
		round: (v) => {
			const base = Math.floor(v);
			const options = [base - 0.01, base + 0.49, base + 0.99, base + 1.49].filter((n) => n >= 0.49);
			return r2(options.reduce((best, n) => (Math.abs(n - v) < Math.abs(best - v) ? n : best), options[0]));
		},
	},
	nordic5: {
		label: 'multiple of 5, 9-ending where it lands',
		why: 'the Danish and Swedish ladders carry kr 29 / 35 / 39 / 45 / 49. Snapping only to 9-endings moves in 10-krone steps, too coarse to express a 1.17-1.27 index against a kr 39 base.',
		round: (v) => Math.max(5, Math.round(v / 5) * 5),
	},
};

// Finer ladder substitutions, applied only where the coarse one destroys the signal.
const REFINE = { charm99: 'charm49', whole9: null };
const ladderFor = (t) => {
	if (t.rounding === 'charm99') return 'charm49';
	if (t.rounding === 'whole9' && ['DKK', 'SEK', 'NOK'].includes(t.currency)) return 'nordic5';
	return t.rounding;
};

// basisPct straight off the chart (index * 100). benchmark 1.00 = US.
const CHART = {
	PL: 138, SE: 127, GB: 125, FR: 122, DK: 122, NL: 120, DE: 120, AT: 119,
	PT: 119, LV: 118, CZ: 118, SK: 117, NO: 117, CY: 116, ES: 116, LT: 115,
	IT: 115, MT: 112, EE: 111, CH: 111, HU: 110, SG: 105, GR: 104, BG: 103,
	NZ: 102, GT: 100, UY: 100, SV: 100, BO: 100, HN: 100, NI: 100, CR: 100,
	PY: 100, US: 100, AR: 100, CA: 97, HK: 95, TW: 94, CO: 93, AU: 89,
	CN: 86, DO: 84, EC: 79, PE: 77, CL: 75, MX: 74, PH: 71, MY: 71, TR: 56,
};

// Index storefronts shipkit's table does not carry. Currency and ladder taken
// from the live pro_weekly territory prices, not guessed.
const EXTRA = [
	{ territory: 'LV', alpha3: 'LVA', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'LT', alpha3: 'LTU', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'EE', alpha3: 'EST', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'CY', alpha3: 'CYP', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'MT', alpha3: 'MLT', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'BG', alpha3: 'BGR', currency: 'EUR', fx: 0.9, rounding: 'charm99' },
	{ territory: 'AR', alpha3: 'ARG', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'GT', alpha3: 'GTM', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'UY', alpha3: 'URY', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'SV', alpha3: 'SLV', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'BO', alpha3: 'BOL', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'HN', alpha3: 'HND', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'NI', alpha3: 'NIC', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'CR', alpha3: 'CRI', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'PY', alpha3: 'PRY', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'DO', alpha3: 'DOM', currency: 'USD', fx: 1, rounding: 'charm99' },
	{ territory: 'EC', alpha3: 'ECU', currency: 'USD', fx: 1, rounding: 'charm99' },
];

const rows = [];
for (const t of [...TERRITORIES, ...EXTRA]) {
	const basisPct = CHART[t.territory];
	if (basisPct === undefined) continue; // not covered by the index — leave live price alone
	const rounding = ladderFor(t);
	const price = LADDERS[rounding].round(BASE * (basisPct / 100) * t.fx);
	const usdEquivalent = r2(price / t.fx);
	const effectivePct = r1((usdEquivalent / BASE) * 100);
	const proceedsUsd = r2(usdEquivalent * (1 - COMMISSION));
	rows.push({
		territory: t.territory,
		alpha3: t.alpha3,
		currency: t.currency,
		price,
		decimals: rounding === 'charm49' || rounding === 'charm99' ? 2 : 0,
		basisPct,
		rounding,
		note: `${basisPct}% of the US price, from the weekly subscription pricing index, on the ${LADDERS[rounding].label} ladder`,
		fx: t.fx,
		usdEquivalent,
		effectivePct,
		roundingDriftPct: r1(effectivePct - basisPct),
		proceedsUsd,
		belowFloor: proceedsUsd < FLOOR,
	});
}
rows.sort((a, b) => a.territory.localeCompare(b.territory));

const doc = {
	baseUsd: BASE,
	floorUsd: FLOOR,
	commission: COMMISSION,
	fxAsOf: FX_AS_OF,
	generatedAt: new Date().toISOString(),
	app: { name: 'Wrenchy', bundleId: 'com.idea6.carmaintenancelog', appId: '6797103341' },
	subscription: 'pro_weekly',
	basis: 'weekly subscription pricing index, benchmark 1.00 = US; storefronts absent from the index keep their live equalized price',
	rows,
	flagged: rows.filter((r) => r.belowFloor).map((r) => r.territory),
	conventions: Object.fromEntries(
		[...new Set(rows.map((r) => r.rounding))].map((k) => [k, { label: LADDERS[k].label, why: LADDERS[k].why }]),
	),
};
process.stdout.write(JSON.stringify(doc, null, '\t') + '\n');
