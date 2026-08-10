/* ============================================================================
   EVERY FACTUAL CLAIM ON THIS SITE LIVES IN THIS FILE.
   ----------------------------------------------------------------------------
   canplus.io could not be reached from the build environment, so nothing here
   was scraped from the live site. Each item below came from the project brief.
   Anything carrying `verify: true` asserts a number, a named customer or a
   compliance standard and MUST be checked against canplus.io before this site
   goes live. Descriptive copy (what a module does) carries no such flag.

   Deliberately NOT present anywhere in this file, because nothing supports
   them: customer logos, testimonials, quotes, pricing, awards, partner names,
   certification claims, or any statistic beyond those listed here.
============================================================================ */

export type Verifiable = { verify?: true };

/* ------------------------------------------------------------------ nav/meta */
export const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "AI", href: "#ai" },
  { label: "For Learners", href: "#learners" },
  { label: "Resources", href: "#resources" },
  { label: "Why CanPlus", href: "#why" },
] as const;

export const HERO = {
  eyebrow: "The complete learning ecosystem",
  headline: ["Modern Learning.", "Without Losing Control."],
  body:
    "From AI-powered course creation to hands-on cloud labs, CanPlus connects the entire learning journey in one Canvas-compatible platform — built for institutions that need both modern experiences and control.",
  primaryCta: { label: "Explore the Platform", href: "#platform" },
  secondaryCta: { label: "Book a Demo", href: "#demo" },
  pillars: [
    "Canvas-compatible",
    "AI-powered",
    "Data sovereignty",
    "Flexible deployment",
  ],
};

/* --------------------------------------------------------------- trust stats
   VERIFY: all four numbers. */
export const STATS: (Verifiable & {
  value: number;
  suffix: string;
  label: string;
})[] = [
  { value: 50, suffix: "+", label: "Institutions deployed", verify: true },
  { value: 500, suffix: "K+", label: "Active learners", verify: true },
  { value: 15, suffix: "", label: "Countries", verify: true },
  { value: 100, suffix: "K+", label: "Concurrent learners", verify: true },
];

/* ------------------------------------------------------------ learning journey */
export const JOURNEY = [
  {
    id: "discover",
    stage: "Discover",
    module: "CanPlus Catalogue",
    blurb:
      "Learners browse courses, pathways and skills in one searchable catalogue instead of hunting across systems.",
    points: ["Course discovery", "Learning pathways", "Skill tags"],
  },
  {
    id: "learn",
    stage: "Learn",
    module: "CanPlus LMS + Stage",
    blurb:
      "A Canvas-compatible LMS for structured courses, with CanPlus Stage delivering video and rich media alongside it.",
    points: ["Courses and modules", "Video and media", "Resources and notes"],
  },
  {
    id: "practice",
    stage: "Practice",
    module: "Zenaws Cloud Labs",
    blurb:
      "Hands-on lab environments run beside the course, so learners apply what they just studied on real infrastructure.",
    points: ["Live environments", "Guided tasks", "Practical projects"],
  },
  {
    id: "assess",
    stage: "Assess",
    module: "Assessments + Projects",
    blurb:
      "Assessments and project work measure understanding and applied capability, not just completion.",
    points: ["Quizzes and exams", "Assignments", "Project submissions"],
  },
  {
    id: "achieve",
    stage: "Achieve",
    module: "CanPlus Credentials",
    blurb:
      "Achievements become credentials, badges and certificates learners can show outside the platform.",
    points: ["Certificates", "Badges", "Skill recognition"],
  },
  {
    id: "grow",
    stage: "Grow",
    module: "AI + Learning pathways",
    blurb:
      "AI-supported recommendations and pathways guide learners toward what makes sense next.",
    points: ["Recommendations", "Pathways", "Continued learning"],
  },
] as const;

/* -------------------------------------------------------------------- AI stack */
export const AI_PILLARS = [
  {
    num: "01",
    name: "AI Module Builder",
    blurb: "Turn a simple idea into a structured learning module or course.",
    flow: ["Prompt", "AI", "Course structure"],
  },
  {
    num: "02",
    name: "AI Buddy",
    blurb:
      "Give learners an intelligent assistant that can help them understand, navigate and engage with learning content.",
    flow: ["Question", "Context", "Guided answer"],
  },
  {
    num: "03",
    name: "SmartSearch",
    blurb: "Help learners find the most relevant content faster.",
    flow: ["Query", "Ranking", "Relevant content"],
  },
] as const;

/* Illustrative AI Module Builder output. This is an interface demonstration of
   the described capability, not a claim about a specific CanPlus course. */
export const AI_DEMO = {
  prompt:
    "Create a 6-week Generative AI course for undergraduate students.",
  objectives: [
    "Explain how generative models produce text and images",
    "Apply prompting techniques to practical tasks",
    "Evaluate model output for accuracy and bias",
  ],
  modules: [
    { week: "Week 1–2", title: "Foundations of generative models" },
    { week: "Week 3", title: "Prompting and controllability" },
    { week: "Week 4", title: "Evaluation, bias and limitations" },
    { week: "Week 5", title: "Applied build: a domain assistant" },
    { week: "Week 6", title: "Responsible deployment" },
  ],
  activities: ["Lab: prompt patterns", "Seminar: failure modes", "Peer review"],
  assessments: ["Weekly quizzes", "Applied assignment", "Final project"],
  finalProject: "Ship and document a working generative AI prototype.",
};

/* ------------------------------------------------------------------- learners */
export const LEARNER_BENEFITS = [
  {
    title: "Learn your way",
    body: "Structured courses, media and learning resources in one place.",
  },
  {
    title: "Get help when you need it",
    body: "AI-powered assistance helps learners navigate and understand content.",
  },
  {
    title: "Turn knowledge into skills",
    body: "Hands-on labs and practical projects connect learning to real-world application.",
  },
  {
    title: "Show what you've achieved",
    body: "Credentials, badges and certificates make progress visible.",
  },
] as const;

/* ---------------------------------------------------------------- instructors */
export const INSTRUCTOR_FLOW = [
  "Prompt",
  "Learning objectives",
  "Course structure",
  "Activities",
  "Assessments",
  "Final project",
] as const;

export const INSTRUCTOR_BENEFITS = [
  "Faster course creation",
  "Structured learning design",
  "AI-assisted workflows",
  "Rich media",
  "Assessments",
  "Learner analytics",
] as const;

/* ----------------------------------------------------------------------- labs */
export const LAB_FLOW = [
  "Course",
  "Lab environment",
  "Hands-on practice",
  "Assessment",
  "Skill",
] as const;

/* ---------------------------------------------------------------- credentials */
export const CREDENTIALS = [
  { kind: "Certificate", title: "Cloud Foundations", meta: "Course completion" },
  { kind: "Badge", title: "Applied Prompting", meta: "Skill achievement" },
  { kind: "Learning path", title: "Data Analytics Track", meta: "6 courses" },
  { kind: "Skill", title: "Secure Deployment", meta: "Verified by assessment" },
] as const;

/* ------------------------------------------------------------------- catalogue
   Illustrative course cards only — UI examples, not CanPlus course offerings. */
export const CATALOGUE = [
  { title: "Generative AI", cat: "AI", weeks: 6, level: "Intermediate", skills: ["Prompting", "Evaluation"] },
  { title: "Cloud Computing", cat: "Cloud", weeks: 8, level: "Foundation", skills: ["Compute", "Networking"] },
  { title: "Cybersecurity", cat: "Security", weeks: 10, level: "Intermediate", skills: ["Threat modelling"] },
  { title: "Data Analytics", cat: "Data", weeks: 8, level: "Foundation", skills: ["SQL", "Visualisation"] },
  { title: "Leadership", cat: "Professional", weeks: 4, level: "All levels", skills: ["Coaching"] },
] as const;

export const CATALOGUE_CATEGORIES = ["All", "AI", "Cloud", "Security", "Data", "Professional"] as const;

/* ----------------------------------------------------------------- deployment */
export const DEPLOYMENTS = [
  {
    id: "on-prem",
    name: "On-premise",
    tag: "Maximum control",
    blurb:
      "For institutions requiring maximum infrastructure control and data sovereignty.",
    nodes: ["Institution data centre", "Institution network", "Institution policy"],
  },
  {
    id: "your-cloud",
    name: "Your cloud",
    tag: "AWS / Azure / GCP / Private",
    blurb: "Deploy in the environment you choose.",
    nodes: ["AWS", "Azure", "GCP", "Private cloud"],
  },
  {
    id: "managed",
    name: "CanPlus managed",
    tag: "Operated for you",
    blurb:
      "CanPlus manages deployment, monitoring, scaling and ongoing operations.",
    nodes: ["Managed infrastructure", "Monitoring", "Scaling", "Operations"],
  },
] as const;

export const DEPLOYMENT_MATRIX: {
  row: string;
  values: Record<(typeof DEPLOYMENTS)[number]["id"], string>;
}[] = [
  {
    row: "Infrastructure owner",
    values: { "on-prem": "Institution", "your-cloud": "Institution", managed: "CanPlus" },
  },
  {
    row: "Data residency",
    values: { "on-prem": "Institution-defined", "your-cloud": "Region of your choice", managed: "Agreed with institution" },
  },
  {
    row: "Operations and monitoring",
    values: { "on-prem": "Institution", "your-cloud": "Shared", managed: "CanPlus" },
  },
  {
    row: "Scaling",
    values: { "on-prem": "Institution-provisioned", "your-cloud": "Cloud-elastic", managed: "Managed by CanPlus" },
  },
  {
    row: "Best suited to",
    values: { "on-prem": "Strict sovereignty requirements", "your-cloud": "Existing cloud estates", managed: "Teams without platform ops" },
  },
];

/* --------------------------------------------------------------- integrations */
export const INTEGRATIONS = [
  { name: "LTI 1.3", group: "Learning tools" },
  { name: "SCORM", group: "Content" },
  { name: "xAPI", group: "Content" },
  { name: "SAML", group: "Identity" },
  { name: "OIDC", group: "Identity" },
  { name: "SSO", group: "Identity" },
  { name: "SIS", group: "Institutional systems" },
  { name: "HRIS", group: "Institutional systems" },
  { name: "APIs", group: "Extensibility" },
  { name: "Webhooks", group: "Extensibility" },
] as const;

/* ---------------------------------------------------------------- case studies
   VERIFY: organisation names and every metric. No quotes or testimonials are
   included anywhere, because none were available. */
export const CASE_STUDIES: (Verifiable & {
  org: string;
  sector: string;
  summary: string;
  metrics: { value: string; label: string }[];
})[] = [
  {
    org: "NorthCap University",
    sector: "Higher education",
    summary:
      "A multi-year deployment supporting undergraduate learning across the institution with AI-enabled coursework.",
    metrics: [
      { value: "4,000", label: "Students" },
      { value: "4-year", label: "Engagement" },
      { value: "AI-enabled", label: "Learning" },
    ],
    verify: true,
  },
  {
    org: "Defence Training Academy",
    sector: "Defence",
    summary:
      "Training delivery in an environment where infrastructure control and data residency are operating requirements.",
    metrics: [],
    verify: true,
  },
  {
    org: "Public University Network",
    sector: "Public sector education",
    summary:
      "A shared learning platform serving multiple institutions under common governance and policy.",
    metrics: [],
    verify: true,
  },
  {
    org: "Global Corporate L&D",
    sector: "Enterprise learning",
    summary:
      "Workforce learning connecting structured courses, hands-on practice and credentials across regions.",
    metrics: [],
    verify: true,
  },
];

/* -------------------------------------------------------------------- security
   VERIFY: every standard listed. These are presented as alignment and
   readiness, never as held certifications — do not change that wording
   without written confirmation. */
export const COMPLIANCE: (Verifiable & { name: string; note: string })[] = [
  { name: "GDPR", note: "Data protection", verify: true },
  { name: "PDPA", note: "Data protection", verify: true },
  { name: "FERPA", note: "Student records", verify: true },
  { name: "HIPAA-ready", note: "Health data readiness", verify: true },
  { name: "SOC-aligned", note: "Operational controls", verify: true },
];

/* ------------------------------------------------------------------ solutions */
export const SOLUTIONS = [
  { name: "Universities", blurb: "Degree programmes at institutional scale." },
  { name: "K12", blurb: "Structured learning for school systems." },
  { name: "Enterprise", blurb: "Workforce capability and compliance training." },
  { name: "Government", blurb: "Public sector programmes under policy control." },
  { name: "Defence", blurb: "Training where sovereignty is a requirement." },
  { name: "Training providers", blurb: "Commercial course delivery and credentials." },
] as const;

/* ---------------------------------------------------------------------- why */
export const WHY = [
  { title: "Canvas-compatible experience", body: "Keep the familiar Canvas workflow instructors and learners already know." },
  { title: "Deployment freedom", body: "On-premise, your cloud, or fully managed by CanPlus." },
  { title: "Data sovereignty", body: "Keep control over where data lives and which policies apply." },
  { title: "AI-powered workflows", body: "AI in course creation, learner support and discovery." },
  { title: "Enterprise integrations", body: "LTI, SCORM, xAPI, SSO, SIS and HRIS connectivity." },
  { title: "Hands-on labs", body: "Practice on real environments through Zenaws integration." },
  { title: "Credentials", body: "Certificates, badges and visible skill recognition." },
  { title: "Scalability", body: "Built for large concurrent learner populations." },
] as const;

/* -------------------------------------------------------------------- footer */
export const FOOTER = {
  Platform: ["LMS", "AI Stack", "Catalogue", "Stage", "Credentials", "Labs"],
  Solutions: ["Universities", "K12", "Enterprise", "Government", "Defence", "Training Providers"],
  Resources: ["Case Studies", "Why CanPlus", "Deployment", "Contact"],
  Company: ["About", "Contact", "Privacy", "Terms"],
} as const;
