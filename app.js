const tones = {
  friendly: {
    start: "I understand where you are coming from.",
    bridge: "Let us look at this calmly and make the decision based on the right details.",
    close: "I am happy to help you compare the options clearly before you decide."
  },
  casual: {
    start: "Yes, I get what you mean.",
    bridge: "I think it is better that we look at the actual numbers and situation before deciding.",
    close: "Let me help you check it properly so you have a clearer picture."
  },
  professional: {
    start: "Thank you for sharing this with me.",
    bridge: "It is best to assess this based on verified information and the details that apply to your situation.",
    close: "I can help you review the relevant points before we decide on the next step."
  },
  analytical: {
    start: "That is a fair point to review.",
    bridge: "I would separate the headline or concern from the actual data, then compare it against recent transactions, demand and timing.",
    close: "Once we verify the facts, the decision will be much clearer."
  },
  education: {
    start: "This is a good question.",
    bridge: "The main thing to understand is that property decisions should not be based on one headline or one asking price alone. We need to compare it with recent transactions, the unit condition, location, supply and your timeline.",
    close: "I will keep the explanation simple so you can see what really matters."
  },
  negotiation: {
    start: "I understand the concern.",
    bridge: "We can use this point in the discussion, but it should be positioned reasonably and supported with facts so it does not weaken our negotiation.",
    close: "A calm and factual approach usually gives us a better chance of getting a useful response."
  },
  followUp: {
    start: "Just following up on this.",
    bridge: "I wanted to check in and see how you feel after reviewing the details.",
    close: "Let me know what you prefer and I can help you with the next step."
  },
  reassuring: {
    start: "I understand why this may feel uncertain.",
    bridge: "There is no need to rush into a decision based only on one concern. We can review the facts properly and take it step by step.",
    close: "My role is to help you make a clear and comfortable decision."
  },
  concise: {
    start: "Understood.",
    bridge: "Let us verify the key facts first before deciding.",
    close: "I will keep this simple and focus on the next step."
  },
  objection: {
    start: "I understand the concern and it is a fair point to clarify.",
    bridge: "The best way is to address it directly, check the facts and see whether it changes the decision or negotiation strategy.",
    close: "Once we have the right comparison, we can respond with more confidence."
  },
  seller: {
    start: "Here is a quick update from my side.",
    bridge: "The feedback and market response are useful indicators, so we should use them to decide whether to hold, adjust or change the approach.",
    close: "I will continue monitoring the response and advise you on the next practical step."
  },
  passiveAggressive: {
    start: "I can see why that may sound convincing at first glance.",
    bridge: "At the same time, it would be risky to treat one point as the full picture without checking whether the actual numbers support it.",
    close: "It is better that we verify the facts first before drawing a conclusion."
  }
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

function cleanInput(text) {
  return sanitizeReply(text)
    .replace(/^(tell client|tell the client|reply client|reply to client|say that|say)\s+/i, "")
    .replace(/^(that\s+)/i, "")
    .trim();
}

function polishGist(text) {
  return cleanInput(text)
    .replace(/\bwe should not rely on\b/gi, "it is better not to rely on")
    .replace(/\bshould not rely on\b/gi, "it is better not to rely on")
    .replace(/\bwe should check\b/gi, "we can check")
    .replace(/\band should check\b/gi, "and we can check")
    .replace(/\bcheck recent transaction\b/gi, "check recent transactions")
    .replace(/\blatest transaction\b/gi, "latest transactions")
    .replace(/\bcan reduce price\b/gi, "whether there is room to adjust the price")
    .replace(/\bprice too high\b/gi, "the price feels high")
    .replace(/\bbetter check\b/gi, "it is better to check")
    .replace(/\bdon't rush\b/gi, "take some time to review this properly")
    .replace(/\bnot only look at\b/gi, "not rely only on")
    .trim();
}

function sentenceCase(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function hasMarketOrNews(text) {
  return /(article|news|headline|market|interest|rate|cooling|price drop|drop soon)/i.test(text);
}

function hasPriceConcern(text) {
  return /(price|expensive|high|reduce|discount|offer|counter|valuation|cheap)/i.test(text);
}

function hasViewingFollowUp(text) {
  return /(viewing|viewed|visit|appointment|see the unit|after viewing)/i.test(text);
}

function hasEarlyHandover(text) {
  return /(move out|move in|earlier|handover|vacate|lease|property tax|council fee|pro.?rat|waive|gap)/i.test(text);
}

function makeGistMessage(gist) {
  const clean = polishGist(gist);
  if (!clean) return "";
  const ending = /[.!?]$/.test(clean) ? "" : ".";
  return `${sentenceCase(clean)}${ending}`;
}

function makeContextLine(client, draft) {
  const combined = `${client} ${draft}`;
  if (hasEarlyHandover(combined)) {
    return "We have noted the timing on both sides. At this point, the handover is still aligned to the agreed timeline, but we will update you immediately if there is any possibility of an earlier arrangement.";
  }
  if (hasMarketOrNews(combined)) {
    return "I do not want to rely on the headline alone, so I will fact check it against the latest relevant transactions and market context before advising you.";
  }
  if (hasPriceConcern(combined)) {
    return "Before we decide on the price or offer, I will check the latest comparable transactions so the reply is based on facts rather than guessing.";
  }
  if (hasViewingFollowUp(combined)) {
    return "It would be useful to hear your honest thoughts after the viewing so I can guide you on whether this is worth pursuing.";
  }
  return "";
}

function buildEarlyHandoverReply(tone, client, draft, isEmail) {
  const lines = [
    isEmail ? "Hi," : "Hi!",
    "Thanks for the update and for the consideration, really appreciate it.",
    "We have noted the situation on the seller side as well. At this point, the move out date is still aligned to the agreed timeline, but we will definitely keep you posted immediately if there are any changes or if they are able to vacate earlier.",
    "If anything opens up for an earlier handover, we will coordinate closely with both sides so it can be arranged smoothly, including any pro rating adjustments as discussed.",
    tone === tones.followUp ? "Will stay in touch on this." : "We will keep you updated on this.",
    isEmail ? "Best regards," : ""
  ];

  return lines.filter(Boolean);
}

function buildWhatsappReply(tone, client, draft) {
  if (hasEarlyHandover(`${client} ${draft}`)) {
    return buildEarlyHandoverReply(tone, client, draft, false);
  }

  const gistMessage = makeGistMessage(draft);
  const contextLine = makeContextLine(client, draft);

  if (gistMessage) {
    return [tone.start, gistMessage, contextLine, tone.close].filter(Boolean);
  }

  if (client) {
    return [tone.start, contextLine || tone.bridge, tone.close].filter(Boolean);
  }

  return ["Please enter the gist of what you want to reply, then I will help you phrase it naturally."];
}

function buildEmailReply(tone, client, draft) {
  if (hasEarlyHandover(`${client} ${draft}`)) {
    return buildEarlyHandoverReply(tone, client, draft, true);
  }

  const gistMessage = makeGistMessage(draft);
  const contextLine = makeContextLine(client, draft);

  if (gistMessage) {
    return [
      "Hi,",
      tone.start,
      gistMessage,
      contextLine,
      tone.close,
      "Best regards,"
    ].filter(Boolean);
  }

  if (client) {
    return [
      "Hi,",
      tone.start,
      contextLine || tone.bridge,
      tone.close,
      "Best regards,"
    ].filter(Boolean);
  }

  return [
    "Hi,",
    "Please enter the gist of what you want to reply, then I will help you phrase it naturally.",
    "Best regards,"
  ];
}

function buildSubject() {
  const text = `${el("clientMessage").value} ${el("myDraft").value}`.toLowerCase();
  if (/(offer|negotiate|counter|price|reduce|discount)/.test(text)) return "Property Offer and Pricing Discussion";
  if (/(viewing|view|visit|appointment)/.test(text)) return "Property Viewing Follow Up";
  if (/(rent|rental|tenant|lease)/.test(text)) return "Rental Discussion Follow Up";
  if (/(article|news|market|interest|rate)/.test(text)) return "Property Market Update";
  if (/(document|approval|loan|bank|finance)/.test(text)) return "Property Documents and Next Steps";
  return "Property Follow Up";
}

function buildReply() {
  const client = el("clientMessage").value.trim();
  const draft = el("myDraft").value.trim();
  const tone = tones[selectedTone];
  const lines = el("replyLength").value === "email"
    ? buildEmailReply(tone, client, draft)
    : buildWhatsappReply(tone, client, draft);

  return sanitizeReply(lines.join("\n\n"));
}

async function generateReply() {
  const generateButton = el("generateReply");
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  try {
    const response = await fetch("/api/generate-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientMessage: el("clientMessage").value.trim(),
        replyGist: el("myDraft").value.trim(),
        tone: selectedTone,
        format: el("replyLength").value
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to generate reply");

    el("generatedReply").value = sanitizeReply(data.reply || "");
    if (el("replyLength").value === "email") {
      el("emailSubject").value = data.subject || buildSubject();
    }
  } catch (error) {
    el("generatedReply").value = buildReply();
    toast("AI unavailable. Used offline draft.");
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate Reply";
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
