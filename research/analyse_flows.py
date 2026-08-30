#!/usr/bin/env python3
"""
What the catalogue says about onboarding length, quizzes and paywalls.

The question this answers is the one the redesign brief asks and the app's own
analytics cannot: is a sixteen-screen onboarding long? Wrenchy has never had a
cohort on a stable bundle, so its funnel cannot say. 2,633 captured iOS flows,
with monthly revenue attached to most of them, can at least say what the apps
that make money actually do.

Read the caveats printed at the bottom of the report before quoting a number.
The largest of them: revenue here is a third-party estimate, the sample is
"apps someone thought worth capturing", and none of this is causal.
"""
import json
import pathlib
import statistics
from collections import Counter, defaultdict

DATA = pathlib.Path(__file__).parent / "onboarding-competitive" / "_data"


def load():
    return json.loads((DATA / "catalogue.json").read_text())


def median(xs):
    return statistics.median(xs) if xs else None


def bucket(rev):
    """Revenue bands, chosen so each holds enough apps to quote."""
    if rev is None or rev == 0:
        return "0 / unknown"
    if rev < 25_000:
        return "<25K"
    if rev < 100_000:
        return "25-100K"
    if rev < 500_000:
        return "100-500K"
    return "500K+"


ORDER = ["0 / unknown", "<25K", "25-100K", "100-500K", "500K+"]


def steps_of(app):
    avs = app.get("avs") or {}
    return avs.get("onboarding_step_count")


def paywall_of(app):
    avs = app.get("avs") or {}
    return avs.get("paywall_type")


def quiz_of(app):
    avs = app.get("avs") or {}
    return avs.get("has_onboarding_with_quiz")


def label_timeline(app):
    """
    Where the paywall sits in the captured replay, in seconds and in screens.

    Each replay frame carries labels ("onboarding", "paywall", ...) and a
    timestamp, which together give the one measurement the brief cares about
    most: how much of the product a user sees before being asked for money.
    """
    frames = app.get("replays") or []
    onb = [f for f in frames if "onboarding" in (f.get("labels") or [])]
    pay = [f for f in frames if "paywall" in (f.get("labels") or [])]
    if not pay:
        return None
    first_pay = min(float(f["timestamp"]) for f in pay)
    return {
        "first_paywall_s": first_pay,
        "onboarding_frames_before": sum(
            1 for f in onb if float(f["timestamp"]) < first_pay
        ),
        "total_frames": len(frames),
    }


def report(apps):
    out = []
    w = out.append

    w("# What 2,600 captured iOS flows do")
    w("")
    w(f"Apps in sample: **{len(apps)}**")
    w("")

    # ---- onboarding length ----
    w("## Onboarding length")
    w("")
    steps = [(steps_of(a), a.get("revenue")) for a in apps]
    have = [(s, r) for s, r in steps if isinstance(s, int)]
    w(f"Apps with a recorded step count: {len(have)}")
    if have:
        allsteps = sorted(s for s, _ in have)
        w("")
        w(f"- median: **{median(allsteps)}** steps")
        w(f"- mean: {sum(allsteps)/len(allsteps):.1f}")
        for p, name in [(0.25, "p25"), (0.75, "p75"), (0.9, "p90"), (0.99, "p99")]:
            w(f"- {name}: {allsteps[min(int(p*len(allsteps)), len(allsteps)-1)]}")
        w(f"- max: {allsteps[-1]}")
        w("")
        w("### Step count by revenue band")
        w("")
        w("| band | apps | median steps | p75 | share with 10+ steps |")
        w("| --- | --- | --- | --- | --- |")
        byband = defaultdict(list)
        for s, r in have:
            byband[bucket(r)].append(s)
        for b in ORDER:
            v = sorted(byband.get(b, []))
            if not v:
                continue
            p75 = v[min(int(0.75 * len(v)), len(v) - 1)]
            ten = sum(1 for x in v if x >= 10) / len(v)
            w(f"| {b} | {len(v)} | {median(v)} | {p75} | {ten:.0%} |")
        w("")

    # ---- quiz ----
    w("## Quiz onboardings")
    w("")
    q = [(quiz_of(a), a.get("revenue")) for a in apps]
    known = [(x, r) for x, r in q if x is not None]
    w(f"Apps with the field set: {len(known)} of {len(apps)}")
    if known:
        byband = defaultdict(list)
        for x, r in known:
            byband[bucket(r)].append(bool(x))
        w("")
        w("| band | apps | share with a quiz |")
        w("| --- | --- | --- |")
        for b in ORDER:
            v = byband.get(b, [])
            if v:
                w(f"| {b} | {len(v)} | {sum(v)/len(v):.0%} |")
        w("")
        # length, split by quiz
        wq = [steps_of(a) for a in apps if quiz_of(a) and isinstance(steps_of(a), int)]
        nq = [steps_of(a) for a in apps
              if quiz_of(a) is False and isinstance(steps_of(a), int)]
        if wq and nq:
            w(f"Median steps with a quiz: **{median(sorted(wq))}** (n={len(wq)}); "
              f"without: **{median(sorted(nq))}** (n={len(nq)}).")
            w("")

    # ---- paywall type ----
    w("## Paywall type")
    w("")
    types = Counter(paywall_of(a) for a in apps if paywall_of(a))
    w("| paywall type | apps | share | median revenue |")
    w("| --- | --- | --- | --- |")
    total = sum(types.values())
    revby = defaultdict(list)
    for a in apps:
        p = paywall_of(a)
        if p and a.get("revenue"):
            revby[p].append(a["revenue"])
    for name, n in types.most_common():
        med = median(sorted(revby.get(name, []))) or 0
        w(f"| {name} | {n} | {n/total:.0%} | ${med:,.0f} |")
    w("")

    # ---- paywall position ----
    w("## When the paywall arrives")
    w("")
    pos = [label_timeline(a) for a in apps]
    pos = [p for p in pos if p]
    if pos:
        secs = sorted(p["first_paywall_s"] for p in pos)
        before = sorted(p["onboarding_frames_before"] for p in pos)
        w(f"Apps whose replay contains a labelled paywall: {len(pos)}")
        w("")
        w(f"- median time to first paywall frame: **{median(secs):.0f}s**")
        w(f"- p25 / p75: {secs[int(0.25*len(secs))]:.0f}s / "
          f"{secs[int(0.75*len(secs))]:.0f}s")
        w(f"- median onboarding frames captured before it: **{median(before):.0f}**")
        w("")

    # ---- caveats ----
    w("## Caveats, which are load-bearing")
    w("")
    w("- **Revenue is a third-party estimate**, not reported earnings. Treat the")
    w("  bands as an ordering, never as amounts.")
    w("- **The sample is not the App Store.** It is apps a design library chose")
    w("  to capture, which skews toward well-known subscription apps. Survivor")
    w("  bias runs in exactly the direction that would make long onboardings")
    w("  look good.")
    w("- **`onboarding_step_count` is the library's count, not the app's.** It")
    w("  counts captured screens, so a step that scrolls may read as one and a")
    w("  transition may read as two. It is comparable across apps in this")
    w("  sample and not comparable to Wrenchy's own route count without care.")
    w("- **Nothing here is causal.** Apps that make money can afford long")
    w("  onboardings; long onboardings do not make money. The only honest use")
    w("  of this table is to answer 'is sixteen unusual', and the answer is")
    w("  what it is.")
    return "\n".join(out)


def main():
    apps = load()
    text = report(apps)
    dest = DATA.parent / "flow-statistics.md"
    dest.write_text(text + "\n")
    print(text)
    print(f"\n-> {dest}")


if __name__ == "__main__":
    main()
