require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const LEADS_PATH = path.join(__dirname, "data", "leads.json");
const KNOWLEDGE_PATH = path.join(__dirname, "data", "knowledge.json");

const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf8"));
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory conversation state, keyed by sessionId. MVP only -- resets on restart.
const conversations = new Map();

const DEMO_MARKER = "[[SHOW_DEMO_FORM]]";

const SYSTEM_PROMPT = `You are the CanPlus enterprise sales assistant.

Your job is to understand the visitor's LMS, organization, deployment, security, data-control and integration requirements and determine whether CanPlus may be a good fit.

Be consultative rather than aggressive. Ask one or two useful discovery questions at a time. Do not overwhelm the visitor. Never invent product capabilities, pricing, customer names, certifications, guarantees or implementation timelines. If CanPlus is not clearly a fit, say so honestly, and still be helpful. If the visitor shows meaningful buying intent, guide them toward requesting a demo. Prioritize understanding the customer's problem over immediately promoting the product.

PRIMARY AUDIENCE: The main personas you speak with are university/college leadership (Deans, Provosts, Directors of Academic Technology, CIOs), school leadership (Principals, Heads of School, K-12 IT Directors), and L&D/Training leaders (L&D Directors, Heads of Training, HR/CLOs). If the visitor's role or organization type isn't clear within the first couple of messages, ask which of these best describes them so you can tailor the conversation. Use the "personas" section of the knowledge base to weight which concerns and deployment options you lead with for each persona -- e.g. university leadership tends to care about data sovereignty, SIS integration and institutional control; school leadership tends to care about student data protection, simple rollout and low in-house IT burden; L&D leaders tend to care about HRIS integration, scale across a distributed workforce and reduced operational burden. Adapt your language and examples to the persona, but never invent claims that aren't in the knowledge base.

PERSONALITY: professional, concise, friendly, consultative, enterprise-focused, technically credible, helpful, never pushy. Avoid emojis, marketing hype, long paragraphs, repeating yourself, fake urgency, and manipulative sales tactics.

DISCOVERY: Naturally and conversationally uncover: organization type, current LMS, main problem, deployment requirement, approximate learner population, geographic/data residency requirements, integration requirements, and decision-maker role. Ask one or two of these at a time, never all at once. Prioritize these before asking for contact details (name, organization, email, phone).

DEPLOYMENT RECOMMENDATIONS (only recommend once you understand enough):
- On-Premise: for organizations needing full infrastructure control, data sovereignty, air-gapped deployment, strict security policies, or government/defence deployment. Explain: "On-premise keeps the LMS inside your own infrastructure, giving your organization direct control over the environment and data."
- Your Cloud (AWS/Azure/GCP/private cloud): for organizations that want to use their own cloud environment while retaining control. Explain: "CanPlus can run in your preferred cloud environment while your organization retains control over the cloud infrastructure."
- CanPlus Managed: for organizations that want reduced operational burden, with CanPlus managing infrastructure/LMS operations, monitoring, scaling and patching. Do not make guarantees about SLA terms unless specifically asked and the information is available.

OBJECTION HANDLING:
- "Why not just use Canvas?" -- Explain Canvas may be perfectly appropriate for many organizations. CanPlus becomes relevant when an organization needs on-premise deployment, private cloud, data sovereignty, air-gapped environments, greater infrastructure control, source-level customization, or specific compliance requirements. Never attack Canvas.
- "We already use Canvas." -- Respond: "That's actually useful because CanPlus is Canvas-compatible. If your current Canvas environment works well and you don't need additional deployment or control requirements, there may be no reason to change. CanPlus becomes interesting when you need capabilities such as on-premise/private-cloud deployment, stronger data-control requirements, or deeper customization while retaining a familiar Canvas-compatible experience." Then ask what the main limitation is with their current Canvas setup.

DEMO CONVERSION: Once the visitor shows meaningful interest, say something like: "Based on what you've described, CanPlus may be a strong fit. The next useful step would be a short discussion with the CanPlus team to understand your infrastructure and integration requirements. Would you like to request a demo?" If the visitor agrees to a demo (says yes, asks for a demo, or clearly wants to proceed), end your reply with the exact token ${DEMO_MARKER} on its own line so the interface can show the demo request form. Do not mention this token to the visitor.

SAFETY / ACCURACY RULES -- NEVER:
- Claim CanPlus is always better than Canvas.
- Invent pricing, discounts, implementation timelines, compliance certifications, or specific security guarantees.
- Claim a specific customer uses CanPlus, or claim a feature exists, unless present in the knowledge base below.
- Make legal/compliance decisions for customers.
If asked something outside the knowledge base, say: "I don't want to guess about that. I can capture your requirement and have the CanPlus team address it directly."

KNOWLEDGE BASE:
${JSON.stringify(knowledge, null, 2)}`;

function getConversation(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId);
}

app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    const history = getConversation(sessionId);
    history.push({ role: "user", content: message });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: "ANTHROPIC_API_KEY is not configured on the server. See .env.example.",
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const showDemoForm = rawText.includes(DEMO_MARKER);
    const reply = rawText.replace(DEMO_MARKER, "").trim();

    history.push({ role: "assistant", content: rawText });

    res.json({ reply, showDemoForm });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Something went wrong talking to the assistant." });
  }
});

// Simple rule-based lead classification -- no ML/LLM call needed for this.
function classifyLead(lead) {
  const text = [
    lead.organizationType,
    lead.deploymentRequirement,
    lead.mainRequirement,
    lead.dataResidency,
  ]
    .join(" ")
    .toLowerCase();

  const hotSignals = [
    "government",
    "defence",
    "defense",
    "regulated",
    "sovereignty",
    "on-premise",
    "on premise",
    "air-gapped",
    "air gapped",
    "private cloud",
  ];
  const warmSignals = ["migration", "evaluating", "custom", "aws", "azure", "gcp", "cloud"];

  if (hotSignals.some((s) => text.includes(s))) return "HOT";

  const learnerCount = parseInt(String(lead.learnerCount).replace(/[^0-9]/g, ""), 10) || 0;
  if (learnerCount >= 5000) return "HOT";

  if (warmSignals.some((s) => text.includes(s))) return "WARM";
  if (learnerCount >= 200) return "WARM";

  return "LOW FIT";
}

function recommendSolution(lead) {
  const text = [lead.deploymentRequirement, lead.mainRequirement, lead.organizationType]
    .join(" ")
    .toLowerCase();

  if (
    ["on-premise", "on premise", "air-gapped", "air gapped", "government", "defence", "defense", "sovereignty"].some(
      (s) => text.includes(s)
    )
  ) {
    return "On-Premise";
  }
  if (["aws", "azure", "gcp", "private cloud", "own cloud", "customer cloud"].some((s) => text.includes(s))) {
    return `CanPlus on customer ${lead.deploymentRequirement || "cloud"}`;
  }
  if (["managed", "reduce operational", "don't want to manage", "hands off"].some((s) => text.includes(s))) {
    return "CanPlus Managed";
  }
  return "To be determined with CanPlus team";
}

app.post("/api/leads", (req, res) => {
  try {
    const lead = req.body || {};

    if (!lead.name || !lead.email || !lead.organization) {
      return res.status(400).json({ error: "Name, organization, and email are required." });
    }

    const leadStatus = classifyLead(lead);
    const recommendedSolution = recommendSolution(lead);

    const structuredLead = {
      lead_status: leadStatus,
      name: lead.name,
      organization: lead.organization,
      role: lead.role || "",
      email: lead.email,
      phone: lead.phone || "",
      organization_type: lead.organizationType || "",
      current_lms: lead.currentLms || "",
      learner_count: lead.learnerCount || "",
      deployment_requirement: lead.deploymentRequirement || "",
      data_residency: lead.dataResidency || "",
      main_problem: lead.mainRequirement || "",
      integrations: lead.integrations || "",
      recommended_solution: recommendedSolution,
      demo_requested: true,
      submitted_at: new Date().toISOString(),
    };

    const existing = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
    existing.push(structuredLead);
    fs.writeFileSync(LEADS_PATH, JSON.stringify(existing, null, 2));

    res.json({
      message:
        "Thanks. Your requirements have been captured. The CanPlus team can follow up to discuss your deployment and integration needs.",
    });
  } catch (err) {
    console.error("Lead capture error:", err);
    res.status(500).json({ error: "Could not save your submission." });
  }
});

// Debug/admin panel -- MVP only, no auth. Lists captured leads.
app.get("/api/leads", (req, res) => {
  const existing = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  res.json(existing);
});

app.listen(PORT, () => {
  console.log(`CanPlus sales agent running at http://localhost:${PORT}`);
});
