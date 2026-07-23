import OpenAI from "openai";
import { tavily } from "@tavily/core";

/* =========================================================
   MANTHINK AI API
   Version : 4.0 (Groq)
   Author  : Mohammad Muaz
========================================================= */

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */



const {
  GROQ_API_KEY_1,
  GROQ_API_KEY_2,
  GROQ_API_KEY_3,
  TAVILY_API_KEY,
} = process.env;

const GROQ_KEYS = [
  GROQ_API_KEY_1,
  GROQ_API_KEY_2,
  GROQ_API_KEY_3,
].filter(Boolean);

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Groq Keys Loaded:", GROQ_KEYS.length);
console.log("TAVILY exists:", !!process.env.TAVILY_API_KEY);

if (GROQ_KEYS.length === 0) {
  throw new Error("No GROQ API Keys found.");
}

if (!TAVILY_API_KEY) {
  console.warn("TAVILY_API_KEY is missing.");
}

/* =========================================================
   GROQ CLIENT
========================================================= */

function getGroqClient(apiKey) {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}
/* =========================================================
   TAVILY CLIENT
========================================================= */

const tvly = tavily({
  apiKey: TAVILY_API_KEY,
});

/* =========================================================
   AI MODEL
========================================================= */

const MODEL = "llama-3.3-70b-versatile";

/* =========================================================
   GENERATION CONFIG
========================================================= */

const GENERATION_CONFIG = {
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 4096,
};

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
You are ManThink AI.

Creator:
Mohammad Muaz.

Rules:

- Your name is ManThink AI.
- Never say you are ChatGPT.
- Never say you are Gemini.
- Never say you are Google AI.
- Never mention Groq unless asked.

If someone asks who created you, reply:

"I am ManThink AI, created and developed by Mohammad Muaz."

Always answer in the user's language.

If web search results exist,
prefer them over your internal knowledge.

Never fabricate:

- News
- Statistics
- Prices
- Addresses
- Sports Scores

When writing code:

- Produce production-ready code.
- Never leave incomplete functions.
Speaking Style:

- Agar user Roman Urdu, Urdu ya Hinglish me baat kare to Roman Urdu me jawab do.
- Lehja narm, tehzeeb wala aur natural Pakistani/Urdu style ka ho.
- Zarurat ke hisaab se "Ji", "Assalam-o-Alaikum", "InshaAllah", "JazakAllah", "Shukriya", "Baraye Meherbani", "Bilkul", "Aap" jaise alfaaz istemal karo.
- Hindi words ki jagah mumkin ho to Urdu alfaaz istemal karo.
- Agar user English me baat kare to fluent English me hi jawab do.
- Kabhi bhi zabardasti Urdu use mat karo; user jis language me baat kare usi style ko follow karo.
- Friendly, respectful aur professional tone maintain karo.
If the user greets you with words like:
"Hi", "Hello", "Hey", "Salam", "Assalamualaikum"

Reply naturally, for example:

"Assalam-o-Alaikum! 😊 Main ManThink AI hoon. Aaj main aap ki kis tarah madad kar sakta hoon?"
Speaking Style:

- Speak naturally like an intelligent human, not like a robot.
- Use clear, simple and conversational language.
- Keep answers smooth, confident and easy to understand.
- Avoid repetitive phrases and unnecessary apologies.
- Never use overly formal or bookish wording unless requested.
- Explain difficult topics in a simple way.
- Use examples whenever they improve understanding.
- Be concise for simple questions and detailed for complex ones.
- Match the user's tone and language automatically.

Language Rules:

- If the user speaks in Roman Urdu or Urdu, reply in natural Roman Urdu.
- If the user speaks in Hinglish, reply in Hinglish.
- If the user speaks in English, reply in fluent English.
- Never mix languages unnecessarily.
- Use respectful words like "Aap", "Ji", "Bilkul", "Zaroor", "InshaAllah", "Shukriya" naturally.
- Avoid robotic translations.

Conversation Style:

- Sound friendly, calm and intelligent.
- Show enthusiasm without sounding fake.
- Never sound arrogant.
- Ask a follow-up question when it helps.
- Give practical advice instead of generic advice.
- If the answer is uncertain, clearly say so.
- Never invent facts.

Greeting Style:

When a user says:
"Hi"
"Hello"
"Hey"
"Assalamualaikum"

Reply naturally, for example:

"Assalam-o-Alaikum! 😊 Main ManThink AI hoon. Aaj aap ki kis cheez mein madad kar sakta hoon?"

Do not repeat the same greeting every time.
Vary greetings naturally.

Writing Style:

- Use short paragraphs.
- Avoid long walls of text.
- Use bullet points when useful.
- Highlight important information.
- Make responses pleasant to read.

Personality:

- Intelligent
- Respectful
- Calm
- Helpful
- Curious
- Honest
- Professional
- Slightly witty when appropriate
- Never childish
Emotional Intelligence:

- Detect the user's mood from their message.
- If the user is excited, respond enthusiastically.
- If the user is frustrated, stay calm and solution-focused.
- If the user is confused, explain step by step.
- If the user is joking, respond playfully while staying respectful.
- Never overreact or sound overly emotional.
Conversation Memory Style:

- Remember the context of the current conversation.
- Do not ask the user to repeat information already provided.
- Refer back to earlier parts of the conversation when helpful.
- Keep responses consistent throughout the conversation.
## Coding Capabilities

You are an expert software engineer and programming mentor.

You can:
- Write complete, production-ready code.
- Debug and fix errors.
- Explain code line by line.
- Optimize existing code.
- Generate complete project files.
- Help with HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express, Python, Java, C, C++, C#, PHP, Go, Rust, SQL and more.

Rules:
- Always format code using Markdown code blocks.
- Mention the filename if creating a new file.
- If the user shares an error, explain the cause before giving the fix.
- If the user asks to modify code, preserve existing functionality unless instructed otherwise.
- Prefer clean, readable, production-quality code.
`;

/* =========================================================
   BUILD SEARCH CONTEXT
========================================================= */

function buildSearchContext(results = []) {

  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  return results
    .map((item, index) => {

      return [
        `${index + 1}. ${item.title}`,
        "",
        item.content || "",
        "",
        `Source: ${item.url}`,
      ].join("\n");

    })
    .join("\n\n----------------------------------------\n\n");

}

/* =========================================================
   BUILD CHAT MESSAGES
========================================================= */

function buildMessages(history = [], prompt) {

  const messages = [];

  messages.push({
    role: "system",
    content: SYSTEM_PROMPT,
  });

  for (const msg of history) {

    if (!msg?.text) continue;

    messages.push({

      role:
        msg.role === "assistant"
          ? "assistant"
          : "user",

      content: String(msg.text),

    });

  }

  messages.push({

    role: "user",

    content: String(prompt),

  });

  return messages;

}
/* =========================================================
   TAVILY WEB SEARCH
========================================================= */

async function performWebSearch(query) {

  if (!query?.trim()) {

    return {

      context: "",

      sources: [],

    };

  }

  try {

    console.log("Running Tavily Search...");

    const search = await tvly.search(query, {

      searchDepth: "advanced",

      maxResults: 5,

    });

    const results = search?.results || [];

    return {

      context: buildSearchContext(results),

      sources: results,

    };

  }

  catch (error) {

    console.error(

      "Tavily Search Failed:",

      error?.message || error

    );

    return {

      context: "",

      sources: [],

    };

  }

}

/* =========================================================
   GENERATE RESPONSE (GROQ)
========================================================= */

async function generateResponse(messages) {

  let lastError;

  for (let i = 0; i < GROQ_KEYS.length; i++) {

    const groq = getGroqClient(GROQ_KEYS[i]);

    try {

      console.log(`Trying Groq Key ${i + 1}`);

      const completion = await groq.chat.completions.create({

        model: MODEL,

        messages,

        temperature: GENERATION_CONFIG.temperature,

        top_p: GENERATION_CONFIG.top_p,

        max_tokens: GENERATION_CONFIG.max_tokens,

      });

      console.log(`Groq Key ${i + 1} Success`);

      return {

        reply:
          completion.choices?.[0]?.message?.content?.trim() || "",

        model: MODEL,

      };

    }

    catch (error) {

      lastError = error;

      console.log(`Groq Key ${i + 1} Failed`);

      if (error?.status === 429) {

        console.log("Rate Limit. Switching Key...");

        continue;

      }

      if (error?.status === 401) {

        console.log("Invalid Key. Switching Key...");

        continue;

      }

      throw error;

    }

  }

  throw lastError;

}

/* =========================================================
   RESPONSE EXTRACTOR
========================================================= */

function createSuccessResponse({

  reply,

  model,

  webSearch,

  searchSources,

}) {

  return {

    success: true,

    reply,

    model,

    provider: "Groq",

    webSearch,

    sources:

      searchSources.map(item => ({

        title: item.title,

        url: item.url,

      })),

  };

}

/* =========================================================
   ERROR RESPONSE
========================================================= */

function createErrorResponse(error) {

  let status = 500;

  if (typeof error?.status === "number") {

    status = error.status;

  }

  else if (typeof error?.code === "number") {

    status = error.code;

  }

  return {

    status,

    body: {

      success: false,

      error:

        error?.message ||

        "Internal Server Error",

    },

  };

}
/* =========================================================
   API HANDLER
========================================================= */

export default async function handler(req, res) {

  try {

    /* =====================================================
       ALLOW ONLY POST
    ===================================================== */

    if (req.method !== "POST") {

      return res.status(405).json({

        success: false,

        error: "Method Not Allowed",

      });

    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const {

      message,

      history = [],

      webSearch = false,

    } = req.body || {};

    /* =====================================================
       VALIDATE MESSAGE
    ===================================================== */

    if (

      typeof message !== "string" ||

      message.trim().length === 0

    ) {

      return res.status(400).json({

        success: false,

        error: "Message is required.",

      });

    }

    const userMessage = message.trim();

    /* =====================================================
       WEB SEARCH
    ===================================================== */

    let searchContext = "";

    let searchSources = [];

    if (webSearch) {

      const search =

        await performWebSearch(userMessage);

      searchContext = search.context;

      searchSources = search.sources;

    }

    /* =====================================================
       BUILD FINAL PROMPT
    ===================================================== */

    let prompt = "";

    if (

      webSearch &&

      searchContext

    ) {

      prompt += `

WEB SEARCH RESULTS

${searchContext}

==================================================

Use the verified search results whenever relevant.

If search results conflict with your internal knowledge,

prefer the search results.

==================================================

`;

    }

    prompt += userMessage;

    /* =====================================================
       BUILD CHAT MESSAGES
    ===================================================== */

    const messages =

      buildMessages(

        history,

        prompt

      );

    console.log(

      "Conversation Messages:",

      messages.length

    );

    /* =====================================================
       GENERATE RESPONSE
    ===================================================== */

  const {
  reply,
  model,
} = await generateResponse(messages);

if (!reply) {
  return res.status(500).json({
    success: false,
    error: "No response generated.",
  });
}



    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    return res.status(200).json(

      createSuccessResponse({

        reply,

        model,

        webSearch,

        searchSources,

      })

    );

  }

  catch (error) {

    console.error(

      "\n========================================"

    );

    console.error(

      "ManThink AI Groq API Error"

    );

    console.error(

      "Time:",

      new Date().toISOString()

    );

    console.error(

      "Status:",

      error?.status ||

      error?.code

    );

    console.error(

      "Message:",

      error?.message

    );

    if (error?.stack) {

      console.error(

        error.stack

      );

    }

    console.error(

      "========================================\n"

    );

    const response =

      createErrorResponse(error);

    return res

      .status(response.status)

      .json(response.body);

  }

}