const tones = {
  friendly: {
    opener: "I understand where you are coming from",
    angle: "warm and easy to reply to",
    close: "Let me help you look at this calmly so you can decide with confidence."
  },
  casual: {
    opener: "Yes, I get what you mean",
    angle: "simple and conversational",
    close: "I will help you compare this properly before you make the next move."
  },
  professional: {
    opener: "Thank you for sharing this with me",
    angle: "polished and measured",
    close: "I can prepare the relevant comparison so the next decision is based on facts."
  },
  analytical: {
    opener: "That is a fair point to review",
    angle: "data led and practical",
    close: "The useful next step is to compare this against recent transactions, supply, demand, and your timeline."
  },
  education: {
    opener: "This is a good question, and it is worth breaking it down clearly",
    angle: "educational and easy to understand",
    close: "I will explain the key points in plain language so you can see what matters and what is just noise."
  },
  negotiation: {
    opener: "I hear your concern, and we can use it carefully in the negotiation",
    angle: "strategic and calm",
    close: "My suggestion is to keep the message reasonable, support it with facts, and leave room for the other side to respond."
  },
  followUp: {
    opener: "Just following up on this",
    angle: "gentle and clear",
    close: "Let me know what you prefer, and I can help you take the next step from here."
  },
  reassuring: {
    opener: "I understand why this may feel uncertain",
    angle: "calm, supportive and steady",
    close: "We can take this step by step and avoid rushing into the wrong decision."
  },
  concise: {
    opener: "Understood",
    angle: "short, direct and easy to send",
    close: "I will keep this simple and focused on the next step."
  },
  objection: {
    opener: "I understand the concern, and that is a fair point to clarify",
    angle: "balanced, respectful and focused on resolving the objection",
    close: "The best way forward is to acknowledge the concern, address it with facts and suggest a practical next step."
  },
  seller: {
    opener: "Here is a clear update from my side",
    angle: "seller focused and practical",
    close: "My recommendation is to use the feedback and market response to decide the next adjustment carefully."
  },
  passiveAggressive: {
    opener: "I can see why that may sound convincing at first glance",
    angle: "polite, pointed, and controlled",
    close: "Before we treat that as the full picture, it is better to check whether the actual numbers support the same conclusion."
  }
};

const samples = {
  news: "The client appears to be reacting to market news or an article. Acknowledge the concern, separate headline from facts, and bring the discussion back to their actual property, budget, and timing.",
  price: "The client appears concerned about price. Acknowledge the concern, explain that online prices are only a starting point, and suggest checking recent comparable transactions before deciding.",
  delay: "The client appears hesitant. Reassure them, avoid pressure, and suggest one simple next step.",
  offer: "The client appears to be discussing an offer or negotiation. Keep the reply calm, factual, and focused on strategy.",
  general: "The client needs a clear and natural reply. Acknowledge their point and move the conversation forward."
};

const el = (id) => document.getElementById(id);
let selectedTone = "friendly";

function sanitizeReply(text) {
  const replacements = {
    "I'm": "I am",
    "I've": "I have",
    "I'll": "I will",
    "I'd": "I would",
    "you're": "you are",
    "You've": "You have",
    "you'll": "you will",
    "you'd": "you would",
    "that's": "that is",
    "it's": "it is",
    "there's": "there is",
    "what's": "what is",
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "let's": "let us"
  };

  let output = text;
  Object.entries(replacements).forEach(([from, to]) => {
    output = output.replace(new RegExp(from, "gi"), (match) => {
      return match[0] === match[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
    });
  });

  return output
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/[‐‑‒–—-]/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/,\s+and\b/gi, " and")
        .replace(/\s([,.!?])/g, "$1")
        .trim()
    )
    .filter(Boolean)
    .join("\n\n");
}

function summarize(text, limit = 230) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).replace(/\s+\S*$/, "")}...`;
}

function detectScenario(clientText) {
  const text = clientText.toLowerCase();
  if (/(article|news|headline|market|interest|rate|cooling|price drop|drop soon)/.test(text)) return samples.news;
  if (/(price|expensive|high|cheap|reduce|discount|valuation|online|propertyguru)/.test(text)) return samples.price;
  if (/(wait|think|consider|not sure|hesitat|later|delay)/.test(text)) return samples.delay;
  if (/(offer|negotiate|counter|owner|seller|buyer|accept)/.test(text)) return samples.offer;
  return samples.general;
}

function buildWhatsAppReply(tone, client, draft, scenario) {
  if (!client && draft) {
    return [
      `${tone.opener}.`,
      `I would phrase it this way: ${summarize(draft, 220)}`,
      `Keep the message ${tone.angle}.`,
      tone.close
    ];
  }

  return [
    `${tone.opener}.`,
    client ? `From what you shared, I would not react too quickly to only one point. ${summarize(client, 150)}` : "",
    draft ? `I would keep your message this way: ${summarize(draft, 150)}` : "",
    scenario,
    tone.close
  ].filter(Boolean);
}

function buildEmailReply(tone, client, draft, scenario) {
  return [
    `Hi,`,
    `${tone.opener}.`,
    client ? `I understand the point you are raising: ${summarize(client, 240)}` : "",
    draft ? `I would phrase the reply this way: ${summarize(draft, 260)}` : "",
    `My view is to keep the reply ${tone.angle}. ${scenario}`,
    `This way, the reply stays human, clear, and grounded in what is relevant to the property decision.`,
    tone.close,
    `Best regards,`
  ].filter(Boolean);
}

function buildSubject() {
  const text = `${el("clientMessage").value} ${el("myDraft").value}`.toLowerCase();
  if (/(offer|negotiate|counter|price|reduce|discount)/.test(text)) return "Property Offer and Pricing Discussion";
  if (/(viewing|view|visit|appointment)/.test(text)) return "Property Viewing Follow Up";
  if (/(rent|rental|tenant|landlord|lease)/.test(text)) return "Rental Discussion Follow Up";
  if (/(article|news|market|interest|rate)/.test(text)) return "Property Market Update";
  if (/(document|approval|loan|bank|finance)/.test(text)) return "Property Documents and Next Steps";
  return "Property Follow Up";
}

function buildReply() {
  const client = el("clientMessage").value.trim();
  const draft = el("myDraft").value.trim();
  const tone = tones[selectedTone];
  const scenario = detectScenario(`${client} ${draft}`);
  const lines = el("replyLength").value === "email"
    ? buildEmailReply(tone, client, draft, scenario)
    : buildWhatsAppReply(tone, client, draft, scenario);

  return sanitizeReply(lines.join("\n\n"));
}

function generateReply() {
  el("generatedReply").value = buildReply();
  if (el("replyLength").value === "email") {
    el("emailSubject").value = buildSubject();
  }
}

function toast(message) {
  const note = document.createElement("div");
  note.className = "toast";
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 1600);
}

async function copyText(text, message) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  toast(message);
}

document.querySelectorAll(".tone-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tone-chip").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedTone = button.dataset.tone;
  });
});

el("generateReply").addEventListener("click", generateReply);
el("copyReply").addEventListener("click", () => copyText(el("generatedReply").value, "Reply copied"));
el("replyLength").addEventListener("change", () => {
  const isEmail = el("replyLength").value === "email";
  el("subjectField").hidden = !isEmail;
  if (isEmail && !el("emailSubject").value.trim()) {
    el("emailSubject").value = buildSubject();
  }
});
el("clearAll").addEventListener("click", () => {
  ["clientMessage", "myDraft", "generatedReply", "emailSubject"].forEach((id) => {
    el(id).value = "";
  });
});
