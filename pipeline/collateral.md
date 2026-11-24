# CanPlus: paid-pilot sales collateral (DRAFT)

Status: draft for founder review. Nothing here has been sent or signed.
Legend: **[CONFIRM]** = fact or number the founder must supply. **[NEEDS LEGAL REVIEW]** = do not send as binding until a lawyer has reviewed it. `{{...}}` = merge field to fill per prospect.
Only facts from the CanPlus company profile (per the pipeline file, section 1) are stated as fact: Canvas-open-source base, runs on customer servers or private cloud, in-network AI course builder and AI Buddy, 100% data ownership, GDPR/FERPA compliance (as claimed on profile), full customization. Everything else is marked.

Inconsistency to resolve first: pipeline section 5 (Touch 3 email) offers a "free 30-day private pilot", while section 6 and this brief assume a **paid** pilot credited toward the annual contract. Pick one before any message goes out. **[CONFIRM: paid or free]**

---

## 1. Customer one-pager

**CanPlus: a Canvas-grade LMS with AI, fully behind your firewall.**

**The problem**
AI course-building and study tools are useful, but most run on public AI services. For institutions and regulated training teams, student and learner data cannot leave the network. SaaS LMS pricing and hosting also leave you with limited control over data, integrations and roadmap.

**The solution**
CanPlus is a learning management system built on open-source Canvas, deployed on your own servers or private cloud.
- **AI course builder**: draft course structure and content, running inside your network.
- **AI Buddy**: quizzes and flashcards for learners, running inside your network.
- **100% data ownership**: nothing is shared with other tenants.
- **Full customization**: internal integrations, simulators and branding.
- **Compliance**: built to support GDPR and FERPA requirements. [CONFIRM: exact wording; no certification is claimed here. Add DPDP (India) only if confirmed.]

**How deployment works** (proposed; every step [CONFIRM WITH CANPLUS])
1. Kickoff call: agree scope, users, environment (your servers/private cloud, or CanPlus-hosted for the pilot and migrated later).
2. CanPlus team installs and configures the pilot instance. [CONFIRM: typical install time; minimum server specs; who needs what access]
3. AI features enabled inside your network. [CONFIRM: model(s) used, hardware needs, whether GPU is required]
4. Pilot users onboarded (one department, {{100-300}} users). [CONFIRM: user cap]
5. Weekly check-ins; end-of-pilot review against agreed success criteria.

**Security and compliance, in short**
Your data stays on infrastructure you control. The AI runs inside your network, so prompts and content are not sent to a public AI service. [CONFIRM: true for the pilot configuration, with no external calls whatsoever.] Full detail: see the Security and Data-Handling FAQ. No certifications (SOC 2, ISO 27001, etc.) are claimed. [CONFIRM: list any actually held]

**Pilot offer**
- 30-day private pilot for one department or course set, {{100-300}} users.
- Installed by our team; AI course builder and AI Buddy enabled.
- Pilot fee: **{{PRICE, set by founder}}**, credited toward an annual contract if you continue. [CONFIRM: price, currency, credit terms]
- One-page order form; security note provided on request.
- Setup slots are limited. [CONFIRM: true capacity, or remove this line]

**Next step**
20-minute demo this week, then we send the one-page order form the same day. Contact: {{founder name, email, phone}} | canplus.io

*Proof points: none included. Add real customer names, quotes or case studies only if the founder confirms they exist and may be cited.* [CONFIRM]

---

## 2. Pilot order form / LOI (1 page)

**[NEEDS LEGAL REVIEW: template only. All terms below are placeholders and are not final, not legal advice, and not binding until reviewed by counsel and signed.]**

**CanPlus 30-Day Pilot Order Form / Letter of Intent**

| Field | Entry |
|---|---|
| Provider (legal entity) | {{CanPlus legal entity name, registered address, tax ID}} [CONFIRM] |
| Customer (legal entity) | {{Customer legal name, address}} |
| Customer pilot sponsor / approver | {{name, title, email}} |
| Customer technical contact | {{name, title, email}} |
| Pilot scope | {{department/course(s)}}; up to {{N}} users; features: Canvas-based LMS, AI course builder, AI Buddy |
| Deployment model | [ ] Customer servers  [ ] Customer private cloud  [ ] CanPlus-hosted for pilot, then migrate |
| Infrastructure provided by customer | {{VM/specs/network access}} [CONFIRM requirements] |
| Pilot start date | {{DD-MMM-YYYY}} |
| Pilot end date | {{start + 30 days}} |
| Pilot fee | {{AMOUNT, CURRENCY}} [CONFIRM] ; taxes: {{GST/VAT treatment}} [NEEDS LEGAL REVIEW] |
| Payment terms | {{e.g. due on signature / net X}} [CONFIRM] |
| Credit toward annual contract | {{Yes, up to 100% / other / No}} [CONFIRM] |
| Success criteria | 1. {{e.g. N courses built}}  2. {{N active users}}  3. {{security review passed}} |
| Data handling | Customer data stays on Customer-controlled infrastructure. Data Processing Agreement / security note: {{attach or reference}} [NEEDS LEGAL REVIEW] |
| Support during pilot | {{channel, hours, response target}} [CONFIRM] |
| Conversion option | At pilot end, Customer may convert to an annual agreement at {{price/terms to be agreed}}. No obligation to convert unless separately signed. [NEEDS LEGAL REVIEW] |
| Confidentiality, liability, IP, governing law, termination, data deletion at pilot end | {{[NEEDS LEGAL REVIEW]: use counsel's standard clauses}} |

Binding status: [ ] Binding pilot order   [ ] Non-binding LOI (select one) [NEEDS LEGAL REVIEW]

Signed for Provider: ____________ Name/Title: ________ Date: ______
Signed for Customer: ____________ Name/Title: ________ Date: ______

---

## 3. Security and data-handling FAQ

Answers are drafts. Every item marked [CONFIRM WITH CANPLUS] must be verified before sending to a CIO/CISO. Do not answer a security questionnaire from this draft alone.

**Q1. Where is it hosted?**
On the customer's own servers or private cloud, per the company profile. Pilot may alternatively be hosted by CanPlus and migrated. [CONFIRM WITH CANPLUS: which hosting options exist for the pilot; if CanPlus-hosted, which provider and region.]

**Q2. Data residency?**
Data resides wherever the customer deploys it. For customer-hosted deployments, residency is the customer's choice. [CONFIRM WITH CANPLUS: for CanPlus-hosted pilots, data location; any backups or telemetry leaving the environment.]

**Q3. Who has access to our data?**
Intended position: only the customer's authorized users and admins; no sharing across tenants. [CONFIRM WITH CANPLUS: whether CanPlus staff have any access (for install, support); how that access is granted, logged, time-limited and revoked; background checks; subcontractors.]

**Q4. Where does the AI model run? Is our data used to train models?**
AI features run inside the customer's network per the company profile. [CONFIRM WITH CANPLUS: which model(s) and licences; open-weight or third-party; hardware needed; confirmation that no prompts or content go to external APIs; confirmation that customer data is never used for training.]

**Q5. What compliance do you meet (GDPR, FERPA, DPDP, SOC 2, ISO 27001)?**
The company profile states GDPR and FERPA compliance. [CONFIRM WITH CANPLUS: what that means in practice (DPA available? DPO? sub-processors?); any audits or certifications actually held; DPDP Act position. Do not claim any certification not in hand.]

**Q6. How are updates and security patches delivered?**
[CONFIRM WITH CANPLUS: Canvas upstream version tracked; patch cadence; who applies updates; how critical CVEs are handled and communicated; testing before release; customer's control over timing.]

**Q7. What is the support SLA?**
Pipeline objection answer says "we do SLA support". [CONFIRM WITH CANPLUS: support hours, channels, severity levels, response and resolution targets, escalation path, pilot support terms, timezone coverage, named contacts.]

**Q8. Encryption, authentication, logging?**
[CONFIRM WITH CANPLUS: encryption in transit/at rest; SSO (SAML/OIDC/LDAP) support; MFA; audit logging; role-based access.]

**Q9. Vulnerability testing and incident response?**
[CONFIRM WITH CANPLUS: pen-test history, vulnerability disclosure process, breach notification timeline, incident contacts.]

**Q10. Backup, disaster recovery, and exit?**
[CONFIRM WITH CANPLUS: backup responsibilities, RPO/RTO if any, data export formats, data deletion at pilot end and certificate of deletion.]

**Q11. Source code access / escrow / lock-in?**
The core is open-source Canvas. Pipeline objection list says "escrow/source access available (confirm with your team)". [CONFIRM WITH CANPLUS: what is open vs proprietary (AI components, customizations); escrow availability and terms.]

**Q12. Migration from existing Canvas/Moodle/Blackboard?**
Pipeline claims light migration from Canvas because CanPlus is Canvas-based. [CONFIRM WITH CANPLUS: supported import paths for Canvas, Moodle, Blackboard; effort and cost; whether migration is in pilot scope.]

**Q13. Customers and references?**
No customers or case studies are listed here. [CONFIRM WITH CANPLUS: whether any referenceable customers exist.]

---

## 4. 20-minute demo run-sheet

Pre-demo checklist (day before)
- Demo environment running and tested on a clean login. [CONFIRM: who owns demo instance, URL, accounts]
- Sample course prepared in the prospect's subject area; no real third-party data in it.
- Backup plan: pre-recorded 5-minute screen capture in case of a failure.
- Order form (section 2) filled with known fields and ready to send; pilot fee decided. [CONFIRM]
- Know: who signs, current LMS, their trigger event (from LinkedIn/Clay research).

| Time | Segment | Do | Say / ask | Capture |
|---|---|---|---|---|
| 0:00-3:00 | Their situation | Listen | "Which LMS do you use today? Where does AI or data worry you? Who approves a pilot, and what would they need to see?" | Current LMS, concern, approver, budget route, timeline |
| 3:00-10:00 | Product (7 min) | (a) AI course builder: create a short module live. (b) AI Buddy: generate quiz and flashcards from it. (c) Show where it runs. | "Everything you just saw runs inside your network." Only say this if true for the demo environment. [CONFIRM] | Reactions, must-haves |
| 10:00-14:00 | Deployment and compliance (4 min) | Show architecture slide (draft from FAQ answers once confirmed) | Hosting options, who has access, how data is kept in your control, how updates work. Use only confirmed FAQ answers. Offer the written FAQ for their security team. | Security reviewer name, questionnaire needed? |
| 14:00-17:00 | Pilot offer (3 min) | Share one-pager | Scope, 30 days, user count, fee {{PRICE}}, credited if they continue, proposed start date. | Objections (see pipeline section 9) |
| 17:00-20:00 | Next step (3 min) | Agree dates live | "I'll send the order form today. Can we agree a signature date and a technical contact for a 30-minute kickoff?" | Signature date, tech contact, who else must review |

Same-day follow-up: recap email, one-pager, FAQ, order form, proposed calendar for the 5-day plan.
Rules: do not demo features that are not built; do not state numbers, customers or certifications not confirmed; log everything in the tracker.

---

## 5. Mutual action plan (first call to signature, 5 days)

Shared with the customer. Dates are relative; fill in real dates at the first call. Owners: V = Vendor (CanPlus), C = Customer.

| Day | Milestone | Owner | Done? | Date |
|---|---|---|---|---|
| Day 1 | Discovery/demo call (20 min); confirm pilot scope, user count, department | V + C sponsor | | {{ }} |
| Day 1 | Vendor sends recap, one-pager, FAQ, draft order form | V | | {{ }} |
| Day 2 | Customer names technical contact and security reviewer; shares security/procurement requirements | C | | {{ }} |
| Day 2 | Technical/security call; vendor answers questionnaire (only confirmed answers) | V + C IT | | {{ }} |
| Day 3 | Customer confirms environment (server/private cloud or vendor-hosted pilot) and start date | C IT | | {{ }} |
| Day 3 | Vendor sends final order form incl. DPA/security note (after legal review) | V | | {{ }} |
| Day 4 | Customer internal approval (name approver and process; confirm amount is within approver's authority) | C sponsor | | {{ }} |
| Day 4 | Redlines/questions resolved | V + C | | {{ }} |
| Day 5 | E-signature of order form / LOI | Both | | {{ }} |
| Day 5 | Kickoff scheduled; pilot start date locked | Both | | {{ }} |

Known risks to confirm at first call: approver identity; procurement threshold; security review duration; infrastructure readiness; legal review of order form on both sides.
Escalation if a step slips more than 1 day: sponsor-to-sponsor call within 24 hours.
