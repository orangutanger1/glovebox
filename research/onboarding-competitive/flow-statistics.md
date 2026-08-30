# What 2,600 captured iOS flows do

Apps in sample: **1800**

## Onboarding length

Apps with a recorded step count: 1799

- median: **6** steps
- mean: 10.2
- p25: 3
- p75: 14
- p90: 27
- p99: 54
- max: 95

### Step count by revenue band

| band | apps | median steps | p75 | share with 10+ steps |
| --- | --- | --- | --- | --- |
| 0 / unknown | 332 | 5.0 | 10 | 26% |
| <25K | 256 | 6.5 | 19 | 42% |
| 25-100K | 542 | 6.0 | 13 | 33% |
| 100-500K | 447 | 6 | 15 | 36% |
| 500K+ | 222 | 5.0 | 11 | 31% |

## Quiz onboardings

Apps with the field set: 971 of 1800

| band | apps | share with a quiz |
| --- | --- | --- |
| 0 / unknown | 271 | 38% |
| <25K | 135 | 47% |
| 25-100K | 262 | 39% |
| 100-500K | 164 | 46% |
| 500K+ | 139 | 47% |

Median steps with a quiz: **11** (n=411); without: **3.0** (n=560).

## Paywall type

| paywall type | apps | share | median revenue |
| --- | --- | --- | --- |
| Free Trial - Soft Paywall | 998 | 55% | $90,000 |
| No Free Trial - Soft Paywall | 467 | 26% | $75,000 |
| No Paywall | 141 | 8% | $80,000 |
| Free Trial - Hard Paywall | 120 | 7% | $50,000 |
| No Free Trial - Hard Paywall | 73 | 4% | $45,000 |

## When the paywall arrives

Apps whose replay contains a labelled paywall: 1660

- median time to first paywall frame: **61s**
- p25 / p75: 30s / 127s
- median onboarding frames captured before it: **9**

## Caveats, which are load-bearing

- **Revenue is a third-party estimate**, not reported earnings. Treat the
  bands as an ordering, never as amounts.
- **The sample is not the App Store.** It is apps a design library chose
  to capture, which skews toward well-known subscription apps. Survivor
  bias runs in exactly the direction that would make long onboardings
  look good.
- **`onboarding_step_count` is the library's count, not the app's.** It
  counts captured screens, so a step that scrolls may read as one and a
  transition may read as two. It is comparable across apps in this
  sample and not comparable to Wrenchy's own route count without care.
- **Nothing here is causal.** Apps that make money can afford long
  onboardings; long onboardings do not make money. The only honest use
  of this table is to answer 'is sixteen unusual', and the answer is
  what it is.
