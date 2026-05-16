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
        "Write only the ready-to-send reply to the client or co-broke agent.",
        "Use the user's reply gist as the main intention. Rephrase it naturally.",
        "Use the client message as context. Do not copy the client message unless useful.",
        "Do not teach the realtor what to do. Do not explain your reasoning.",
        "Do not say phrases like 'the client appears', 'my view is', 'I would phrase', or 'you should'.",
        "Keep the reply human, warm and natural.",
        "Do not use contractions. Spell words in full.",
        "Avoid hyphenated phrasing.",
        "Avoid comma before 'and'.",
        "If the client shares market news or claims, politely say you will fact check against relevant transactions or verified market context.",
        "If the client is discussing handover, lease gap, move-in, move-out, property tax, council fee, pro-rating, or earlier vacant possession, reply directly about coordinating both sides and updating them if timing changes.",
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
              text: JSON.stringify({
                tone: selectedTone,
                format: selectedFormat,
                clientMessage,
                replyGist
              })
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
