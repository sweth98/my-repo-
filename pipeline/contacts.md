# CanPlus: named contacts from Clay (search-contacts, free plan)

Source: Clay `search-contacts` only (task IDs: mcp-task_0tozw80r8vFsVA2iX6x, mcp-task_0tozw85kpSfB7PC9bx7, mcp-task_0tozw8dosevMnu43DEW). Run 2026-11-24. Values are exactly as returned by Clay; no enrichment (emails etc.) was run. Nothing has been sent.

| Company | Name | Title (as returned) | LinkedIn URL | Location | Notes |
|---|---|---|---|---|---|
| Great Learning (mygreatlearning.com) | Murali Mohan R | Head of IT and Security | https://www.linkedin.com/in/murali-mohan-r-62a70622/ | Greater Bengaluru Area | Started in role 2026-04 (about 7 months); likely still evaluating tools. Best primary contact. |
| Great Learning (mygreatlearning.com) | Vinod Venkatraman | Chief Technology Officer | https://www.linkedin.com/in/vinodvenkatraman/ | Bengaluru, Karnataka, India | In role since 2024-05 |
| Emeritus (emeritus.org) | Shailesh Agarwal | Global Chief Information Officer | https://www.linkedin.com/in/sagarwal906/ | New Delhi, Delhi, India | Recently started in role: 2026-04 |
| Emeritus (emeritus.org) | Bhushan Heda | CTO/COO | https://www.linkedin.com/in/bhushanheda/ | San Francisco Bay Area | In role since 2023-02 |
| Simplilearn (simplilearn.com) | Jitendra Kumar | CTO | https://www.linkedin.com/in/jitendrakumar/ | Bengaluru, Karnataka, India | In role since 2025-06 |
| Revature (revature.com) | Spencer Bharath | Director of IT | https://www.linkedin.com/in/spencerbharath/ | Reston, Virginia, United States | In role since 2024-01 |
| LearningMate (learningmate.com) | Ed Jung | Chief Architect and Head of Technology | https://www.linkedin.com/in/edjung/ | Scottsdale, Arizona, United States | In role since 2012-02 (long tenure) |
| LearningMate (learningmate.com) | Palash Sinha | AVP Devops & Cloud practice | https://www.linkedin.com/in/palash-sinha-2b10111/ | Mumbai, Maharashtra, India | In role since 2023-01. Technical lead, not a top-level IT head; weaker fit. |
| Indian School of Business (isb.edu) | Trinadh Sappa - MCA, CTO, PMP | "Aspiring CTO" | https://www.linkedin.com/in/trinadh-sappa-mca-cto-pmp-9b434333b/ | Hyderabad, Telangana, India | Low confidence: the title is a self-described headline and not a real CTO role at ISB. Started 2024-12. Do not treat as a decision-maker without checking. |

## Companies where nothing was found

Two search passes were run: a narrow one (CIO/CTO/Head of IT/CISO/Dean or Director of Online or Digital Learning/Head of L&D or Learning Technology), then a broader title list for the 7 companies still empty. Clay returned zero matching current employees for:

| Company | Domain | Why nothing was found |
|---|---|---|
| IIM Bangalore | iimb.ac.in | Zero matches on both passes. Likely thin Clay coverage of Indian institution staff or non-standard titles (e.g. "Chairperson, Computer Centre", "Associate Dean"). |
| BITS Pilani | bits-pilani.ac.in | Zero matches on both passes. Same likely cause; academic IT roles are often titled "Professor-in-charge" or "Chief Information Officer" under non-standard labels. |
| Intellipaat | intellipaat.com | Zero matches on both passes. Clay's people data for this company appears sparse. |
| Edureka | edureka.co | Zero matches on both passes. Same cause. |
| NIIT MTS | niitmts.com | Zero matches on both passes. Possibly indexed under the parent NIIT entity, or titles differ (e.g. "VP Learning Technology"). Not tried: searching niit.com. |

No company hit the 3-per-company cap (max returned was 2), so the cap did not truncate results.

## Tool limits hit
- Vibe Prospecting not used (out of credits), per instruction.
- Clay free plan: results are thin, and no emails or phone numbers were pulled (`add-contact-data-points` Email was not run, to avoid spending credits). The LinkedIn URLs above came straight from the search, so no separate enrichment was needed.
- The 10-company cap on `companyIdentifiers` forced 2 searches for the first pass (10 + 1), plus 1 broader retry.
- No cross-entity filters were used.
