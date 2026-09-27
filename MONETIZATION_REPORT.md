# QuietSend — Commercial Assessment

**Status**: Pre-launch. Zero users, zero revenue.
**Purpose**: An honest read of what this asset is worth, how it could earn, and what would change those numbers.
**Version**: `3.0.0`
**Updated**: 25 August 2026

> This document replaces an earlier version that opened with "100% Release-Ready
> (Score: 10/10)" and valued the project at $10,000–$30,000. Both figures were
> written before any code review and neither was defensible. The numbers below
> are grounded in 2026 market comparables and stated with their methodology, so
> they can be checked rather than believed.

---

## 1. Honest status

The engineering is in good shape. A full code review raised 23 findings across
correctness, security, accessibility and performance; all 23 were fixed and
independently re-verified. The build is clean, 19 tests pass, and the app ships
a threat model that documents its own limits.

What has **not** happened:

- No end-to-end testing in a real browser on real devices
- No independent cryptographic audit
- No users, no revenue, no market signal of any kind

The correct summary is "engineering-complete, commercially unvalidated." Any
document claiming otherwise costs credibility with exactly the people who
matter — technical buyers and employers, who will check.

---

## 2. What it is worth

### 2.1 Market value today: **₹45,000 – ₹1,80,000**

Software is valued on revenue multiples. With revenue at zero those formulas
return zero, so buyers fall back to asset value. 2026 comparables put a working
product with no users at **$500–$3,000**, rising to $2,000–$10,000 only once
there is a waitlist or early users. At roughly ₹88/USD that is ₹44,000–₹2,64,000,
and QuietSend sits in the lower half:

| Factor | Effect |
| --- | --- |
| Zero users, zero revenue | Strongly negative — the two things buyers price |
| Narrow category | Negative — free competitors exist (OpenStego, Steghide) |
| Unaudited cryptography | Negative — a buyer inherits the risk, not an asset |
| Five-language coverage | Positive — cited in 2026 guidance as a scalability signal |
| Documented threat model | Positive — rare in this category, signals maturity |

### 2.2 Replication cost: **₹5,00,000 – ₹14,00,000**

What it would cost to have built. Roughly 12,400 lines including applied
cryptography, a steganography engine, Web Workers, PWA, accessibility, five
languages and tests — call it 250–400 hours of genuinely senior work at Indian
senior/specialist rates of ₹2,000–5,000/hour, with security work commanding a
30–50% premium.

**This is a floor for negotiation, not a market price.** The gap between what
something cost to build and what it sells for is normal. Effort does not create
market value; traction does.

### 2.3 Career value: **₹8,00,000 – ₹15,00,000 per year, recurring**

Realistically the largest number here, and the one least dependent on strangers.

The codebase demonstrates correct applied cryptography (AEAD, sane KDF
parameters, HKDF, constant-time comparison, rejection sampling), Web Workers,
a real accessibility pass, i18n, PWA architecture, and a security review that
was acted on and published. As evidence for a security-engineering role, that is
strong. If it contributes to moving from a general development role into a
security one, the salary delta recurs annually and exceeds any plausible sale
price in year one.

---

## 3. Monetisation paths, ranked

### 3.1 Paid native application — *best fit*

**The constraint that kills the obvious plan:** every feature runs in the user's
browser with no server. A licence check is JavaScript the user controls, so
gating features or quotas client-side is bypassable with devtools, and trivially
so if the source is public. Freemium is not implementable in this architecture.

A native app is. It also solves the deepest criticism of the product — a web app
can be silently modified by whoever controls the server; a signed binary cannot.

> Free on the web. Paid for the app whose code cannot be changed underneath you.

That sells a real security improvement rather than withholding one, and app store
distribution handles licensing. Indicative price ₹300–₹1,500 one-time.

### 3.2 Enterprise document watermarking — *highest revenue ceiling*

A different product built on the same engine. Organisations embed a unique
invisible marker in each recipient's copy of a sensitive document; if it leaks,
the copy identifies the source. Real budgets, procurement that does not demand an
activist-grade threat model, and the engine already does the hard part.

This is where steganography actually earns money. Indicative ₹40,000–₹1,50,000
per organisation, and one signed contract is worth more than the entire consumer
plan.

### 3.3 Sponsorship — *free to run, small*

GitHub Sponsors or Ko-fi. No conflict with the mission, near-zero effort,
near-zero revenue. Worth doing because it costs nothing.

---

## 4. What not to do

- **Do not gate security features.** The earlier plan put Honey-Vault — the
  plausible-deniability feature protecting someone under coercion — behind a
  paywall, and gave free users LSB-4, which is *more* detectable than the LSB-2
  default. "Pay or your steganography is easier to detect" will be dismantled
  publicly within an hour of posting.
- **Do not sell to journalism organisations yet.** OCCRP, ICIJ and similar are
  the right users but have security review processes that will not clear an
  unaudited solo-developer crypto tool, correctly so. Give it to them free, earn
  the reference, sell later.
- **Do not claim NIST CAVP.** CAVP is a formal validation programme with issued
  certificates. "CAVP-style" is puffery in free marketing and edges toward a
  false certification claim in a paid product. Call it a cryptographic self-test
  suite.
- **Do not run ads.** It would contradict the entire positioning.
- **Keep checkout off the app domain.** Taking payments means holding customer
  records, in tension with "we never see anything." Put it on a separate
  marketing domain and say so in the privacy policy.

---

## 5. What actually moves the number

| Action | Effect on value |
| --- | --- |
| First recurring revenue, even ₹20,000/month | Unlocks revenue multiples: 2–4× annual ≈ ₹5–10 lakh |
| Any users or a waitlist | Moves from the $500–3k band into $2–10k |
| Independent cryptographic audit | Removes the largest buyer objection for a crypto product |
| One B2B watermarking contract | Proves a budgeted, repeatable use case — the biggest lever |
| More features | **No effect.** Already feature-complete for zero users |

Revenue is the whole game. ₹20,000/month recurring is worth more to a buyer than
another ten thousand lines of excellent code.

---

## 6. Recommended sequence

1. **Finish the pre-launch list** — real-device round trip, working security
   contact, public repository.
2. **Launch free and open.** No paywall, no tiers. Lead with the threat model;
   honesty about limits is the differentiator in this category.
3. **Observe for six weeks.** Two questions only: do people return, and do they
   ask for anything.
4. **Then decide with evidence:**
   - Returning users asking for more → build the native app
   - An organisation asks about watermarking → follow it; that is the business
   - A spike then silence → an interesting demo; bank the credential
   - Near silence → the niche is too small, learned in weeks rather than years

Building more features before step 3 is the comfortable move that avoids finding
out. The remaining risk in this project is not technical.

---

### Sources

- [Pre-Revenue Project Valuation Guide 2026 — ExitBid](https://exitbid.io/blog/how-to-value-a-pre-revenue-project)
- [Startup Valuation Multiples 2026 — Flippa](https://flippa.com/blog/startup-multiples-how-startups-are-valued-today/)
- [SaaS Valuation Multiples from 520+ Deals — BigIdeasDB](https://bigideasdb.com/saas-valuation-guide-2026)
- [Software Development Rates in India 2026 — Acquaint](https://acquaintsoft.com/blog/software-development-rates-india)
- [Freelancer Charges in India 2026 — XFlow](https://www.xflowpay.com/blog/freelancer-charges)
