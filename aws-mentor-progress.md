# AWS Cloud Mentor — Progress

Started: 2026-08-23
Last session: 2026-08-23

## Current position
- Current module: 1 — Global infrastructure
- Current difficulty level on this module: 1 (starting fresh)

## Modules completed
- [x] 0 — Big picture
- [ ] 1 — Global infrastructure
- [ ] 2 — Compute
- [ ] 3 — Serverless
- [ ] 4 — Containers
- [ ] 5 — Storage
- [ ] 6 — Databases
- [ ] 7 — Networking
- [ ] 8 — CDN
- [ ] 9 — DNS
- [ ] 10 — Security
- [ ] 11 — Monitoring & management
- [ ] 12 — Messaging & integration
- [ ] 13 — Architecture walkthroughs
- [ ] 14 — Well-Architected Framework
- [ ] 15 — Cloud economics
- [ ] 16 — Billing & cost management

## Projects completed
- [ ] 1 Static Website
- [ ] 2 Secure EC2 Web Server
- [ ] 3 Private Database Architecture
- [ ] 4 Highly Available Website
- [ ] 5 Serverless API
- [ ] 6 Image Upload System
- [ ] 7 Background Job System
- [ ] 8 Notification System
- [ ] 9 Event-Driven Application
- [ ] 10 Monitoring System
- [ ] 11 Secure Application
- [ ] 12 Cost Optimization Project
- [ ] 13 Disaster Recovery Exercise
- [ ] 14 Mini E-Commerce Architecture
- [ ] 15 Final Capstone

## Known weak areas (specific, not just scores)
- Took three attempts to stop asserting "cloud is unconditionally cheaper" —
  kept reaching for that even after being shown the flat/predictable-workload
  counterexample (Q4, then the scenario, then the own-words explanation).
  Eventually self-corrected by landing on "pay-as-you-go" (cost tracks
  usage) as the mechanism, which correctly handles both directions. Watch
  for this instinct resurfacing in Module 15 (Cloud Economics) — reinforce
  the "premium buys flexibility; no benefit if there's nothing to flex"
  framing again there.
- Initially ordered IaaS/PaaS/Serverless management level backwards
  (thought serverless was least managed) — corrected in-session, seemed to
  land, but worth a quick re-check when Module 2/3 comparisons come up.
- On the "flat predictable workload, cloud or on-prem" scenario, first
  answer substituted a hybrid-cloud strategy instead of answering the cost
  question asked — redirected successfully once flagged.

## Quiz / scenario history
- 2026-08-25 — Module 0 knowledge check — quiz 3/5 correct on first pass
  (missed: service-model management order; cloud-is-always-cheaper).
  Scenario required two redirects before landing correctly on "on-prem
  wins here because there's no variability to monetize." Own-words
  explanation took three iterations before it was framed conditionally
  (pay-as-you-go) instead of as a flat cost claim. Also did a deep-dive
  detour on deployment models (on-prem/public/private/hybrid/multi-cloud)
  before finishing the retention loop — that detour is covered, not
  re-teach.

## Notes for next session
- Module 0 complete as of 2026-08-25. Starting Module 1 (Global
  Infrastructure: Regions, AZs, Edge Locations, Region vs AZ, HA/FT/DR/BC).
  Deployment models (on-prem/public/private/hybrid/multi-cloud) were
  already covered in depth during Module 0 — no need to re-teach if they
  resurface as a topic later, just reference back to it.
