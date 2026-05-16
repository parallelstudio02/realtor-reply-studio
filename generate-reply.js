import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const toneGuide = {
  friendly: "warm, natural, appreciative and easy to reply to",
  casual: "relaxed, conversational and suitable for WhatsApp",
  professional: "polished, composed and client ready",
  analytical: "clear, factual and practical without sounding cold",
  education: "explanatory, simple and helpful without sounding like a lecture",
  negotiation: "strategic, calm and careful with wording",
  followUp: "gentle, clear and not pushy",
  reassuring: "calm, supportive and confidence building",
  concise: "short, direct and easy to send",
  objection: "respectful, balanced and focused on resolving the concern",
  seller: "practical seller update style with clear next steps",
  passiveAggressive: "polite but slightly pointed, never rude"
};

function cleanOutput(text) {
  return text
    .replace(/\bI'm\b/g, "I am")
    .replace(/\bI've\b/g, "I have")
    .replace(/\bI'll\b/g, "I will")
    .replace(/\bI'd\b/g, "I would")
    .replace(/\byou're\b/gi, "you are")
    .replace(/\byou'll\b/gi, "you will")
    .replace(/\bthat's\b/gi, "that is")
    .replace(/\bit's\b/gi, "it is")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bdoesn't\b/gi, "does not")
    .replace(/\bdidn't\b/gi, "did not")
    .replace(/\bisn't\b/gi, "is not")
    .replace(/\baren't\b/gi, "are not")
    .replace(/\bwouldn't\b/gi, "would not")
    .replace(/\bcouldn't\b/gi, "could not")
    .replace(/\bshouldn't\b/gi, "should not")
    .replace(/[‐‑‒–—]/g, " ")
    .replace(/,\s+and\b/gi, " and")
    .replace(/[ \t]+/g, " ")
    .replace(/\s([,.!?])/g, "$1")
    .trim();
}

function buildSubject(replyGist, clientMessage) {
  const text = `${replyGist} ${clientMessage}`.toLowerCase();
  if (/(handover|move in|move out|vacate|lease)/.test(text)) return "Handover Timeline Update";
  if (/(offer|negotiate|counter|price|reduce|discount)/.test(text)) return "Property Offer and Pricing Discussion";
  if (/(viewing|view|visit|appointment)/.test(text)) return "Property Viewing Follow Up";
  if (/(rent|rental|tenant|lease)/.test(text)) return "Rental Discussion Follow Up";
  if (/(article|news|market|interest|rate)/.test(text)) return "Property Market Update";
  if (/(document|approval|loan|bank|finance)/.test(text)) return "Property Documents and Next Steps";
  return "Property Follow Up";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel environment variables." });
  }

  try {
    const { clientMessage = "", replyGist = "", tone = "friendly", format = "whatsapp" } = req.body || {};
    const selectedTone = toneGuide[tone] || toneGuide.friendly;
    const selectedFormat = format === "email" ? "email" : "whatsapp";

    const response = await client.responses.create({
      model: "gpt-5.2",
      instructions: [
        "You are a Singapore realtor reply assistant.",
        "Your job is to write a ready-to-send reply to the client or co-broke agent.",
        "The replyGist is NOT text to copy. It is messy internal notes from the realtor.",
        "Infer the intention from replyGist, then write a polished reply from scratch.",
        "Do not copy the replyGist sentence structure.",
        "Do not keep rough note phrases such as 'tell client', 'ask her', 'check with them', 'say that', 'we will check on it', or 'reply them'.",
        "Use the clientMessage as conversation context. Do not copy the clientMessage unless quoting a short necessary detail.",
        "Do not teach the realtor what to do. Do not explain your reasoning.",
        "Do not say phrases like 'the client appears', 'my view is', 'I would phrase', or 'you should'.",
        "Do not add unrelated market, price, transaction, or valuation advice unless the clientMessage or replyGist is specifically about those topics.",
        "Keep the reply human, warm and natural.",
        "Do not use contractions. Spell words in full.",
        "Avoid hyphenated phrasing.",
        "Avoid comma before 'and'.",
        "If the client shares market news or claims, politely say you will fact check against relevant transactions or verified market context.",
        "If the client is discussing handover, lease gap, move-in, move-out, property tax, council fee, pro-rating, or earlier vacant possession, reply directly about coordinating both sides and updating them if timing changes.",
        "Example behavior: If clientMessage says the buyer has a two week lease gap and asks for earlier handover, and replyGist says 'thank them, seller timeline still same, update if can vacate earlier, coordinate both sides and pro rate adjustments', the reply should sound like: 'Hi! Thanks for the update and for the consideration, really appreciate it. We have noted the situation on the seller side as well. At this point, the move out date is still aligned to the agreed timeline, but we will definitely keep you posted immediately if there are any changes or if they manage to vacate earlier. If anything opens up for an earlier handover, we will coordinate closely with both sides so it can be arranged smoothly, including any pro rating adjustments as discussed. Will stay in touch on this.'",
        selectedFormat === "email"
          ? "Format as an email body. Start with 'Hi,' and end with 'Best regards,'."
          : "Format as a WhatsApp message. No email subject. Keep it concise but complete."
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Tone to use: ${selectedTone}`,
                `Format to use: ${selectedFormat}`,
                "Client message or context:",
                clientMessage || "(No client message provided)",
                "Realtor rough gist, use as intent only and rewrite from scratch:",
                replyGist || "(No rough gist provided)"
              ].join("\n\n")
            }
          ]
        }
      ],
      text: {
        verbosity: selectedFormat === "email" ? "medium" : "low"
      }
    });

    const reply = cleanOutput(response.output_text || "");
    return res.status(200).json({
      reply,
      subject: selectedFormat === "email" ? buildSubject(replyGist, clientMessage) : ""
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to generate reply.",
      detail: error?.message || "Unknown error"
    });
  }
}
