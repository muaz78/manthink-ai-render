import OpenAI from "openai";

/* =========================================================
   MANTHINK CODE AGENT
========================================================= */

const {
  OPENROUTER_API_KEY,
  OPENROUTER_API_KEY_2,
  CEREBRAS_API_KEY,
} = process.env;


const OPENROUTER_KEYS = [
  OPENROUTER_API_KEY,
  OPENROUTER_API_KEY_2,
].filter(Boolean);


if (
  OPENROUTER_KEYS.length === 0 &&
  !CEREBRAS_API_KEY
) {
  throw new Error(
    "No Code Agent API keys found."
  );
}


/* =========================================================
   MODEL
========================================================= */

const OPENROUTER_MODEL =
  "openrouter/free";

const CEREBRAS_MODEL =
  "gpt-oss-120b";


/* =========================================================
   LIMITS
========================================================= */

const MAX_FILES = 50;
const MAX_PROMPT_LENGTH = 8000;
const MAX_PROJECT_CHARS = 50000;
const MAX_CONTEXT_FILES = 8;
const MAX_CONTEXT_CHARS = 30000;


/* =========================================================
   OpenRouter CLIENT
========================================================= */

function getOpenRouterClient(apiKey) {

  return new OpenAI({
    apiKey,

    baseURL:
      "https://openrouter.ai/api/v1",
  });

}


function getCerebrasClient() {

  if (!CEREBRAS_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey:
      CEREBRAS_API_KEY,

    baseURL:
      "https://api.cerebras.ai/v1",
  });

}

async function callCodeModel(messages) {

  let lastError = null;


  // =====================================
  // 1. OPENROUTER KEYS
  // =====================================

  for (
    let i = 0;
    i < OPENROUTER_KEYS.length;
    i++
  ) {

    const client =
      getOpenRouterClient(
        OPENROUTER_KEYS[i]
      );


    try {

      console.log(
        `Code Agent: OpenRouter Key ${i + 1}`
      );


      const completion =
        await client.chat.completions.create({

          model:
            OPENROUTER_MODEL,

          messages,

          temperature: 0.2,

          max_tokens: 8192,

        });


      const response =
        completion
          .choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!response) {

        throw new Error(
          "OpenRouter returned empty response."
        );

      }


      return {
        content: response,
        provider: "OpenRouter",
        model:
          completion.model ||
          OPENROUTER_MODEL
      };

    }

    catch (error) {

      lastError = error;


      console.error(
        `OpenRouter Key ${i + 1} failed:`,
        error?.status,
        error?.message
      );


      // Try next provider/key
      continue;

    }

  }



  // =====================================
  // 2. CEREBRAS FALLBACK
  // =====================================

  if (CEREBRAS_API_KEY) {

    try {

      console.log(
        "Code Agent: Trying Cerebras"
      );


      const cerebras =
        getCerebrasClient();


      const completion =
        await cerebras.chat.completions.create({

          model:
            CEREBRAS_MODEL,

          messages,

          temperature: 0.2,

          max_tokens: 8192,

        });


      const response =
        completion
          .choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!response) {

        throw new Error(
          "Cerebras returned empty response."
        );

      }


      return {
        content: response,
        provider: "Cerebras",
        model:
          completion.model ||
          CEREBRAS_MODEL
      };

    }

    catch (error) {

      lastError = error;


      console.error(
        "Cerebras failed:",
        error?.status,
        error?.message
      );

    }

  }



  // =====================================
  // EVERYTHING FAILED
  // =====================================

  throw (
    lastError ||
    new Error(
      "All Code Agent providers failed."
    )
  );

}

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const CODE_SYSTEM_PROMPT = `
You are ManThink Code, an autonomous software engineering agent.

Your job is to modify a user's software project.

You receive:
1. A user request.
2. The project's current files and their contents.

You must decide which files need to be created or modified.

IMPORTANT:

Return ONLY valid JSON.

Do not return Markdown.
Do not use Markdown code fences.
Do not add commentary before or after the JSON.

Your response must follow exactly this structure:

{
  "operations": [
    {
      "action": "write",
      "path": "index.html",
      "content": "complete file content"
    }
  ],
  "summary": "Short description of what was changed"
}

Allowed actions:

- write
- delete

Rules:

The project context may contain only the files most relevant to the user's request.

Do not assume that files missing from the provided context do not exist.

Only modify files when you have enough context to do so.

If the user's request clearly requires a file that is not available in the provided context, do not invent its existing contents.
- "write" creates a file if it does not exist.
- "write" completely replaces an existing file.
- Always provide COMPLETE file contents for write operations.
- Never return partial snippets for a file.
- Preserve existing functionality unless the user asks to change it.
- Modify only files necessary for the request.
- Use existing project structure when possible.
- Do not invent files unnecessarily.
- Never use absolute filesystem paths.
- Never use ../ path traversal.
- Never attempt to access environment variables.
- Never output shell commands as file operations.
- Never expose secrets.
- Prefer clean, maintainable code.
- Make websites responsive when appropriate.
- If the project uses HTML/CSS/JavaScript, keep the files properly connected.

If no file changes are required, return:

{
  "operations": [],
  "summary": "No changes required."
}

Return JSON only.
`;
const CODE_ASK_SYSTEM_PROMPT = `
You are ManThink Code in Ask Mode.

You are an expert software engineering assistant.

The user may ask you to:
- explain code
- find bugs
- review architecture
- suggest improvements
- explain errors
- answer programming questions
- discuss the current project

You may inspect the provided project context.

IMPORTANT:

You are in ASK MODE.

Do NOT modify files.
Do NOT create files.
Do NOT delete files.
Do NOT return file operations.

Answer the user's question directly and clearly.

When useful:
- mention relevant file names
- explain the cause of bugs
- suggest exact changes
- include short code examples

The project context may contain only files considered relevant to the request.

Do not assume missing files do not exist.

Return ONLY valid JSON in this exact format:

{
  "answer": "Your response here"
}

Do not return Markdown code fences around the JSON.
`;


/* =========================================================
   PROJECT VALIDATION
========================================================= */

function validateProject(files) {
  if (
    !files ||
    typeof files !== "object" ||
    Array.isArray(files)
  ) {
    throw new Error("Invalid project files.");
  }

  const entries = Object.entries(files);

  if (entries.length === 0) {
    throw new Error("Project contains no files.");
  }

  if (entries.length > MAX_FILES) {
    throw new Error(
      `Maximum ${MAX_FILES} project files allowed.`
    );
  }

  let totalCharacters = 0;

  for (const [path, content] of entries) {
    if (
      typeof path !== "string" ||
      typeof content !== "string"
    ) {
      throw new Error("Invalid project file.");
    }

    totalCharacters += content.length;
  }

  if (totalCharacters > MAX_PROJECT_CHARS) {
    throw new Error(
      "Project is too large for the Code Agent."
    );
  }
}


/* =========================================================
   SAFE PATH
========================================================= */

function isSafePath(filePath) {
  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    return false;
  }

  const path = filePath.trim();

  if (path.startsWith("/")) {
    return false;
  }

  if (path.includes("..")) {
    return false;
  }

  if (path.includes("\\")) {
    return false;
  }

  return true;
}

/* =========================================================
   CONTEXT ENGINE
========================================================= */

function tokenizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 2);
}


function getFileExtension(filePath = "") {
  const cleanPath =
    String(filePath).toLowerCase();

  const lastPart =
    cleanPath.split("/").pop() || "";

  const dotIndex =
    lastPart.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return lastPart.slice(dotIndex + 1);
}


function detectRequestedFileTypes(prompt) {
  const text =
    String(prompt).toLowerCase();

  const extensions = new Set();

  const rules = [
    {
      words: [
        "html",
        "page",
        "heading",
        "button",
        "navbar",
        "header",
        "footer",
        "form",
        "input",
        "layout",
        "section"
      ],
      extensions: ["html"]
    },

    {
      words: [
        "css",
        "style",
        "color",
        "background",
        "font",
        "responsive",
        "mobile",
        "spacing",
        "margin",
        "padding",
        "animation",
        "design"
      ],
      extensions: ["css"]
    },

    {
      words: [
        "javascript",
        "js",
        "function",
        "click",
        "event",
        "logic",
        "validation",
        "api",
        "fetch",
        "bug",
        "error"
      ],
      extensions: ["js", "ts", "jsx", "tsx"]
    },

    {
      words: [
        "json",
        "config",
        "configuration"
      ],
      extensions: ["json"]
    },

    {
      words: [
        "python",
        "py"
      ],
      extensions: ["py"]
    }
  ];

  for (const rule of rules) {
    if (
      rule.words.some(word =>
        text.includes(word)
      )
    ) {
      rule.extensions.forEach(extension =>
        extensions.add(extension)
      );
    }
  }

  return extensions;
}


function scoreContextFile(
  filePath,
  content,
  prompt,
  promptTokens,
  requestedTypes
) {
  const lowerPath =
    filePath.toLowerCase();

  const lowerContent =
    content.toLowerCase();

  const extension =
    getFileExtension(filePath);

  let score = 0;


  // User directly mentioned filename
  if (
    prompt.toLowerCase().includes(
      lowerPath
    )
  ) {
    score += 100;
  }


  // Match requested file type
  if (requestedTypes.has(extension)) {
    score += 25;
  }


  // Entry files are often important
  if (
    lowerPath === "index.html" ||
    lowerPath.endsWith("/index.html")
  ) {
    score += 12;
  }


  // Filename keyword matches
  for (const token of promptTokens) {

    if (lowerPath.includes(token)) {
      score += 12;
    }

  }


  // Content keyword matches
  let contentMatches = 0;

  for (const token of promptTokens) {

    if (
      contentMatches >= 12
    ) {
      break;
    }

    if (lowerContent.includes(token)) {
      score += 2;
      contentMatches++;
    }

  }


  return score;
}


function selectRelevantFiles(
  prompt,
  files
) {
  const entries =
    Object.entries(files);

  // Small projects: context selection isn't worth it.
  if (entries.length <= 4) {
    return Object.fromEntries(entries);
  }

  const promptTokens =
    [...new Set(tokenizeText(prompt))];

  const requestedTypes =
    detectRequestedFileTypes(prompt);


  const scored =
    entries.map(([filePath, content]) => ({
      filePath,
      content,

      score: scoreContextFile(
        filePath,
        content,
        prompt,
        promptTokens,
        requestedTypes
      )
    }));


  scored.sort(
    (a, b) => b.score - a.score
  );


  const selected = {};
  let totalCharacters = 0;


  for (const file of scored) {

    if (
      Object.keys(selected).length >=
      MAX_CONTEXT_FILES
    ) {
      break;
    }

    const nextSize =
      totalCharacters +
      file.content.length;

    if (
      nextSize > MAX_CONTEXT_CHARS
    ) {
      continue;
    }


    // Once we already have useful files,
    // don't fill context with unrelated files.
    if (
      file.score <= 0 &&
      Object.keys(selected).length >= 3
    ) {
      continue;
    }


    selected[file.filePath] =
      file.content;

    totalCharacters = nextSize;
  }


  // Safety fallback
  if (
    Object.keys(selected).length === 0
  ) {

    const firstFiles =
      entries.slice(
        0,
        MAX_CONTEXT_FILES
      );

    return Object.fromEntries(
      firstFiles
    );

  }


  return selected;
}

/* =========================================================
   BUILD PROJECT CONTEXT
========================================================= */

function buildProjectContext(files) {
  let context = "";

  for (const [filePath, content] of Object.entries(files)) {
    context += `

==================================================
FILE: ${filePath}
==================================================

${content}

`;
  }

  return context;
}


/* =========================================================
   EXTRACT JSON
========================================================= */

function parseAgentResponse(rawResponse) {
  if (!rawResponse) {
    throw new Error(
      "Code Agent returned an empty response."
    );
  }

  let text = String(rawResponse).trim();

  // Defensive cleanup if model ignores JSON-only rule.
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Code Agent returned invalid JSON."
    );
  }

  if (
    !parsed ||
    !Array.isArray(parsed.operations)
  ) {
    throw new Error(
      "Code Agent response is missing operations."
    );
  }

  const operations = [];

  for (const operation of parsed.operations) {
    if (
      !operation ||
      typeof operation !== "object"
    ) {
      continue;
    }

    const action =
      String(operation.action || "")
        .toLowerCase();

    const filePath =
      String(operation.path || "")
        .trim();

    if (
      action !== "write" &&
      action !== "delete"
    ) {
      continue;
    }

    if (!isSafePath(filePath)) {
      continue;
    }

    if (action === "write") {
      if (typeof operation.content !== "string") {
        continue;
      }

      operations.push({
        action: "write",
        path: filePath,
        content: operation.content,
      });
    }

    if (action === "delete") {
      operations.push({
        action: "delete",
        path: filePath,
      });
    }
  }

  return {
    operations,

    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Project updated.",
  };
}

async function generateCodeAnswer(
  userRequest,
  files
) {

  const relevantFiles =
    selectRelevantFiles(
      userRequest,
      files
    );

  const projectContext =
    buildProjectContext(
      relevantFiles
    );


  console.log(
    "Code Ask Context:",
    Object.keys(relevantFiles)
  );


  const result =
  await callCodeModel([
      {
        role: "system",
        content:
          CODE_ASK_SYSTEM_PROMPT
      },

      {
        role: "user",
        content: `
USER QUESTION:

${userRequest}


PROJECT CONTEXT:

${projectContext}
`
      }
    ]);


  let parsed;

  try {

   parsed =
  JSON.parse(
    result.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
  );
  } catch {

    throw new Error(
      "Ask Mode returned invalid JSON."
    );

  }


  if (
    !parsed ||
    typeof parsed.answer !== "string"
  ) {

    throw new Error(
      "Ask Mode returned an invalid answer."
    );

  }


 return {
  answer: parsed.answer,

  contextFiles:
    Object.keys(relevantFiles),

  provider:
    result.provider,

  model:
    result.model
};

  }

/* =========================================================
   GENERATE CODE OPERATIONS
========================================================= */

async function generateCodeOperations(
  userRequest,
  files
) {
 const relevantFiles =
  selectRelevantFiles(
    userRequest,
    files
  );

const projectContext =
  buildProjectContext(
    relevantFiles
  );

console.log(
  "Code Agent Context:",
  Object.keys(relevantFiles)
);

  const messages = [
    {
      role: "system",
      content: CODE_SYSTEM_PROMPT,
    },

    {
      role: "user",
      content: `
CURRENT PROJECT:

${projectContext}

==================================================
USER REQUEST
==================================================

${userRequest}

Return the required file operations as JSON.
`,
    },
  ];

 const result =
  await callCodeModel(
    messages
  );


const parsed =
  parseAgentResponse(
    result.content
  );


return {
  ...parsed,

  contextFiles:
    Object.keys(relevantFiles),

  provider:
    result.provider,

  model:
    result.model
};
  
  }

/* =========================================================
   API HANDLER
========================================================= */

export default async function codeHandler(
  req,
  res
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method Not Allowed",
      });
    }

  const {
  prompt,
  files,
  mode = "agent"
} = req.body;

const normalizedMode =
  mode === "ask"
    ? "ask"
    : "agent";

    if (
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Coding instruction is required.",
      });
    }

    if (
      prompt.length >
      MAX_PROMPT_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Coding instruction is too long.",
      });
    }

    validateProject(files);

    if (normalizedMode === "ask") {

  const result =
    await generateCodeAnswer(
      prompt,
      files
    );


  return res.status(200).json({

    success: true,

    mode: "ask",

    answer:
      result.answer,

   contextFiles:
  result.contextFiles,

provider:
  result.provider,

model:
  result.model
  });

}

    const result =
      await generateCodeOperations(
        prompt.trim(),
        files
      );

    return res.status(200).json({
      success: true,
      mode: "agent",
      operations: result.operations,
      summary: result.summary,
      contextFiles: result.contextFiles,
    provider: result.provider,
model: result.model,
    });
  } catch (error) {
    console.error(
      "ManThink Code Agent Error:",
      error
    );

    const validationError =
      String(error?.message || "");

    const status =
      validationError.includes("Invalid") ||
      validationError.includes("Maximum") ||
      validationError.includes("too large") ||
      validationError.includes("contains no files") ||
      validationError.includes("too long")
        ? 400
        : 500;

    return res.status(status).json({
      success: false,

      error:
        error?.message ||
        "Code Agent failed.",
    });
  }
}