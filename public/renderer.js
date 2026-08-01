document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const themeBtn = document.getElementById("themeBtn");
const chatSearch = document.getElementById("chatSearch");
const menuButtons = Array.from(document.querySelectorAll(".menu-btn"));
const installAppBtn = document.getElementById("installAppBtn");
const codePreviewModal = document.getElementById("codePreviewModal");
const codePreviewFrame = document.getElementById("codePreviewFrame");
const closeCodePreview = document.getElementById("closeCodePreview");
const createMenuBtn = document.getElementById("createMenuBtn");
const createMenu = document.getElementById("createMenu");

const uploadFileBtn = document.getElementById("uploadFileBtn");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");

const filePicker = document.getElementById("filePicker");
const photoPicker = document.getElementById("photoPicker");
const attachmentPreview =
  document.getElementById("attachmentPreview");

let selectedAttachments = [];

const menuToggle =
  document.getElementById("menuToggle");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");
  // =========================
// Create Menu
// =========================

// Open / close menu
createMenuBtn?.addEventListener("click", (event) => {

  event.stopPropagation();

  if (!createMenu) return;

  createMenu.hidden = !createMenu.hidden;

});

// Files
uploadFileBtn?.addEventListener("click", () => {

  filePicker?.click();

  if (createMenu) {
    createMenu.hidden = true;
  }

});

// Photos
uploadPhotoBtn?.addEventListener("click", () => {

  photoPicker?.click();

  if (createMenu) {
    createMenu.hidden = true;
  }

});

// Outside click = close menu
document.addEventListener("click", (event) => {

  if (
    createMenu &&
    createMenuBtn &&
    !createMenu.contains(event.target) &&
    !createMenuBtn.contains(event.target)
  ) {
    createMenu.hidden = true;
  }

});

// =========================
// Attachment Preview
// =========================

function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(
        new Error(`Failed to read ${file.name}`)
      );
    };

    reader.readAsDataURL(file);

  });

}

function formatFileSize(bytes) {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function renderAttachments() {

  if (!attachmentPreview) return;

  attachmentPreview.innerHTML = "";

  // Koi attachment nahi hai
  if (selectedAttachments.length === 0) {
    attachmentPreview.hidden = true;
    return;
  }

  attachmentPreview.hidden = false;


  selectedAttachments.forEach((item, index) => {

    const card = document.createElement("div");
    card.className = "attachment-card";


    // =========================
    // Image Thumbnail
    // =========================

    if (item.file.type.startsWith("image/")) {

      const image = document.createElement("img");

      image.className = "attachment-thumb";
      image.src = item.previewUrl;
      image.alt = item.file.name;

      card.appendChild(image);

    } else {

      // Normal file icon

      const icon = document.createElement("div");

      icon.className = "attachment-file-icon";
      icon.textContent = "📄";

      card.appendChild(icon);
    }


    // =========================
    // File Information
    // =========================

    const info = document.createElement("div");
    info.className = "attachment-info";

    const name = document.createElement("strong");
    name.textContent = item.file.name;

    const details = document.createElement("small");

    details.textContent =
      formatFileSize(item.file.size);

    info.appendChild(name);
    info.appendChild(details);


    // =========================
    // Remove Button
    // =========================

    const removeButton =
      document.createElement("button");

    removeButton.className =
      "attachment-remove";

    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.title = "Remove";

    removeButton.addEventListener("click", () => {

      const removed =
        selectedAttachments[index];

      if (removed?.previewUrl) {
        URL.revokeObjectURL(
          removed.previewUrl
        );
      }

      selectedAttachments.splice(
        index,
        1
      );

      renderAttachments();
    });


    card.appendChild(info);
    card.appendChild(removeButton);

    attachmentPreview.appendChild(card);
  });
}


// =========================
// File Picker
// =========================

filePicker?.addEventListener(
  "change",
  () => {

    const files =
      Array.from(filePicker.files || []);

    files.forEach(file => {

      selectedAttachments.push({

        file,

        previewUrl:
          file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null

      });

    });

    // Same file dobara select karne allow karega
    filePicker.value = "";

    renderAttachments();
  }
);


// =========================
// Photo Picker
// =========================

photoPicker?.addEventListener(
  "change",
  () => {

    const files =
      Array.from(photoPicker.files || []);

    files.forEach(file => {

      selectedAttachments.push({

        file,

        previewUrl:
          URL.createObjectURL(file)

      });

    });

    photoPicker.value = "";

    renderAttachments();
  }
);

  // =========================
// PWA Install
// =========================

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  // Browser ka automatic prompt rok kar
  // apne Install button se control karenge
  event.preventDefault();

  deferredInstallPrompt = event;

  if (installAppBtn) {
    installAppBtn.hidden = false;
  }
});

installAppBtn?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();

  const { outcome } =
    await deferredInstallPrompt.userChoice;

  console.log("PWA install:", outcome);

  deferredInstallPrompt = null;
  installAppBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  console.log("ManThink installed successfully");

  deferredInstallPrompt = null;

  if (installAppBtn) {
    installAppBtn.hidden = true;
  }
});
// =========================
// Code Preview
// =========================

function openCodePreview(code) {
  if (!codePreviewModal || !codePreviewFrame) return;

  codePreviewFrame.srcdoc = code;
  codePreviewModal.hidden = false;

  document.body.classList.add("preview-open");
}

function closePreview() {
  if (!codePreviewModal || !codePreviewFrame) return;

  codePreviewModal.hidden = true;
  codePreviewFrame.srcdoc = "";

  document.body.classList.remove("preview-open");
}

closeCodePreview?.addEventListener("click", closePreview);

codePreviewModal?.addEventListener("click", (event) => {
  if (event.target === codePreviewModal) {
    closePreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !codePreviewModal?.hidden) {
    closePreview();
  }
});
// =========================
// Mobile Sidebar
// =========================

menuToggle?.addEventListener("click", () => {

    document.body.classList.toggle("sidebar-open");

});
sidebarOverlay?.addEventListener("click", () => {

    document.body.classList.remove("sidebar-open");

});

  if (!chatbox || !messageInput || !sendBtn || !newChatBtn || !themeBtn) {
    console.error("Required elements not found.");
    return;
  }

  let activeView = "chats";
  // Current Chat History
  let currentChat = [];
  // Current active chat
  let currentChatId = null;
  // =========================
// Device Mode
// =========================

function updateDeviceMode() {

  const isMobile = window.innerWidth <= 768;

  document.body.classList.toggle("mobile", isMobile);

  document.body.classList.toggle("desktop", !isMobile);
  if (!isMobile) {

    document.body.classList.remove("sidebar-open");

}

}

updateDeviceMode();

window.addEventListener(
  "resize",
  updateDeviceMode
);
  // =========================
  // Theme
  // =========================

  function setTheme(theme) {
    body.classList.remove("dark", "light");
    body.classList.add(theme);

    localStorage.setItem("manthink-theme", theme);

    themeBtn.textContent =
      theme === "dark"
        ? "🌙 Dark Mode"
        : "☀️ Light Mode";
  }

  function toggleTheme() {
    const nextTheme = body.classList.contains("dark")
      ? "light"
      : "dark";

    setTheme(nextTheme);
  }

  // =========================
  // Sidebar
  // =========================

  function setActiveMenu(label) {
    menuButtons.forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.textContent.includes(label)
      );
    });
  }

  // =========================
  // Chat Helpers
  // =========================

  function scrollBottom() {
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  function attachQuickButtons() {
    document.querySelectorAll(".quick-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        messageInput.value =
          btn.dataset.prompt || btn.textContent.trim();

        messageInput.focus();
      });
    });
  }

  // =========================
  // Welcome Screen
  // =========================

  function renderWelcome() {
    activeView = "chats";

    chatbox.innerHTML = `
      <div id="welcomeCard" class="welcome-card">

        <div class="welcome-tag">
          Welcome
        </div>

        <div class="mini-note">
          Still in development 
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
            data-prompt="Help me learn AI from scratch."
          >
            Learn AI
          </button>

          <button
            class="quick-btn"
            data-prompt="Help me design a tycoon game idea."
          >
            Game Idea
          </button>

          <button
            class="quick-btn"
            data-prompt="Explain JavaScript scope simply."
          >
            JS Scope
          </button>

          <button
            class="quick-btn"
            data-prompt="Make my app UI premium."
          >
            UI Polish
          </button>

        </div>

      </div>
    `;

    attachQuickButtons();

    setActiveMenu("Chats");
  }

  // =========================
  // Generic Panel
  // =========================

  function renderPanel(
    tag,
    title,
    text,
    extraHtml = ""
  ) {

    activeView = "panel";

    chatbox.innerHTML = `
      <div class="welcome-card">

        <div class="welcome-tag">
          ${tag}
        </div>

        <h2>
          ${title}
        </h2>

        <p>
          ${text}
        </p>

        ${extraHtml}

      </div>
    `;
  }

  // =========================
  // Chats
  // =========================

  function renderChatHistory(filter = "") {

  const historyBox = document.getElementById("chatHistory");

  if (!historyBox) return;

  historyBox.innerHTML = "";

  let chats = loadChats();

  // Latest first
  chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  
  chats = chats.filter(chat =>
  Array.isArray(chat.messages) &&
  chat.messages.length > 0
);

  if (filter) {

    const search = filter.toLowerCase();

    chats = chats.filter(chat =>
      (chat.title || "")
      .toLowerCase()
      .includes(search)
    );

  }

  chats.forEach(chat => {

    const item = document.createElement("div");

    item.className = "chat-item";

    if (chat.id === currentChatId) {
      item.classList.add("active");
    }
// Chat title
const title = document.createElement("span");

title.className = "chat-item-title";

title.textContent =
  "💬 " + (chat.title || "Untitled");


// Three-dot menu button
const menuBtn = document.createElement("button");

menuBtn.className = "chat-more-btn";
menuBtn.type = "button";
menuBtn.textContent = "⋯";
menuBtn.title = "Chat options";


// Dropdown
const menu = document.createElement("div");

menu.className = "chat-options-menu";
menu.hidden = true;


// Delete button
const deleteBtn = document.createElement("button");

deleteBtn.className = "chat-delete-btn";
deleteBtn.type = "button";
deleteBtn.textContent = "🗑 Delete";


// Open chat
title.addEventListener("click", () => {

  currentChatId = chat.id;

  setCurrentChat(chat.id);

  currentChat = chat.messages || [];

  renderChatsPanel();

});


// Open / close three-dot menu
menuBtn.addEventListener("click", (event) => {

  event.preventDefault();
  event.stopPropagation();

  console.log("3 dots clicked");

  document
    .querySelectorAll(".chat-options-menu")
    .forEach(otherMenu => {

      if (otherMenu !== menu) {
        otherMenu.hidden = true;
      }

    });

  menu.hidden = !menu.hidden;

});


// Delete chat
deleteBtn.addEventListener("click", (event) => {

  event.stopPropagation();

  const confirmed = confirm(
    `Delete "${chat.title || "Untitled"}"?`
  );

  if (!confirmed) {
    return;
  }


  const chats = loadChats();

  const updatedChats =
    chats.filter(savedChat =>
      savedChat.id !== chat.id
    );

  saveChats(updatedChats);


  // Agar currently open chat delete hui
  if (currentChatId === chat.id) {

    currentChatId = null;

    currentChat = [];

    setCurrentChat(null);

    renderChatsPanel();

    return;
  }


  renderChatHistory(
    chatSearch?.value || ""
  );

});


menu.appendChild(deleteBtn);

item.appendChild(title);
item.appendChild(menuBtn);
item.appendChild(menu);

historyBox.appendChild(item);

  });

}
  function renderChatsPanel() {

    chatbox.innerHTML = "";

    renderChatHistory();

    if (currentChat.length === 0) {

      renderWelcome();

    } else {

     currentChat.forEach(async (msg) => {

  if (msg.role === "assistant") {

    const bubble = appendBubble("ai", "");

    await renderSavedReply(
      bubble,
      msg.text
    );

  } else {

    appendBubble(
      "user",
      msg.text
    );

  }

});

    }

  }

  // =========================
  // Memory
  // =========================

  function renderMemoryPanel() {

    renderPanel(
      "🧠 Memory",
      "AI Memory Center",
      "This section will store memories in future versions.",

      `
      <div class="mini-note">
        Memory System Coming Soon
      </div>

      <div
        class="quick-grid"
        style="margin-top:18px;"
      >

        <button class="quick-btn">
          Remember Name
        </button>

        <button class="quick-btn">
          Remember Goals
        </button>

        <button class="quick-btn">
          Forget Memory
        </button>

        <button class="quick-btn">
          Show Memory
        </button>

      </div>
      `
    );

  }

  // =========================
  // about the developer
  // =========================

  function renderProfilePanel() {
    renderPanel(
      "👨‍💻 About the Developer",
      "Mohammad Muaz",
      "Founder & Developer of ManThink AI",
      `
      <div class="mini-note">Developer Information</div>

      <div style="
        margin-top:20px;
        line-height:2;
        font-size:16px;
      ">

        <div><strong>👤 Name:</strong> Mohammad Muaz multani</div>

        <div><strong>🎂 Age:</strong> 17</div>

        <div><strong>🌍 Country:</strong> India 🇮🇳</div>

        <div><strong>🎓 Education:</strong> 12th Student</div>

        <div><strong>📷 Instagram:</strong> @m_muadh_m</div>

        <div><strong>💻 GitHub:</strong> github.com/muaz78</div>

        <div><strong>🚀 Role:</strong> Founder & Developer of ManThink AI</div>

      </div>

      <div style="
        margin-top:22px;
        padding:16px;
        border-radius:14px;
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.08);
        line-height:1.8;
      ">

        Passionate about Artificial Intelligence,
        Web Development, and Game Development.
        Building modern AI applications that help
        people learn, create, and solve problems.

      </div>
    `
    );
  }

  // =========================
  // Settings
  // =========================

  function renderSettingsPanel() {

    renderPanel(
      "⚙ Settings",
      "Application Settings",
      "Manage local settings.",

      `
      <div
        class="quick-grid"
        style="margin-top:18px;"
      >

        <button
          id="clearChatsBtn"
          class="quick-btn"
        >
          Clear Chat
        </button>

        <button
          id="resetThemeBtn"
          class="quick-btn"
        >
          Reset Theme
        </button>

        <button
          id="darkBtn"
          class="quick-btn"
        >
          Dark Mode
        </button>

        <button
          id="lightBtn"
          class="quick-btn"
        >
          Light Mode
        </button>

      </div>
      `
    );

    document
      .getElementById("clearChatsBtn")
      ?.addEventListener("click", () => {
        localStorage.removeItem("manthink-chats");
        currentChatId = null;
        currentChat = [];
        renderChatsPanel();
      });

    document
      .getElementById("resetThemeBtn")
      ?.addEventListener("click", () => {

        localStorage.removeItem("manthink-theme");

        setTheme("dark");

      });

    document
      .getElementById("darkBtn")
      ?.addEventListener("click", () => setTheme("dark"));

    document
      .getElementById("lightBtn")
      ?.addEventListener("click", () => setTheme("light"));

  }

  // =========================
  // Chat Bubble
  // =========================

  function removeWelcome() {
    document
      .getElementById("welcomeCard")
      ?.remove();
  }

  function appendBubble(role, text) {

    const bubble = document.createElement("div");

    bubble.className = `bubble ${role}`;

    bubble.textContent = text;

    chatbox.appendChild(bubble);

    scrollBottom();

    return bubble;

  }

async function renderSavedReply(element, text) {

  // Saved message ko typing animation ke bina render karo
  await typeReply(
    element,
    text,
    0
  );

}

 async function typeReply(
  element,
  text,
  speed = 8
) {

  element.textContent = "";

  const reply = String(text || "");

  // Typing animation
  for (let i = 0; i < reply.length; i++) {

    element.textContent += reply[i];

    scrollBottom();

   if (speed > 0) {
  await new Promise(resolve =>
    setTimeout(resolve, speed)
  );
}
  }

  // Typing complete hone ke baad Markdown render
 if (window.marked) {
  element.innerHTML = window.marked.parse(reply);

// =========================
// Multi-file Project Detection
// =========================

const projectFiles = {
  html: null,
  css: null,
  javascript: null
};

element.querySelectorAll("pre code").forEach((block) => {

  const languageClass = Array.from(block.classList)
    .find(cls => cls.startsWith("language-"));

  if (!languageClass) return;

  const lang = languageClass
    .replace("language-", "")
    .toLowerCase();

  if (lang === "html") {
    projectFiles.html = block.textContent;
  }

  if (lang === "css") {
    projectFiles.css = block.textContent;
  }

  if (
    lang === "javascript" ||
    lang === "js"
  ) {
    projectFiles.javascript = block.textContent;
  }

});

  // Code blocks enhance karo
  element.querySelectorAll("pre code").forEach((codeBlock) => {

    // Syntax highlighting
    if (window.hljs) {
      hljs.highlightElement(codeBlock);
    }

    const pre = codeBlock.parentElement;

    // Language detect karo
    let language = "Code";

    const languageClass = Array.from(codeBlock.classList)
      .find(cls => cls.startsWith("language-"));

    if (languageClass) {
      language = languageClass
        .replace("language-", "");

      language =
        language.charAt(0).toUpperCase() +
        language.slice(1);
    }

    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    // Header
    const header = document.createElement("div");
    header.className = "code-header";

    const languageLabel = document.createElement("span");
    languageLabel.textContent = language;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-code-btn";
    copyButton.type = "button";
    copyButton.textContent = "Copy";

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          codeBlock.textContent
        );

        copyButton.textContent = "Copied ✓";

        setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 1500);

      } catch (error) {
        console.error("Copy failed:", error);
      }
    });

    header.appendChild(languageLabel);

const codeActions = document.createElement("div");
codeActions.className = "code-actions";

// Sirf HTML code ke liye Preview button
if (language.toLowerCase() === "html") {

  // Preview button
  const previewButton = document.createElement("button");

  previewButton.className = "preview-code-btn";
  previewButton.type = "button";
  previewButton.textContent = "Preview";

  previewButton.addEventListener("click", () => {

  let previewCode = codeBlock.textContent;

  // Agar separate CSS block mila hai,
  // use HTML ke andar inject karo
  if (projectFiles.css) {
    previewCode = previewCode.includes("</head>")
      ? previewCode.replace(
          "</head>",
          `<style>${projectFiles.css}</style></head>`
        )
      : `<style>${projectFiles.css}</style>${previewCode}`;
  }

  // Agar separate JavaScript block mila hai,
  // use HTML ke andar inject karo
  if (projectFiles.javascript) {
    previewCode = previewCode.includes("</body>")
      ? previewCode.replace(
          "</body>",
          `<script>${projectFiles.javascript}<\/script></body>`
        )
      : `${previewCode}<script>${projectFiles.javascript}<\/script>`;
  }

  openCodePreview(previewCode);
});

  codeActions.appendChild(previewButton);


  // Download button
  const downloadButton = document.createElement("button");

  downloadButton.className = "download-code-btn";
  downloadButton.type = "button";
  downloadButton.textContent = "Download";

 downloadButton.textContent =
  projectFiles.css || projectFiles.javascript
    ? "Download Project"
    : "Download";

downloadButton.addEventListener("click", async () => {

  // Multi-file project hai
  if (projectFiles.css || projectFiles.javascript) {

    if (!window.JSZip) {
      console.error("JSZip not loaded");
      return;
    }

    const zip = new JSZip();

    // HTML
    zip.file(
      "index.html",
      projectFiles.html || codeBlock.textContent
    );

    // CSS
    if (projectFiles.css) {
      zip.file("style.css", projectFiles.css);
    }

    // JavaScript
    if (projectFiles.javascript) {
      zip.file(
        "script.js",
        projectFiles.javascript
      );
    }

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    const url = URL.createObjectURL(zipBlob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "manthink-project.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Give the browser time to start the download before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);

    return;
  }

  // Single HTML project
  const code = codeBlock.textContent;

  const blob = new Blob(
    [code],
    { type: "text/html;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "manthink-project.html";

  document.body.appendChild(link);

  link.click();
  link.remove();

  // Give the browser time to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

codeActions.appendChild(downloadButton);

}

codeActions.appendChild(copyButton);
header.appendChild(codeActions);
    // pre ko wrapper me move karo
    pre.parentNode.insertBefore(wrapper, pre);

    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });

} else {
  element.textContent = reply;
}

scrollBottom();
}
  // ========= Part 2 starts here =========
  // async function sendMessage() { ... }
async function sendMessage() {

  const message = messageInput.value.trim();

  // Current attachments ki copy
  const attachmentsToSend = [
    ...selectedAttachments
  ];

  const webSearch =
    document.getElementById("webSearch")?.checked || false;


  // Message aur attachment dono empty hain
  if (
    !message &&
    attachmentsToSend.length === 0
  ) {
    return;
  }


  // =========================
  // Create Chat If Needed
  // =========================

  if (!currentChatId) {

    const chats = loadChats();

    const chat = createChat();

    chats.unshift(chat);

    saveChats(chats);

    currentChatId = chat.id;

    setCurrentChat(chat.id);
  }


  if (activeView !== "chats") {
    renderChatsPanel();
  }


  removeWelcome();


  // =========================
  // Show User Message
  // =========================

  messageInput.value = "";

  const displayMessage =
    message ||
    (
      attachmentsToSend.length === 1
        ? `📎 ${attachmentsToSend[0].file.name}`
        : `📎 ${attachmentsToSend.length} attachments`
    );

  appendBubble(
    "user",
    displayMessage
  );


  // =========================
  // Save User Message
  // =========================

  currentChat.push({
    role: "user",
    text: displayMessage
  });


  updateCurrentChatTitle(
    message || displayMessage
  );

  saveCurrentChat(currentChat);

  renderChatHistory();


  // =========================
  // Thinking Loader
  // =========================

  const thinking =
    appendBubble("ai", "");

  thinking.classList.add("typing");

  thinking.innerHTML = `
    <l-quantum
      size="32"
      speed="1.75"
      color="#10a37f">
    </l-quantum>
  `;


  try {

    // =========================
    // Convert Attachments
    // =========================

    const attachments =
      await Promise.all(

        attachmentsToSend.map(
          async item => ({

            name:
              item.file.name,

            type:
              item.file.type ||
              "application/octet-stream",

            size:
              item.file.size,

            data:
              await fileToBase64(
                item.file
              )

          })
        )

      );


    console.log(
      "Sending attachments:",
      attachments.length
    );


    // =========================
    // API Request
    // =========================

    const response =
      await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          message,

          history: currentChat,

          webSearch,

          attachments

        })

      });


    // =========================
    // Read Server Response
    // =========================

    const responseText =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(responseText);

    } catch {

      throw new Error(
        responseText ||
        "Invalid server response"
      );

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Server Error"
      );

    }


    if (!data.reply) {

      throw new Error(
        "AI returned an empty response."
      );

    }


    // =========================
    // Remove Loader
    // =========================

    thinking.classList.remove(
      "typing"
    );

    thinking.innerHTML = "";


    // =========================
    // Type AI Response
    // =========================

    await typeReply(
      thinking,
      data.reply,
      7
    );


    // =========================
    // Save AI Reply
    // =========================

    currentChat.push({
      role: "assistant",
      text: data.reply
    });


    // =========================
    // Clear Sent Attachments
    // ONLY after success
    // =========================

    attachmentsToSend.forEach(
      item => {

        if (item.previewUrl) {

          URL.revokeObjectURL(
            item.previewUrl
          );

        }

      }
    );


    selectedAttachments = [];

    renderAttachments();


    // =========================
    // Save Chat
    // =========================

    saveCurrentChat(
      currentChat
    );

    renderChatHistory();


    console.log(
      "AI Model:",
      data.model
    );


  } catch (err) {

    console.error(
      "Send message failed:",
      err
    );


    thinking.classList.remove(
      "typing"
    );


    thinking.textContent =
      "❌ " +
      (
        err.message ||
        "Unknown Error"
      );

    // Attachment intentionally clear nahi hogi.
    // User retry kar sakta hai.
  }


  scrollBottom();

}
  function newChat() {

    const chats = loadChats();

   currentChatId = null;
currentChat = [];

    currentChat = [];

    renderChatsPanel();

    messageInput.value = "";

    messageInput.focus();

  }
  function updateCurrentChatTitle(message){

    const chats = loadChats();

    const chat = chats.find(c => c.id === currentChatId);

    if(!chat) return;

    if(!chat.title){

        chat.title =
            message.length > 30
            ? message.substring(0,30) + "..."
            : message;

    }

    chat.updatedAt = Date.now();

    saveChats(chats);

}
  // ===========================
  // Initial Theme
  // ===========================

  const savedTheme =
    localStorage.getItem("manthink-theme")
    || "dark";

  setTheme(savedTheme);

  renderChatsPanel();

  messageInput.focus();

  // ===========================
  // Buttons
  // ===========================

  themeBtn.addEventListener(
    "click",
    toggleTheme
  );

  newChatBtn.addEventListener(
    "click",
    newChat
  );

  sendBtn.addEventListener(
    "click",
    sendMessage
  );

  // ===========================
// Sidebar Menu
// ===========================

menuButtons.forEach(button => {

  button.addEventListener("click", () => {

    menuButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    const label = button.textContent;

    if (label.includes("Chats")) {
      renderChatsPanel();
    }

    else if (label.includes("Memories")) {
      renderMemoryPanel();
    }

    else if (label.includes("Profile")) {
      renderProfilePanel();
    }

    else if (label.includes("Settings")) {
      renderSettingsPanel();
    }

  });

});


// ===========================
// Search
// ===========================

chatSearch?.addEventListener("input", event => {
  renderChatHistory(event.target.value);
});


// ===========================
// Enter Key
// ===========================

messageInput?.addEventListener("keydown", event => {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendMessage();

  }

});

});

  // ===========================
  // Enter Key
  // ===========================
  chatSearch?.addEventListener("input", event => {
    renderChatHistory(event.target.value);
  });

 messageInput?.addEventListener("keydown", event => {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendMessage();

  }

});