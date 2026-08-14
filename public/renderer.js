"use strict";


// =========================================================
// MANTHINK NORMAL CHAT
// =========================================================


// =========================================================
// 1. DOM
// =========================================================

const body = document.body;

const chatbox =
  document.getElementById("chatbox");

const messageInput =
  document.getElementById("message");

const actionBtn =
  document.getElementById("actionBtn");

const actionIcon =
  document.getElementById("actionIcon");

const composerStatus =
  document.getElementById("composerStatus");

const newChatBtn =
  document.getElementById("newChatBtn");

const mobileNewChatBtn =
  document.getElementById("mobileNewChatBtn");

const chatHistory =
  document.getElementById("chatHistory");

const chatSearch =
  document.getElementById("chatSearch");

const sidebar =
  document.getElementById("sidebar");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const menuToggle =
  document.getElementById("menuToggle");

const sidebarCloseBtn =
  document.getElementById("sidebarCloseBtn");

const createMenuBtn =
  document.getElementById("createMenuBtn");

const createMenu =
  document.getElementById("createMenu");

const uploadFileBtn =
  document.getElementById("uploadFileBtn");

const uploadPhotoBtn =
  document.getElementById("uploadPhotoBtn");

const createWebBtn =
  document.getElementById("createWebBtn");

const webSearch =
  document.getElementById("webSearch");

const webToggleLabel =
  document.getElementById("webToggleLabel");

const webSearchMenuStatus =
  document.getElementById("webSearchMenuStatus");

const filePicker =
  document.getElementById("filePicker");

const photoPicker =
  document.getElementById("photoPicker");

const attachmentPreview =
  document.getElementById("attachmentPreview");

const themeBtn =
  document.getElementById("themeBtn");

const themeIcon =
  document.getElementById("themeIcon");

const themeText =
  document.getElementById("themeText");

const settingsBtn =
  document.getElementById("settingsBtn");

const settingsModal =
  document.getElementById("settingsModal");

const settingsBackdrop =
  document.getElementById("settingsBackdrop");

const closeSettingsBtn =
  document.getElementById("closeSettingsBtn");

const settingsThemeBtn =
  document.getElementById("settingsThemeBtn");

const clearHistoryBtn =
  document.getElementById("clearHistoryBtn");

const installAppBtn =
  document.getElementById("installAppBtn");


// =========================================================
// 2. STATE
// =========================================================

let currentChatId = null;

let currentMessages = [];

let selectedAttachments = [];

let isGenerating = false;

let requestController = null;

let recognition = null;

let isListening = false;

let deferredInstallPrompt = null;


// Mobile swipe state

let touchStartX = 0;
let touchStartY = 0;

let touchCurrentX = 0;
let touchCurrentY = 0;

let sidebarSwipeActive = false;
let edgeSwipeActive = false;


// =========================================================
// 3. CONSTANTS
// =========================================================

const CURRENT_CHAT_KEY =
  "manthink_current_chat";

const THEME_KEY =
  "manthink_theme";

const MOBILE_BREAKPOINT =
  768;

const EDGE_SWIPE_ZONE =
  28;

const SWIPE_TRIGGER =
  70;


// =========================================================
// 4. UTILITIES
// =========================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function isMobile() {

  return window.innerWidth <=
    MOBILE_BREAKPOINT;
}


function scrollToBottom(
  behavior = "smooth"
) {

  if (!chatbox) return;

  requestAnimationFrame(() => {

    chatbox.scrollTo({
      top: chatbox.scrollHeight,
      behavior
    });

  });
}


function showComposerStatus(
  text
) {

  if (!composerStatus) return;

  composerStatus.textContent =
    String(text || "");

  composerStatus.hidden =
    !text;
}


function clearComposerStatus() {

  showComposerStatus("");
}


function safeFocusInput() {

  if (
    messageInput &&
    !isMobile()
  ) {

    messageInput.focus();

  }
}


function removeWelcome() {

  document
    .getElementById("welcomeCard")
    ?.remove();
}


function getMessageText(message) {

  return String(
    message?.text ??
    message?.content ??
    ""
  );
}


function normalizeRole(role) {

  if (
    role === "assistant" ||
    role === "ai"
  ) {

    return "assistant";

  }

  return "user";
}


// =========================================================
// 5. MARKDOWN
// =========================================================

function renderMarkdown(text) {

  const source =
    String(text || "");


  if (
    typeof window.marked ===
    "undefined"
  ) {

    return escapeHtml(source)
      .replace(/\n/g, "<br>");

  }


  try {

    return window.marked.parse(
      source,
      {
        breaks: true,
        gfm: true
      }
    );

  }

  catch (error) {

    console.error(
      "Markdown render error:",
      error
    );

    return escapeHtml(source)
      .replace(/\n/g, "<br>");

  }

}


function highlightCode(container) {

  if (
    typeof window.hljs ===
    "undefined"
  ) {

    return;

  }


  container
    ?.querySelectorAll(
      "pre code"
    )
    .forEach(block => {

      try {

        window.hljs
          .highlightElement(
            block
          );

      }

      catch (error) {

        console.warn(
          "Highlight error:",
          error
        );

      }

    });

}


// =========================================================
// 6. COPY BUTTONS FOR CODE
// =========================================================

function addCodeCopyButtons(
  container
) {

  if (!container) return;


  container
    .querySelectorAll("pre")
    .forEach(pre => {

      if (
        pre.querySelector(
          ".code-copy-btn"
        )
      ) {

        return;

      }


      const code =
        pre.querySelector("code");

      if (!code) return;


      pre.classList.add(
        "code-block"
      );


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "code-copy-btn";

      button.textContent =
        "Copy";


      button.addEventListener(
        "click",
        async () => {

          try {

            await navigator
              .clipboard
              .writeText(
                code.textContent || ""
              );


            button.textContent =
              "Copied";


            setTimeout(() => {

              button.textContent =
                "Copy";

            }, 1400);

          }

          catch {

            button.textContent =
              "Failed";

          }

        }
      );


      pre.appendChild(
        button
      );

    });

}


// =========================================================
// 7. WELCOME
// =========================================================

function renderWelcome() {

  if (!chatbox) return;


  chatbox.innerHTML = `

    <div
      id="welcomeCard"
      class="welcome-card"
    >

      <div class="welcome-tag">
        Welcome
      </div>

      <div class="mini-note">
        More to come!
      </div>

      <h2>
        What can I help with today?
      </h2>

      <p>
        Start with a coding problem,
        a project idea,
        a game design question,
        or anything on your mind.
      </p>

      <div class="quick-grid">

        <button
          class="quick-btn"
          type="button"
          data-prompt="Help me learn AI from scratch.">
          Learn AI
        </button>

        <button
          class="quick-btn"
          type="button"
          data-prompt="Help me design a tycoon game idea.">
          Game Idea
        </button>

        <button
          class="quick-btn"
          type="button"
          data-prompt="Explain JavaScript scope and hoisting simply.">
          JS Scope
        </button>

        <button
          class="quick-btn"
          type="button"
          data-prompt="Make my app UI look premium and modern.">
          UI Polish
        </button>

      </div>

    </div>
  `;


  bindQuickPrompts();

  scrollToBottom("auto");
}


// =========================================================
// 8. MESSAGE UI
// =========================================================
function createMessageElement(role, text) {

  const normalizedRole = normalizeRole(role);

  // Outer Message
  const message = document.createElement("div");
  message.className = `message ${normalizedRole}`;

  // Header
  const header = document.createElement("div");
  header.className = "message-header";

 
  if (normalizedRole === "assistant") {

    header.innerHTML = `
<div class="ai-title">

    <div class="ai-avatar">
        ✦
    </div>

    <div class="ai-info">

        <span class="ai-name">
            ManThink AI
        </span>

        <span class="ai-status">
            Online
        </span>

    </div>

</div>
`;

  } else {

    header.innerHTML = `
<div class="user-title">
You
</div>
`;

  }

  // Bubble
  const bubble = document.createElement("div");

  bubble.className =
    normalizedRole === "assistant"
      ? "ai-bubble"
      : "user-bubble";

  if (normalizedRole === "assistant") {

    bubble.innerHTML = renderMarkdown(text);

    highlightCode(bubble);

    addCodeCopyButtons(bubble);

  } else {

    bubble.textContent = String(text || "");

  }

  message.appendChild(header);

  message.appendChild(bubble);

  // AI Actions
  if (normalizedRole === "assistant") {

    const actions =
      document.createElement("div");

    actions.className =
      "message-actions";

  actions.innerHTML = `

<button class="message-action-btn copy-btn" title="Copy">

<span class="material-symbols-rounded">
content_copy
</span>

</button>

<button class="message-action-btn like-btn" title="Like">

<span class="material-symbols-rounded">
thumb_up
</span>

</button>

<button class="message-action-btn dislike-btn" title="Dislike">

<span class="material-symbols-rounded">
thumb_down
</span>

</button>

<button class="message-action-btn regenerate-btn" title="Regenerate">

<span class="material-symbols-rounded">
refresh
</span>

</button>

`;
    // Copy

    actions.querySelector(".copy-btn")
      .addEventListener("click", async () => {

        try {

          await navigator.clipboard.writeText(
            bubble.innerText
          );

        }

        catch {}

      });

    message.appendChild(actions);

  }

  return message;

}

function appendMessage(role, text) {

    removeWelcome();

    const element = createMessageElement(role, text);

    chatbox.appendChild(element);

    scrollToBottom("smooth");

    return element;

}

// =========================================================
// 9. THINKING MESSAGE
// =========================================================

function createThinkingMessage() {

  removeWelcome();


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "bubble ai typing";


  wrapper.innerHTML = `

    <div class="thinking-content">

      <l-quantum
        size="24"
        speed="1.6"
        color="#10a37f">
      </l-quantum>

      <span>
        ManThink is thinking...
      </span>

    </div>
  `;


  chatbox?.appendChild(
    wrapper
  );


  scrollToBottom();


  return wrapper;
}


// =========================================================
// 10. CHAT STORAGE
// =========================================================

function createAndStoreChat() {

  if (
    typeof createChat !==
      "function" ||
    typeof loadChats !==
      "function" ||
    typeof saveChats !==
      "function"
  ) {

    console.error(
      "chatStorage.js is not loaded."
    );

    return null;
  }


  const chats =
    loadChats();


  const chat =
    createChat();


  chats.unshift(
    chat
  );


  saveChats(
    chats
  );


  setCurrentChat(
    chat.id
  );


  currentChatId =
    chat.id;


  return chat;
}


function ensureCurrentChat() {

  if (
    currentChatId
  ) {

    return currentChatId;

  }


  const chat =
    createAndStoreChat();


  return chat?.id || null;
}


function persistCurrentMessages() {

  if (
    !currentChatId ||
    typeof saveCurrentChat !==
      "function"
  ) {

    return;

  }


  saveCurrentChat(
    currentMessages
  );
}


function startNewChat() {

  stopGeneration();

  stopVoiceInput();


  currentChatId = null;

  currentMessages = [];

  selectedAttachments = [];


  localStorage.removeItem(
    CURRENT_CHAT_KEY
  );


  renderAttachmentPreview();

  renderWelcome();

  renderChatHistory();

  closeSidebar();

  clearComposerStatus();

  updateActionButton();

  safeFocusInput();
}


function openSavedChat(id) {

  if (
    typeof loadChats !==
    "function"
  ) {

    return;

  }


  const chats =
    loadChats();


  const chat =
    chats.find(
      item =>
        item.id === id
    );


  if (!chat) return;


  currentChatId =
    chat.id;


  setCurrentChat(
    chat.id
  );


  currentMessages =
    Array.isArray(
      chat.messages
    )
      ? chat.messages.map(
          message => ({
            role:
              normalizeRole(
                message.role
              ),

            text:
              getMessageText(
                message
              )
          })
        )
      : [];


  renderConversation();

  renderChatHistory();

  closeSidebar();

  safeFocusInput();
}


function renderConversation() {

  if (!chatbox) return;


  chatbox.innerHTML = "";


  if (
    !currentMessages.length
  ) {

    renderWelcome();

    return;

  }


  currentMessages.forEach(
    message => {

      const element =
        createMessageElement(
          message.role,
          message.text
        );


      chatbox.appendChild(
        element
      );

    }
  );


  scrollToBottom("auto");
}


// =========================================================
// 11. CHAT HISTORY
// =========================================================

function renderChatHistory(
  searchTerm = null
) {

  if (
    !chatHistory ||
    typeof loadChats !==
      "function"
  ) {

    return;

  }


  const query =
    String(
      searchTerm ??
      chatSearch?.value ??
      ""
    )
      .trim()
      .toLowerCase();


  const chats =
    loadChats()
      .slice()
      .sort(
        (a, b) =>
          Number(
            b.updatedAt || 0
          ) -
          Number(
            a.updatedAt || 0
          )
      )
      .filter(chat => {

        if (!query) return true;


        return String(
          chat.title ||
          "New Chat"
        )
          .toLowerCase()
          .includes(query);

      });


  chatHistory.innerHTML = "";


  if (!chats.length) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "chat-history-empty";


    empty.textContent =
      query
        ? "No matching chats"
        : "No chats yet";


    chatHistory.appendChild(
      empty
    );


    return;
  }


  chats.forEach(chat => {

    const item =
      document.createElement(
        "div"
      );


    item.className =
      "chat-history-item";


    if (
      chat.id ===
      currentChatId
    ) {

      item.classList.add(
        "active"
      );

    }


    const openButton =
      document.createElement(
        "button"
      );


    openButton.type =
      "button";


    openButton.className =
      "chat-history-open";


    openButton.title =
      chat.title ||
      "New Chat";


    const title =
      document.createElement(
        "span"
      );


    title.className =
      "chat-history-title";


    title.textContent =
      chat.title ||
      "New Chat";


    openButton.appendChild(
      title
    );


    const menuButton =
      document.createElement(
        "button"
      );


    menuButton.type =
      "button";


    menuButton.className =
      "chat-history-menu";


    menuButton.textContent =
      "⋯";


    menuButton.title =
      "Chat options";


    openButton.addEventListener(
      "click",
      () => {

        openSavedChat(
          chat.id
        );

      }
    );


    menuButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        showChatOptions(
          chat,
          menuButton
        );

      }
    );


    item.append(
      openButton,
      menuButton
    );


    chatHistory.appendChild(
      item
    );

  });

}


// =========================================================
// 12. CHAT OPTIONS
// =========================================================

function closeChatOptionMenus() {

  document
    .querySelectorAll(
      ".chat-options-menu"
    )
    .forEach(menu => {

      menu.remove();

    });
}


function showChatOptions(
  chat,
  anchor
) {

  closeChatOptionMenus();


  const menu =
    document.createElement(
      "div"
    );


  menu.className =
    "chat-options-menu";


  const renameButton =
    document.createElement(
      "button"
    );


  renameButton.type =
    "button";

  renameButton.textContent =
    "Rename";


  const deleteButton =
    document.createElement(
      "button"
    );


  deleteButton.type =
    "button";

  deleteButton.className =
    "danger";

  deleteButton.textContent =
    "Delete";


  renameButton.addEventListener(
    "click",
    () => {

      closeChatOptionMenus();


      const nextTitle =
        window.prompt(
          "Rename chat",
          chat.title ||
          "New Chat"
        );


      if (
        nextTitle === null
      ) {

        return;

      }


      const cleaned =
        nextTitle.trim();


      if (!cleaned) return;


      if (
        typeof renameChat ===
        "function"
      ) {

        renameChat(
          chat.id,
          cleaned
        );

      }


      renderChatHistory();

    }
  );


  deleteButton.addEventListener(
    "click",
    () => {

      closeChatOptionMenus();


      const confirmed =
        window.confirm(
          "Delete this chat?"
        );


      if (!confirmed) return;


      if (
        typeof deleteChat ===
        "function"
      ) {

        deleteChat(
          chat.id
        );

      }


      if (
        currentChatId ===
        chat.id
      ) {

        startNewChat();

      }

      else {

        renderChatHistory();

      }

    }
  );


  menu.append(
    renameButton,
    deleteButton
  );


  anchor
    .closest(
      ".chat-history-item"
    )
    ?.appendChild(
      menu
    );
}


// =========================================================
// 13. ATTACHMENT HELPERS
// =========================================================

function formatFileSize(bytes) {

  const value =
    Number(bytes || 0);


  if (
    value < 1024
  ) {

    return `${value} B`;

  }


  if (
    value <
    1024 * 1024
  ) {

    return `${
      (
        value / 1024
      ).toFixed(1)
    } KB`;

  }


  return `${
    (
      value /
      1024 /
      1024
    ).toFixed(1)
  } MB`;
}


function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () =>
          resolve(
            reader.result
          );


      reader.onerror =
        () =>
          reject(
            new Error(
              `Could not read ${file.name}`
            )
          );


      reader.readAsDataURL(
        file
      );

    }
  );
}


async function addFiles(
  fileList,
  forcedType = null
) {

  const files =
    Array.from(
      fileList || []
    );


  if (!files.length) return;


  for (
    const file of files
  ) {

    try {

      const dataUrl =
        await fileToDataURL(
          file
        );


      const type =
        forcedType ||
        (
          file.type
            ?.startsWith(
              "image/"
            )
            ? "image"
            : "file"
        );


      selectedAttachments.push({
        id:
          `${Date.now()}-${Math.random()}`,

        name:
          file.name,

        type,

        mimeType:
          file.type ||
          "application/octet-stream",

        size:
          file.size,

        data:
          dataUrl
      });

    }

    catch (error) {

      console.error(
        error
      );


      showComposerStatus(
        `Could not add ${file.name}`
      );

    }

  }


  renderAttachmentPreview();

  updateActionButton();
}


function removeAttachment(id) {

  selectedAttachments =
    selectedAttachments.filter(
      attachment =>
        attachment.id !== id
    );


  renderAttachmentPreview();

  updateActionButton();
}


function renderAttachmentPreview() {

  if (!attachmentPreview) {
    return;
  }


  attachmentPreview.innerHTML =
    "";


  if (
    !selectedAttachments.length
  ) {

    attachmentPreview.hidden =
      true;

    return;

  }


  attachmentPreview.hidden =
    false;


  selectedAttachments.forEach(
    attachment => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "attachment-chip";


      let preview;


      if (
        attachment.type ===
        "image"
      ) {

        preview =
          document.createElement(
            "img"
          );


        preview.src =
          attachment.data;


        preview.alt =
          attachment.name;

      }

      else {

        preview =
          document.createElement(
            "div"
          );


        preview.className =
          "attachment-file-icon";


        preview.textContent =
          "📄";

      }


      const info =
        document.createElement(
          "div"
        );


      info.className =
        "attachment-chip-info";


      const name =
        document.createElement(
          "strong"
        );


      name.textContent =
        attachment.name;


      const size =
        document.createElement(
          "small"
        );


      size.textContent =
        formatFileSize(
          attachment.size
        );


      info.append(
        name,
        size
      );


      const remove =
        document.createElement(
          "button"
        );


      remove.type =
        "button";

      remove.className =
        "attachment-remove";

      remove.textContent =
        "×";

      remove.title =
        "Remove attachment";


      remove.addEventListener(
        "click",
        () => {

          removeAttachment(
            attachment.id
          );

        }
      );


      item.append(
        preview,
        info,
        remove
      );


      attachmentPreview
        .appendChild(
          item
        );

    });

}


// =========================================================
// 14. API ATTACHMENTS
// =========================================================

function getAttachmentsForAPI() {

  return selectedAttachments.map(
    attachment => ({

      name:
        attachment.name,

      type:
        attachment.type,

      mimeType:
        attachment.mimeType,

      data:
        attachment.data

    })
  );
}


// =========================================================
// 15. WEB SEARCH
// =========================================================

function updateWebSearchUI() {

  const enabled =
    Boolean(
      webSearch?.checked
    );


  webToggleLabel
    ?.classList.toggle(
      "active",
      enabled
    );


  createWebBtn
    ?.classList.toggle(
      "active",
      enabled
    );


  if (
    webSearchMenuStatus
  ) {

    webSearchMenuStatus
      .textContent =
        enabled
          ? "Web search is on"
          : "Search current information";

  }

}


function toggleWebSearch() {

  if (!webSearch) return;


  webSearch.checked =
    !webSearch.checked;


  updateWebSearchUI();

  closeCreateMenu();
}


// =========================================================
// 16. CREATE MENU
// =========================================================

function openCreateMenu() {

  if (!createMenu) return;


  createMenu.hidden =
    false;


  createMenuBtn
    ?.classList.add(
      "active"
    );
}


function closeCreateMenu() {

  if (!createMenu) return;


  createMenu.hidden =
    true;


  createMenuBtn
    ?.classList.remove(
      "active"
    );
}


function toggleCreateMenu() {

  if (!createMenu) return;


  if (
    createMenu.hidden
  ) {

    openCreateMenu();

  }

  else {

    closeCreateMenu();

  }

}


// =========================================================
// 17. ACTION BUTTON
// =========================================================

function setActionButtonState(
  state
) {

  if (
    !actionBtn ||
    !actionIcon
  ) {

    return;

  }


  actionBtn.classList.remove(
    "mic-state",
    "send-state",
    "stop-state"
  );


  if (
    state === "stop"
  ) {

    actionBtn.classList.add(
      "stop-state"
    );


    actionIcon.textContent =
      "■";


    actionBtn.title =
      isListening
        ? "Stop voice input"
        : "Stop generating";


    actionBtn.setAttribute(
      "aria-label",
      actionBtn.title
    );


    return;
  }


  if (
    state === "send"
  ) {

    actionBtn.classList.add(
      "send-state"
    );


    actionIcon.textContent =
      "↑";


    actionBtn.title =
      "Send message";


    actionBtn.setAttribute(
      "aria-label",
      "Send message"
    );


    return;
  }


  actionBtn.classList.add(
    "mic-state"
  );


  actionIcon.textContent =
    "🎤";


  actionBtn.title =
    "Start voice input";


  actionBtn.setAttribute(
    "aria-label",
    "Start voice input"
  );
}


function updateActionButton() {

  if (
    isGenerating ||
    isListening
  ) {

    setActionButtonState(
      "stop"
    );

    return;

  }


  const hasText =
    Boolean(
      messageInput
        ?.value
        .trim()
    );


  const hasAttachments =
    selectedAttachments.length >
    0;


  if (
    hasText ||
    hasAttachments
  ) {

    setActionButtonState(
      "send"
    );

  }

  else {

    setActionButtonState(
      "mic"
    );

  }

}


// =========================================================
// 18. VOICE INPUT
// =========================================================

function setupVoiceRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    recognition = null;

    return;

  }


  recognition =
    new SpeechRecognition();


  recognition.continuous =
    true;


  recognition.interimResults =
    true;


  recognition.lang =
    navigator.language ||
    "en-IN";


  let finalTranscript =
    "";


  recognition.onstart =
    () => {

      isListening = true;

      finalTranscript =
        messageInput
          ?.value || "";


      showComposerStatus(
        "Listening..."
      );


      updateActionButton();

    };


  recognition.onresult =
    event => {

      let interim =
        "";


      let completed =
        "";


      for (
        let i =
          event.resultIndex;
        i <
          event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0]
            .transcript;


        if (
          event.results[i]
            .isFinal
        ) {

          completed +=
            transcript;

        }

        else {

          interim +=
            transcript;

        }

      }


      if (completed) {

        finalTranscript =
          `${finalTranscript} ${completed}`
            .trim();

      }


      if (
        messageInput
      ) {

        messageInput.value =
          `${finalTranscript} ${interim}`
            .trim();

      }

    };


  recognition.onerror =
    event => {

      console.warn(
        "Voice recognition error:",
        event.error
      );


      if (
        event.error ===
        "not-allowed"
      ) {

        showComposerStatus(
          "Microphone permission was denied."
        );

      }

      else {

        showComposerStatus(
          "Voice input stopped."
        );

      }

    };


  recognition.onend =
    () => {

      isListening =
        false;


      clearComposerStatus();

      updateActionButton();

    };

}


function startVoiceInput() {

  if (
    !recognition
  ) {

    showComposerStatus(
      "Voice input is not supported in this browser."
    );


    setTimeout(
      clearComposerStatus,
      2500
    );


    return;
  }


  if (
    isListening
  ) {

    return;

  }


  try {

    recognition.start();

  }

  catch (error) {

    console.warn(
      "Could not start voice:",
      error
    );

  }

}


function stopVoiceInput() {

  if (
    !recognition ||
    !isListening
  ) {

    return;

  }


  try {

    recognition.stop();

  }

  catch {
    // Ignore
  }


  isListening = false;

  clearComposerStatus();

  updateActionButton();
}


// =========================================================
// 19. SEND MESSAGE
// =========================================================

async function sendMessage(
  forcedMessage = null
) {

  if (
    isGenerating
  ) {

    return;

  }


  stopVoiceInput();

  closeCreateMenu();


  const message =
    String(
      forcedMessage ??
      messageInput?.value ??
      ""
    ).trim();


  if (
    !message &&
    !selectedAttachments.length
  ) {

    updateActionButton();

    return;

  }


  const chatId =
    ensureCurrentChat();


  if (!chatId) {

    appendMessage(
      "assistant",
      "Unable to create a chat."
    );

    return;

  }


  const attachmentsForRequest =
    getAttachmentsForAPI();


  const displayText =
    message ||
    (
      selectedAttachments.length === 1
        ? `Attached: ${selectedAttachments[0].name}`
        : `Attached ${selectedAttachments.length} files`
    );


  appendMessage(
    "user",
    displayText
  );


  currentMessages.push({
    role: "user",
    text: displayText
  });


  persistCurrentMessages();

  renderChatHistory();


  if (messageInput) {

    messageInput.value ="";
messageInput.style.height = "";
  }


  selectedAttachments = [];

  renderAttachmentPreview();


  isGenerating = true;

  requestController =
    new AbortController();


  updateActionButton();


  const thinking =
    createThinkingMessage();


  try {

    const response =
      await fetch(
        "/api/chat",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          signal:
            requestController.signal,

          body:
            JSON.stringify({

              message,

              history:
                currentMessages,

              webSearch:
                Boolean(
                  webSearch
                    ?.checked
                ),

              attachments:
                attachmentsForRequest

            })

        }
      );


    const raw =
      await response.text();


    let data = null;


    try {

      data =
        JSON.parse(raw);

    }

    catch {

      throw new Error(
        raw ||
        "Server returned an invalid response."
      );

    }


    if (!response.ok) {

      throw new Error(
        data?.error ||
        data?.details ||
        `Request failed (${response.status})`
      );

    }


    const reply =
      String(
        data?.reply ??
        data?.message ??
        data?.response ??
        ""
      ).trim();


    if (!reply) {

      throw new Error(
        "ManThink returned an empty response."
      );

    }


    thinking?.remove();


    appendMessage(
      "assistant",
      reply
    );


    currentMessages.push({
      role: "assistant",
      text: reply
    });


    persistCurrentMessages();

    renderChatHistory();

  }

  catch (error) {

    thinking?.remove();


    if (
      error?.name ===
      "AbortError"
    ) {

      showComposerStatus(
        "Response stopped."
      );


      setTimeout(
        clearComposerStatus,
        1500
      );

    }

    else {

      console.error(
        "Chat request failed:",
        error
      );


      appendMessage(
        "assistant",
        `⚠️ ${
          error?.message ||
          "Something went wrong."
        }`
      );

    }

  }

  finally {

    isGenerating =
      false;


    requestController =
      null;


    updateActionButton();

    safeFocusInput();

  }

}


// =========================================================
// 20. STOP GENERATION
// =========================================================

function stopGeneration() {

  if (
    requestController
  ) {

    requestController.abort();

  }


  requestController =
    null;

  isGenerating =
    false;

  updateActionButton();
}


// =========================================================
// 21. ACTION BUTTON CLICK
// =========================================================

function handleActionButton() {

  if (
    isGenerating
  ) {

    stopGeneration();

    return;

  }


  if (
    isListening
  ) {

    stopVoiceInput();

    return;

  }


  const hasContent =
    Boolean(
      messageInput
        ?.value
        .trim()
    ) ||
    selectedAttachments.length >
      0;


  if (hasContent) {

    sendMessage();

    return;

  }


  startVoiceInput();
}


// =========================================================
// 22. QUICK PROMPTS
// =========================================================

function bindQuickPrompts() {

  document
    .querySelectorAll(
      ".quick-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const prompt =
            button.dataset.prompt;


          if (!prompt) return;


          sendMessage(
            prompt
          );

        }
      );

    });

}


// =========================================================
// 23. THEME
// =========================================================

function applyTheme(theme) {

  const light =
    theme === "light";


  body.classList.toggle(
    "light",
    light
  );


  body.classList.toggle(
    "dark",
    !light
  );


  localStorage.setItem(
    THEME_KEY,
    light
      ? "light"
      : "dark"
  );


  if (themeIcon) {

    themeIcon.textContent =
      light
        ? "☀️"
        : "🌙";

  }


  if (themeText) {

    themeText.textContent =
      light
        ? "Light Mode"
        : "Dark Mode";

  }

}


function toggleTheme() {

  const isLight =
    body.classList
      .contains(
        "light"
      );


  applyTheme(
    isLight
      ? "dark"
      : "light"
  );
}


function initializeTheme() {

  const saved =
    localStorage.getItem(
      THEME_KEY
    );


  applyTheme(
    saved === "light"
      ? "light"
      : "dark"
  );
}


// =========================================================
// 24. SETTINGS
// =========================================================

function openSettings() {

  if (!settingsModal) return;


  settingsModal.hidden =
    false;


  body.classList.add(
    "modal-open"
  );
}


function closeSettings() {

  if (!settingsModal) return;


  settingsModal.hidden =
    true;


  body.classList.remove(
    "modal-open"
  );
}


function clearAllChatHistory() {

  const confirmed =
    window.confirm(
      "Clear all saved chat history?"
    );


  if (!confirmed) return;


  if (
    typeof saveChats ===
    "function"
  ) {

    saveChats([]);

  }


  localStorage.removeItem(
    CURRENT_CHAT_KEY
  );


  currentChatId =
    null;

  currentMessages =
    [];


  renderChatHistory();

  renderWelcome();

  closeSettings();
}


// =========================================================
// 25. SIDEBAR
// =========================================================

function openSidebar() {

  if (!isMobile()) return;


  body.classList.add(
    "sidebar-open"
  );


  sidebar?.classList.add(
    "open"
  );


  sidebarOverlay
    ?.setAttribute(
      "aria-hidden",
      "false"
    );
}


function closeSidebar() {

  body.classList.remove(
    "sidebar-open"
  );


  sidebar?.classList.remove(
    "open"
  );


  sidebarOverlay
    ?.setAttribute(
      "aria-hidden",
      "true"
    );


  if (sidebar) {

    sidebar.style.transform =
      "";

  }


  if (sidebarOverlay) {

    sidebarOverlay.style.opacity =
      "";

  }

}


// =========================================================
// 26. MOBILE SWIPE SIDEBAR
// =========================================================

function initializeSidebarGestures() {

  document.addEventListener(
    "touchstart",
    event => {

      if (
        !isMobile() ||
        event.touches.length !== 1
      ) {

        return;

      }


      const touch =
        event.touches[0];


      touchStartX =
        touch.clientX;

      touchStartY =
        touch.clientY;

      touchCurrentX =
        touchStartX;

      touchCurrentY =
        touchStartY;


      const sidebarOpen =
        body.classList
          .contains(
            "sidebar-open"
          );


      sidebarSwipeActive =
        sidebarOpen &&
        sidebar?.contains(
          event.target
        );


      edgeSwipeActive =
        !sidebarOpen &&
        touchStartX <=
          EDGE_SWIPE_ZONE;

    },
    {
      passive: true
    }
  );


  document.addEventListener(
    "touchmove",
    event => {

      if (
        !isMobile() ||
        event.touches.length !== 1
      ) {

        return;

      }


      if (
        !sidebarSwipeActive &&
        !edgeSwipeActive
      ) {

        return;

      }


      const touch =
        event.touches[0];


      touchCurrentX =
        touch.clientX;

      touchCurrentY =
        touch.clientY;


      const dx =
        touchCurrentX -
        touchStartX;


      const dy =
        touchCurrentY -
        touchStartY;


      if (
        Math.abs(dy) >
        Math.abs(dx) * 1.25
      ) {

        return;

      }


      if (
        sidebarSwipeActive
      ) {

        const offset =
          Math.min(
            0,
            dx
          );


        if (sidebar) {

          sidebar.style.transform =
            `translateX(${offset}px)`;

        }


        if (
          sidebarOverlay
        ) {

          const opacity =
            Math.max(
              0,
              1 +
                offset /
                Math.max(
                  sidebar
                    ?.offsetWidth ||
                  300,
                  1
                )
            );


          sidebarOverlay
            .style.opacity =
              String(opacity);

        }

      }


      if (
        edgeSwipeActive &&
        dx > 0
      ) {

        openSidebar();


        const width =
          Math.max(
            sidebar
              ?.offsetWidth ||
            300,
            1
          );


        const offset =
          Math.min(
            0,
            -width + dx
          );


        if (sidebar) {

          sidebar.style.transform =
            `translateX(${offset}px)`;

        }

      }

    },
    {
      passive: true
    }
  );


  document.addEventListener(
    "touchend",
    () => {

      if (
        !isMobile()
      ) {

        sidebarSwipeActive =
          false;

        edgeSwipeActive =
          false;

        return;

      }


      const dx =
        touchCurrentX -
        touchStartX;


      const dy =
        touchCurrentY -
        touchStartY;


      const horizontal =
        Math.abs(dx) >
        Math.abs(dy);


      if (
        sidebarSwipeActive
      ) {

        if (
          horizontal &&
          dx < -SWIPE_TRIGGER
        ) {

          closeSidebar();

        }

        else {

          openSidebar();


          if (sidebar) {

            sidebar.style.transform =
              "";

          }


          if (
            sidebarOverlay
          ) {

            sidebarOverlay.style.opacity =
              "";

          }

        }

      }


      if (
        edgeSwipeActive
      ) {

        if (
          horizontal &&
          dx > SWIPE_TRIGGER
        ) {

          openSidebar();

        }

        else {

          closeSidebar();

        }

      }


      sidebarSwipeActive =
        false;

      edgeSwipeActive =
        false;

    },
    {
      passive: true
    }
  );

}


// =========================================================
// 27. PWA INSTALL
// =========================================================

function initializePWAInstall() {

  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();


      deferredInstallPrompt =
        event;


      if (
        installAppBtn
      ) {

        installAppBtn.hidden =
          false;

      }

    }
  );


  installAppBtn
    ?.addEventListener(
      "click",
      async () => {

        if (
          !deferredInstallPrompt
        ) {

          return;

        }


        deferredInstallPrompt
          .prompt();


        try {

          await deferredInstallPrompt
            .userChoice;

        }

        catch {
          // Ignore
        }


        deferredInstallPrompt =
          null;


        installAppBtn.hidden =
          true;

      }
    );


  window.addEventListener(
    "appinstalled",
    () => {

      deferredInstallPrompt =
        null;


      if (
        installAppBtn
      ) {

        installAppBtn.hidden =
          true;

      }

    }
  );

}


// =========================================================
// 28. RESTORE CHAT
// =========================================================

function restoreCurrentChat() {

  if (
    typeof getCurrentChat !==
    "function"
  ) {

    renderWelcome();

    return;

  }


  const chat =
    getCurrentChat();


  if (!chat) {

    currentChatId =
      null;

    currentMessages =
      [];

    renderWelcome();

    return;

  }


  currentChatId =
    chat.id;


  currentMessages =
    Array.isArray(
      chat.messages
    )
      ? chat.messages.map(
          message => ({
            role:
              normalizeRole(
                message.role
              ),

            text:
              getMessageText(
                message
              )
          })
        )
      : [];


  if (
    currentMessages.length
  ) {

    renderConversation();

  }

  else {

    renderWelcome();

  }

}


// =========================================================
// 29. RESPONSIVE STATE
// =========================================================

function updateResponsiveState() {

  body.classList.toggle(
    "mobile",
    isMobile()
  );


  if (
    !isMobile()
  ) {

    closeSidebar();

  }

}


// =========================================================
// 30. EVENT LISTENERS
// =========================================================

function bindEvents() {

  // Dynamic action button

  actionBtn
    ?.addEventListener(
      "click",
      handleActionButton
    );


  // Input

 messageInput?.addEventListener("input", () => {

    messageInput.style.height = "0px";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            220
        ) + "px";

    updateActionButton();

});


  messageInput
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


  // New Chat

  newChatBtn
    ?.addEventListener(
      "click",
      startNewChat
    );


  mobileNewChatBtn
    ?.addEventListener(
      "click",
      startNewChat
    );


  // Search history

  chatSearch
    ?.addEventListener(
      "input",
      () => {

        renderChatHistory(
          chatSearch.value
        );

      }
    );


  // Sidebar

  menuToggle
    ?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        openSidebar();

      }
    );


  sidebarCloseBtn
    ?.addEventListener(
      "click",
      closeSidebar
    );


  sidebarOverlay
    ?.addEventListener(
      "click",
      closeSidebar
    );


  // Create menu

  createMenuBtn
    ?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        toggleCreateMenu();

      }
    );


  createMenu
    ?.addEventListener(
      "click",
      event => {

        event.stopPropagation();

      }
    );


  uploadFileBtn
    ?.addEventListener(
      "click",
      () => {

        closeCreateMenu();

        filePicker?.click();

      }
    );


  uploadPhotoBtn
    ?.addEventListener(
      "click",
      () => {

        closeCreateMenu();

        photoPicker?.click();

      }
    );


  createWebBtn
    ?.addEventListener(
      "click",
      toggleWebSearch
    );


  webSearch
    ?.addEventListener(
      "change",
      updateWebSearchUI
    );


  filePicker
    ?.addEventListener(
      "change",
      async event => {

        await addFiles(
          event.target.files
        );


        event.target.value =
          "";

      }
    );


  photoPicker
    ?.addEventListener(
      "change",
      async event => {

        await addFiles(
          event.target.files,
          "image"
        );


        event.target.value =
          "";

      }
    );


  // Theme

  themeBtn
    ?.addEventListener(
      "click",
      toggleTheme
    );


  settingsThemeBtn
    ?.addEventListener(
      "click",
      toggleTheme
    );


  // Settings

  settingsBtn
    ?.addEventListener(
      "click",
      () => {

        closeSidebar();

        openSettings();

      }
    );


  closeSettingsBtn
    ?.addEventListener(
      "click",
      closeSettings
    );


  settingsBackdrop
    ?.addEventListener(
      "click",
      closeSettings
    );


  clearHistoryBtn
    ?.addEventListener(
      "click",
      clearAllChatHistory
    );


  // Global outside click

  document.addEventListener(
    "click",
    event => {

      if (
        createMenu &&
        !createMenu.hidden &&
        !createMenu.contains(
          event.target
        ) &&
        !createMenuBtn?.contains(
          event.target
        )
      ) {

        closeCreateMenu();

      }


      if (
        !event.target.closest(
          ".chat-history-item"
        )
      ) {

        closeChatOptionMenus();

      }

    }
  );


  // Escape

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      closeCreateMenu();

      closeChatOptionMenus();

      closeSettings();

      closeSidebar();

    }
  );


  // Resize

  window.addEventListener(
    "resize",
    updateResponsiveState
  );

}


// =========================================================
// 31. INIT
// =========================================================

function init() {

  console.log(
    "ManThink Normal Chat initialized."
  );

  // Theme
  initializeTheme();

  // Mobile / Desktop state
  updateResponsiveState();

  // Browser voice recognition
  setupVoiceRecognition();

  // Mobile sidebar swipe gestures
  initializeSidebarGestures();

  // PWA install button
  initializePWAInstall();

  // All buttons / inputs / UI events
  bindEvents();

  // Restore last opened conversation
  restoreCurrentChat();

  // Load sidebar chat history
  renderChatHistory();

  // Attachment area
  renderAttachmentPreview();

  // Web search button state
  updateWebSearchUI();

  // Mic / Send / Stop button state
  updateActionButton();

  // Focus message box on desktop
  safeFocusInput();

}


// =========================================================
// START
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    init();

  }
);