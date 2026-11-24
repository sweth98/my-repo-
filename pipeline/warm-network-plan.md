# CanPlus: warm-network mining plan

Purpose: in 5 days, turn the founder's own network into replies, intros and a paid pilot. Warm paths convert far better than cold outreach, and the plan relies on them for a one-week close.
Rules: no contacts are listed here because none are known. All names come from the founder's own LinkedIn export. Only message people who know the founder. Never scrape, never buy lists, never send bulk identical text. Every message is approved by the founder before sending.

## 1. Export first-degree connections (LinkedIn, about 10 minutes)

1. LinkedIn (desktop) -> profile photo -> Settings & Privacy -> Data privacy -> Get a copy of your data.
2. Choose "Want something in particular?" and tick Connections. Request archive.
3. LinkedIn emails a link (minutes to about 10 minutes for Connections only). Download the ZIP and open `Connections.csv`.
4. Columns: First Name, Last Name, URL, Email Address, Company, Position, Connected On. Email is often blank because many members hide it. Do not try to find hidden emails; message on LinkedIn.
5. Save as `pipeline/warm-connections.csv`. Keep this file out of git (personal data of third parties); add it to `.gitignore`.
6. Fallback if the export is slow: LinkedIn search -> People -> Connections: 1st -> filter by Company/Industry (Higher Education, E-Learning, IT Services, Banking), and read the list manually.

## 2. Rank the list (spreadsheet, 30 minutes)

Add a Score column and sum these points per person:

| Signal | Points |
|---|---|
| Works at one of the 18 target accounts (see tracker.csv) | +5 |
| Title includes Dean, Director, Registrar, CIO, CTO, Head of IT, CISO, Head of L&D, CLO, Principal, Vice-Chancellor, Founder (edtech) | +4 |
| Works at a private college, B-school, training institute, or regulated corporate academy (Tier A) | +3 |
| Ed-tech or training company (Tier B partner/resale) | +3 |
| Past colleague, classmate, client, or someone you worked with directly | +3 |
| Connected in the last 12 months or recently interacted | +2 |
| Works in IT/security/L&D at any institution or firm with 100+ staff | +2 |
| Known connector (knows many people in education/IT) | +2 |

Ranking order, highest first:
1. People at target accounts, and decision-makers at private institutions and regulated firms (Tier 1: contact first, Tue).
2. Ed-tech/training founders and partner prospects (Tier 2: Tue/Wed).
3. Connectors: professors, alumni leads, community admins, consultants who know institutions (Tier 3: ask for intros, Wed).
4. Everyone else with a score of 3 or more (Tier 4: post reactions, Fri).

Target: 30 personalized DMs on Tuesday from Tier 1-2, then 10 intro requests on Wednesday from Tier 3.

## 3. Find second-degree paths to the 18 targets

For each account in `tracker.csv`:
1. Open the company LinkedIn page -> People -> filter Connections: 2nd, search "IT", "digital learning", "online education", "learning technology", "CIO", "registrar".
2. Or use: `"<Company>" AND ("Head of IT" OR CIO OR "digital learning" OR "online education" OR "learning technology")` with Connections: 2nd.
3. For each hit, open the profile -> "Mutual connections" -> note which first-degree contact connects you.
4. Record in tracker.csv: Contact, Role, LinkedIn URL, Source=warm, and Next step = "Ask <mutual> for intro".
Start with Murali Mohan R (Great Learning), then ISB, IIM Bangalore, BITS Pilani, and the 7 other Tier B accounts.

## 4. Scripts (edit before sending; remove any claim you cannot prove)

Placeholders in braces are filled by hand. Do not mention customers, price or certifications unless confirmed.

### A. Direct DM to a warm first-degree contact (decision-maker or peer)
> Hi {{first}}, hope {{something real: the new role / the programme at X}} is going well. Quick one: I'm building CanPlus, a Canvas-based LMS that runs on your own servers with the AI course tools running inside your network, so student and staff data never leaves. I'm looking for 2 institutions to run a 30-day private pilot with a single department. Does this sit with you, or is there someone at {{company}} you'd suggest I speak to? Happy to send a 1-page note first.

### B. Ask a connector for an intro to a named person (2nd-degree)
> Hi {{first}}, I'm hoping you can help with a small favour. I saw you're connected to {{target name}} at {{company}}. I'm working on a private-deployment LMS with AI built in and think it could be relevant to their work on {{specific thing}}. Would you be comfortable introducing us? I've written a short forwardable blurb below so it takes you 30 seconds. Totally fine to say no.
>
> Blurb: "{{Founder}} runs CanPlus, a Canvas-based LMS with AI tools that run entirely inside your own servers. They're offering a short, paid 30-day pilot to one department. Worth a 20-minute look?"

### C. Ask for a referral when someone replies but is not the buyer
> Thanks {{first}}, appreciated. Who at {{company}} would own digital learning or IT security for something like this? If you're happy to make a 2-line intro I'll keep it short, or I can message them mentioning you suggested it, whichever you prefer.

### D. Public LinkedIn post (Tue 11:00)
> I'm looking for 2 institutions or training teams to pilot an AI-enabled LMS that runs entirely on your own servers.
>
> CanPlus is built on Canvas open source: AI course builder and study assistant run inside your network, so student and employee data never leaves. 30-day paid pilot for one department, set up by our team, fee credited against any annual contract.
>
> If you run digital learning, IT, or L&D, or know someone who does, comment or message me. Introductions very welcome.

After posting: DM everyone who reacts or comments within 2 hours, using Script A and mentioning their reaction.

### E. Past client / colleague (familiar tone)
> Hey {{first}}, it's been a while. I'm running a small project at CanPlus now: a Canvas-based LMS that deploys on your own servers with AI built in. I'd love 10 minutes of your honest view, and if you know anyone at a college or training team that cares about data control, an intro would be gold.

### F. Follow-up (after 2 working days of silence)
> Hi {{first}}, bumping this once in case it got buried. If it isn't relevant, a one-word reply is fine and I won't chase.

### G. Thank-you and loop-closer to introducers
> Thanks {{first}}, {{name}} and I spoke today / have a demo on {{day}}. I'll let you know how it goes.

## 5. Referral and community channels

| Channel | Action this week | Rules |
|---|---|---|
| Canvas/Instructure community (community.canvaslms.com) and Canvas open-source groups | Answer 3 genuine questions about self-hosting, data, or AI. Mention CanPlus only in profile or when asked. | Help first; no pitches. |
| LinkedIn groups: edtech India, higher-education technology, LMS admins, L&D leaders | Join 3-5 (approval may take days; request today). Comment on real posts. | Follow each group's rules. |
| Ed-tech communities and meetups (search "edtech India", "LMS" on LinkedIn events and Meetup) | Find events in the next 2 weeks; register. | Attend as a listener first. |
| Associations of principals/IT heads, alumni networks, former professors | Ask the founder's own college contacts for 2 intros each. | Use Script B or E. |
| Ed-tech partners (Tier B accounts, plus small training firms) | Propose a white-label/private-deployment pilot for their enterprise clients. | Lead with their client needs. |
| Open-source networks, GitHub/Canvas contributor circles | Share a short "how we run Canvas with in-network AI" note if the founder has one. | Technical, no sales. |
| Customers and advisors (if any) | Ask for one introduction each. | Only mention real customers with their permission. |

## 6. Cadence

| Day | Warm network actions | Output |
|---|---|---|
| Tue | Export + rank (by 11:00). Post (Script D). 30 DMs from Tier 1-2 (A, E). | 30 DMs, 1 post |
| Wed | Intro requests (B) to Tier 3 for the top 10 second-degree targets. Referral asks (C) on replies. Follow-up (F) to Tue non-responders only after 48h, so Thursday. | 10 intro asks |
| Thu | Chase pending intros once. Thank introducers (G). Ask demo attendees for one referral. | Intros converted to meetings |
| Fri | Tier 4 DMs and post reactors. Ask every non-buyer for a referral. | 10 more DMs |
| Sat | Log, thank, and plan Monday. | Updated tracker |

## 7. Tracking

For each warm contact: add a row to `tracker.csv` once they are a pipeline account or when a reply arrives (Source = warm, Stage = Target -> Connected -> Replied...). Keep the raw 1st-degree list in `warm-connections.csv` with columns Score, Tier, Date messaged, Reply, Intro asked, Intro made.

Metrics to watch: DM reply rate (aim 25-35% for warm), intro acceptance rate (aim 30-50%), and meetings booked per 10 DMs (aim 2-3).
