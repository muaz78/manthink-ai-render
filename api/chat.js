import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { PDFParse } from "pdf-parse";

/* =========================================================
   MANTHINK AI API
   Version : 5.0
   Multi Model + Vision + File Support
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
console.log("TAVILY exists:", !!TAVILY_API_KEY);


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

const tvly = TAVILY_API_KEY
  ? tavily({
      apiKey: TAVILY_API_KEY,
    })
  : null;


/* =========================================================
   MODELS
========================================================= */

const MODELS = {

  // Normal conversation / coding / text files
  text: "openai/gpt-oss-120b",

  // Screenshots / images
  vision: "qwen/qwen3.6-27b",

};


/* =========================================================
   LIMITS
========================================================= */

// Keep browser -> server JSON requests under control.

const MAX_ATTACHMENTS = 5;

const MAX_IMAGES = 3;

// Base64 increases request size, so keep this conservative.
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

// Text/code file limit
const MAX_TEXT_FILE_SIZE = 1 * 1024 * 1024;


/* =========================================================
   GENERATION CONFIG
========================================================= */

const GENERATION_CONFIG = {

  temperature: 0.7,

  top_p: 0.95,

  max_tokens: 2048,

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

- When he asks who is abdullah, say:
"Abdullah dhor is a good person."
His name is "abdullah dhor".

- When he asks who is raziullah, say:
"Raziullah dhor is good person."
His name is "raziullah dhor".

- They both are good people and friends.

If someone asks who created you, reply:

"I am ManThink AI, created and developed by Mohammad Muaz."

Always answer in the user's language.

If web search results exist,
prefer them over internal knowledge when relevant.

Never fabricate:
- News
- Statistics
- Prices
- Addresses
- Sports scores

Speaking Style:

- If the user uses Roman Urdu or Hinglish, reply naturally in the same style.
- If the user speaks English, reply in fluent English.
- Match the user's language automatically.
- Be friendly, respectful, calm and professional.
- Avoid robotic wording.
- Avoid unnecessary apologies.
- Explain difficult topics simply.
- Use examples when useful.
- Be concise for simple questions and detailed for complex questions.
- Never invent facts.
- If uncertain, clearly say so.

Writing Style:

- Use short readable paragraphs.
- Use bullet points when useful.
- Highlight important information where appropriate.
- Avoid unnecessary walls of text.

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

Conversation:

- Remember the context provided in the conversation history.
- Do not ask the user to repeat information already provided.
- Refer to previous messages when useful.
- Keep responses consistent.

Coding Capabilities:

You are an expert software engineer and programming mentor.

You can:
- Write complete production-ready code.
- Debug errors.
- Explain code.
- Optimize existing code.
- Generate project files.
- Help with HTML, CSS, JavaScript, TypeScript, React,
  Next.js, Node.js, Express, Python, Java, C, C++, C#,
  PHP, Go, Rust, SQL and more.

Coding Rules:

- Always format code using Markdown code blocks.
- Mention filenames when creating files.
- If the user shares an error, explain the cause before the fix.
- Preserve existing functionality unless asked otherwise.
- Prefer clean and readable production-quality code.

Attachment Rules:

- When uploaded files are provided, inspect their contents before answering.
- When an image or screenshot is provided, analyze what is actually visible.
- Do not pretend to see an attachment that was not successfully provided.
- If code files are uploaded, use their actual contents when debugging.
CRITICAL RESPONSE RULE:

Return only the final answer intended for the user.

Never output:
- internal reasoning
- chain of thought
- thinking process
- hidden analysis
- planning steps
- draft reasoning
- self-evaluation
- instruction analysis

Do not write phrases such as:
"Here's a thinking process"
"Analyze User Input"
"Check Against Rules"
"Draft Response"
"Final check"

Think internally and output only the final user-facing answer.
`;


/* =========================================================
   MODEL ROUTER
========================================================= */

function selectModel(attachments = []) {

  const hasImage = attachments.some(
    attachment =>
      String(attachment?.type || "")
        .toLowerCase()
        .startsWith("image/")
  );

  return hasImage
    ? MODELS.vision
    : MODELS.text;

}


/* =========================================================
   FILE HELPERS
========================================================= */

function getBase64Payload(data = "") {

  if (typeof data !== "string") {
    return "";
  }

  const commaIndex = data.indexOf(",");

  if (commaIndex === -1) {
    return data;
  }

  return data.slice(commaIndex + 1);

}


function isTextAttachment(attachment) {

  const type =
    String(attachment?.type || "")
      .toLowerCase();

  const name =
    String(attachment?.name || "")
      .toLowerCase();


  if (type.startsWith("text/")) {
    return true;
  }


  const supportedExtensions = [
    ".txt",
    ".md",
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".json",
    ".xml",
    ".csv",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".php",
    ".go",
    ".rs",
    ".sql",
    ".yaml",
    ".yml",
    ".env",
    ".sh",
    ".bat",
    ".ps1",
  ];


  return supportedExtensions.some(
    extension => name.endsWith(extension)
  );

}

function isPdfAttachment(attachment) {

  const type =
    String(attachment?.type || "")
      .toLowerCase();

  const name =
    String(attachment?.name || "")
      .toLowerCase();

  return (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  );
}

/* =========================================================
   VALIDATE ATTACHMENTS
========================================================= */

function validateAttachments(attachments = []) {

  if (!Array.isArray(attachments)) {
    throw new Error("Attachments must be an array.");
  }


  if (attachments.length > MAX_ATTACHMENTS) {

    throw new Error(
      `Maximum ${MAX_ATTACHMENTS} attachments allowed.`
    );

  }


  const imageCount =
    attachments.filter(
      attachment =>
        String(attachment?.type || "")
          .startsWith("image/")
    ).length;


  if (imageCount > MAX_IMAGES) {

    throw new Error(
      `Maximum ${MAX_IMAGES} images allowed per message.`
    );

  }


  for (const attachment of attachments) {

    if (!attachment || typeof attachment !== "object") {
      throw new Error("Invalid attachment.");
    }


    if (typeof attachment.data !== "string") {
      throw new Error(
        `Attachment data missing for ${
          attachment.name || "file"
        }.`
      );
    }


    const size =
      Number(attachment.size || 0);


    const type =
      String(attachment.type || "");


    if (
      type.startsWith("image/") &&
      size > MAX_IMAGE_SIZE
    ) {

      throw new Error(
        `${attachment.name || "Image"} is too large. ` +
        "Maximum image size is 3 MB."
      );

    }


    if (
      isTextAttachment(attachment) &&
      size > MAX_TEXT_FILE_SIZE
    ) {

      throw new Error(
        `${attachment.name || "File"} is too large. ` +
        "Maximum text/code file size is 1 MB."
      );

    }

  }

}


/* =========================================================
   EXTRACT TEXT / CODE FILES
========================================================= */

function extractTextAttachments(attachments = []) {

  const files = [];


  for (const attachment of attachments) {

    if (!isTextAttachment(attachment)) {
      continue;
    }


    try {

      const base64 =
        getBase64Payload(attachment.data);


      const buffer =
        Buffer.from(base64, "base64");


      const text =
        buffer.toString("utf8");


      files.push({

        name:
          String(
            attachment.name || "uploaded-file"
          ),

        type:
          String(
            attachment.type || "text/plain"
          ),

        text,

      });

    }

    catch (error) {

      console.error(
        "Attachment extraction failed:",
        attachment?.name,
        error?.message || error
      );

    }

  }


  return files;

}

/* =========================================================
   EXTRACT PDF FILES
========================================================= */

async function extractPdfAttachments(attachments = []) {

  const files = [];

  for (const attachment of attachments) {

    if (!isPdfAttachment(attachment)) {
      continue;
    }

    let parser = null;

    try {

      const base64 =
        getBase64Payload(attachment.data);

      const buffer =
        Buffer.from(base64, "base64");


      // Parse PDF
      parser = new PDFParse({
        data: buffer
      });

      const result =
        await parser.getText();


      const text =
        String(result?.text || "")
          .trim();


      if (!text) {

        files.push({
          name:
            String(
              attachment.name || "document.pdf"
            ),

          type: "application/pdf",

          text:
            "[No readable text was found in this PDF.]"
        });

        continue;
      }


      files.push({

        name:
          String(
            attachment.name || "document.pdf"
          ),

        type: "application/pdf",

        text

      });

    } catch (error) {

      console.error(
        "PDF extraction failed:",
        attachment?.name,
        error?.message || error
      );

      throw new Error(
        `Could not read PDF: ${
          attachment?.name || "document.pdf"
        }`
      );

    } finally {

      if (parser) {

        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup errors
        }

      }

    }

  }

  return files;
}


/* =========================================================
   GET IMAGE ATTACHMENTS
========================================================= */

function getImageAttachments(attachments = []) {

  return attachments.filter(
    attachment =>
      String(attachment?.type || "")
        .toLowerCase()
        .startsWith("image/")
  );

}
/* =========================================================
   BUILD SEARCH CONTEXT
========================================================= */

function buildSearchContext(results = []) {

  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return "";
  }


  return results
    .map((item, index) => {

      return [
        `${index + 1}. ${item.title || "Result"}`,
        "",
        item.content || "",
        "",
        `Source: ${item.url || ""}`,
      ].join("\n");

    })
    .join(
      "\n\n----------------------------------------\n\n"
    );

}


/* =========================================================
   BUILD FILE CONTEXT
========================================================= */

function buildFileContext(files = []) {

  if (files.length === 0) {
    return "";
  }


  let context = `

==================================================
UPLOADED FILES
==================================================

`;


  for (const file of files) {

    context += `
FILE NAME: ${file.name}
FILE TYPE: ${file.type}

--- FILE CONTENT START ---

${file.text}

--- FILE CONTENT END ---

`;

  }


  context += `
==================================================

Use the actual uploaded file contents above when answering.
Do not invent file contents.

`;


  return context;

}


/* =========================================================
   BUILD CHAT MESSAGES
========================================================= */

function buildMessages({

  history = [],

  prompt = "",

  images = [],

}) {

  const messages = [];


  /* -------------------------
     System
  ------------------------- */

  messages.push({

    role: "system",

    content: SYSTEM_PROMPT,

  });


  /* -------------------------
     Conversation History
  ------------------------- */

  for (const msg of history) {

    if (!msg?.text) {
      continue;
    }


    messages.push({

      role:
        msg.role === "assistant"
          ? "assistant"
          : "user",

      content:
        String(msg.text),

    });

  }


  /* -------------------------
     Normal Text Request
  ------------------------- */

  if (images.length === 0) {

    messages.push({

      role: "user",

      content:
        prompt ||
        "Please analyze the uploaded content.",

    });


    return messages;

  }


  /* -------------------------
     Vision Request
  ------------------------- */

  const content = [];


  content.push({

    type: "text",

    text:
      prompt ||
      "Analyze the attached image carefully.",

  });


  for (const image of images) {

    content.push({

      type: "image_url",

      image_url: {

        url: image.data,

      },

    });

  }


  messages.push({

    role: "user",

    content,

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


  if (!tvly) {

    console.warn(
      "Web search requested but Tavily is unavailable."
    );

    return {
      context: "",
      sources: [],
    };

  }


  try {

    console.log(
      "Running Tavily Search..."
    );


    const search =
      await tvly.search(query, {

        searchDepth: "advanced",

        maxResults: 5,

      });


    const results =
      search?.results || [];


    return {

      context:
        buildSearchContext(results),

      sources:
        results,

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
   GENERATE RESPONSE
========================================================= */

async function generateResponse(

  messages,

  model = MODELS.text

) {

  let lastError = null;


  for (
    let i = 0;
    i < GROQ_KEYS.length;
    i++
  ) {

    const groq =
      getGroqClient(
        GROQ_KEYS[i]
      );


    try {

      console.log(
        `Trying Groq Key ${i + 1}`
      );


      console.log(
        "Using Model:",
        model
      );


      const requestOptions = {

  model,

  messages,

  temperature:
    GENERATION_CONFIG.temperature,

  top_p:
    GENERATION_CONFIG.top_p,

  max_tokens:
    GENERATION_CONFIG.max_tokens,

};


// Qwen Vision:
// thinking/reasoning user ko mat bhejo
if (model === MODELS.vision) {

  requestOptions.reasoning_effort = "none";

  requestOptions.reasoning_format = "hidden";

}


// GPT-OSS:
// reasoning field response me nahi chahiye
if (model === MODELS.text) {

  requestOptions.reasoning_effort = "low";

  requestOptions.include_reasoning = false;

}


const completion =
  await groq.chat.completions.create(
    requestOptions
  );


      console.log(
        `Groq Key ${i + 1} Success`
      );


    const rawReply =
  completion
    .choices?.[0]
    ?.message
    ?.content
    ?.trim() || "";


// =========================
// Remove leaked reasoning
// =========================

function cleanModelReply(text) {

  if (!text) {
    return "";
  }

  let cleaned = String(text).trim();

  // Remove <think> blocks
  cleaned = cleaned.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  // Remove <reasoning> blocks
  cleaned = cleaned.replace(
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
    ""
  );

  // If model provides a clear final answer,
  // return only that part
  const markers = [
    "Final Answer:",
    "FINAL ANSWER:",
    "Final Response:",
    "FINAL RESPONSE:"
  ];

  for (const marker of markers) {

    const index =
      cleaned.lastIndexOf(marker);

    if (index !== -1) {

      cleaned =
        cleaned
          .slice(index + marker.length)
          .trim();

      break;
    }
  }

  return cleaned.trim();
}
 

const reply =
  cleanModelReply(rawReply);


return {

  reply,

  model,

};

    }

    catch (error) {

      lastError = error;


      console.error(
        `Groq Key ${i + 1} Failed:`,
        error?.status,
        error?.message
      );


      /* -------------------------
         Try next key
      ------------------------- */

      if (
        error?.status === 429 ||
        error?.status === 401
      ) {

        continue;

      }


      /*
       If the model is blocked for the whole
       project/org, changing API key usually
       won't fix it.
      */

      if (error?.status === 403) {

        throw new Error(
          `Model access denied for ${model}. ` +
          "Check Groq model permissions."
        );

      }


      throw error;

    }

  }


  throw (
    lastError ||
    new Error(
      "All Groq API keys failed."
    )
  );

}


/* =========================================================
   SUCCESS RESPONSE
========================================================= */

function createSuccessResponse({

  reply,

  model,

  webSearch,

  searchSources,

  attachmentCount,

}) {

  return {

    success: true,

    reply,

    model,

    provider: "Groq",

    webSearch,

    attachmentCount,

    sources:
      searchSources.map(
        item => ({

          title:
            item.title,

          url:
            item.url,

        })
      ),

  };

}


/* =========================================================
   ERROR RESPONSE
========================================================= */

function createErrorResponse(error) {

  let status = 500;


  if (
    typeof error?.status === "number"
  ) {

    status =
      error.status;

  }

  else if (
    typeof error?.code === "number"
  ) {

    status =
      error.code;

  }


  /*
   Our own validation errors should not
   become generic server errors.
  */

  const message =
    error?.message ||
    "Internal Server Error";


  if (
    message.includes("Maximum") ||
    message.includes("Invalid attachment") ||
    message.includes("Attachments must") ||
    message.includes("Attachment data missing")
  ) {

    status = 400;

  }


  return {

    status,

    body: {

      success: false,

      error: message,

    },

  };

}
/* =========================================================
   API HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {

  try {

    /* =====================================================
       POST ONLY
    ===================================================== */

    if (req.method !== "POST") {

      return res
        .status(405)
        .json({

          success: false,

          error:
            "Method Not Allowed",

        });

    }


    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const {

      message = "",

      history = [],

      webSearch = false,

      attachments = [],

    } = req.body || {};


    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (
      typeof message !== "string" ||
      !Array.isArray(history) ||
      !Array.isArray(attachments)
    ) {

      return res
        .status(400)
        .json({

          success: false,

          error:
            "Invalid request.",

        });

    }


    if (
      message.trim().length === 0 &&
      attachments.length === 0
    ) {

      return res
        .status(400)
        .json({

          success: false,

          error:
            "Message or attachment required.",

        });

    }


    /* =====================================================
       ATTACHMENT VALIDATION
    ===================================================== */

    validateAttachments(
      attachments
    );


    const userMessage =
      message.trim();


    /* =====================================================
       PROCESS ATTACHMENTS
    ===================================================== */

   const textFiles =
  extractTextAttachments(
    attachments
  );

const pdfFiles =
  await extractPdfAttachments(
    attachments
  );

// Text/code + PDF ko same context me bhejenge
const readableFiles = [
  ...textFiles,
  ...pdfFiles
];

const images =
  getImageAttachments(
    attachments
  );

    console.log(
      "Attachments:",
      attachments.length
    );


    console.log(
      "Text Files:",
      textFiles.length
    );


    console.log(
  "PDF Files:",
  pdfFiles.length
);

    console.log(
      "Images:",
      images.length
    );


    /* =====================================================
       UNSUPPORTED FILE WARNING
    ===================================================== */

   const unsupportedFiles =
  attachments.filter(
    attachment =>
      !String(
        attachment?.type || ""
      ).startsWith("image/") &&
      !isTextAttachment(
        attachment
      ) &&
      !isPdfAttachment(
        attachment
      )
  );


    /*
      PDF/DOCX need dedicated parsers.
      Do not decode them as UTF-8 because
      that produces garbage binary text.
    */

    if (
      unsupportedFiles.length > 0
    ) {

      const names =
        unsupportedFiles
          .map(file =>
            file.name || "file"
          )
          .join(", ");


      return res
        .status(400)
        .json({

          success: false,

          error:
            `Unsupported file type: ${names}. ` +
            "For now upload text, code, JSON, CSV, Markdown or images.",

        });

    }


    /* =====================================================
       WEB SEARCH
    ===================================================== */

    let searchContext = "";

    let searchSources = [];


    if (
      webSearch &&
      userMessage
    ) {

      const search =
        await performWebSearch(
          userMessage
        );


      searchContext =
        search.context;


      searchSources =
        search.sources;

    }


    /* =====================================================
       BUILD FINAL PROMPT
    ===================================================== */

    let prompt = "";


    /* -------------------------
       Web Context
    ------------------------- */

    if (
      webSearch &&
      searchContext
    ) {

      prompt += `

==================================================
WEB SEARCH RESULTS
==================================================

${searchContext}

==================================================

Use these search results when relevant.

If current search results conflict with older
internal knowledge, prefer the search results.

`;

    }


    /* -------------------------
       File Context
    ------------------------- */

   prompt +=
  buildFileContext(
    readableFiles
  );


    /* -------------------------
       User Message
    ------------------------- */

    if (userMessage) {

      prompt += `

==================================================
USER REQUEST
==================================================

${userMessage}

`;

    }

   else if (
  readableFiles.length > 0
) {

      prompt += `

Please analyze the uploaded file or files.

`;

    }

    else if (
      images.length > 0
    ) {

      prompt += `

Please analyze the attached image or images carefully.

`;

    }


    /* =====================================================
       AUTOMATIC MODEL ROUTING
    ===================================================== */

    const selectedModel =
      selectModel(
        attachments
      );


    console.log(
      "Selected AI Model:",
      selectedModel
    );


    /* =====================================================
       BUILD GROQ MESSAGES
    ===================================================== */

    const messages =
      buildMessages({

        history,

        prompt,

        images,

      });


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
    } =
      await generateResponse(

        messages,

        selectedModel

      );


    if (!reply) {

      return res
        .status(500)
        .json({

          success: false,

          error:
            "No response generated.",

        });

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    return res
      .status(200)
      .json(

        createSuccessResponse({

          reply,

          model,

          webSearch,

          searchSources,

          attachmentCount:
            attachments.length,

        })

      );

  }

  catch (error) {

    console.error(
      "\n========================================"
    );

    console.error(
      "ManThink AI API Error"
    );

    console.error(
      "Time:",
      new Date().toISOString()
    );

    console.error(
      "Status:",
      error?.status ||
      error?.code ||
      500
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
      createErrorResponse(
        error
      );


    return res
      .status(
        response.status
      )
      .json(
        response.body
      );

  }

}