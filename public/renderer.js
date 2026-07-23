document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const themeBtn = document.getElementById("themeBtn");
const chatSearch = document.getElementById("chatSearch");
const menuButtons = Array.from(document.querySelectorAll(".menu-btn"));

const menuToggle =
  document.getElementById("menuToggle");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");
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
          JUST FOR TIME PASS
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
item.textContent =
  "💬 " +
  (chat.title || "Untitled");
    item.onclick = () => {

      currentChatId = chat.id;
      setCurrentChat(chat.id);
      currentChat = chat.messages || [];

      renderChatsPanel();

    };

    historyBox.appendChild(item);

  });

}
  function renderChatsPanel() {

    chatbox.innerHTML = "";

    renderChatHistory();

    if (currentChat.length === 0) {

      renderWelcome();

    } else {

      currentChat.forEach(msg => {

        appendBubble(
          msg.role === "assistant" ? "ai" : "user",
          msg.text
        );

      });

    }

    messageInput.focus();

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
      ?.addEventListener("click", renderChatsPanel);

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

  async function typeReply(
    element,
    text,
    speed = 8
  ) {

    element.textContent = "";

    const reply = String(text || "");

    for (let i = 0; i < reply.length; i++) {

      element.textContent += reply[i];

      scrollBottom();

      await new Promise(resolve =>
        setTimeout(resolve, speed)
      );

    }

  }

  // ========= Part 2 starts here =========
  // async function sendMessage() { ... }
  async function sendMessage() {

    const message = messageInput.value.trim();

    const webSearch =
document.getElementById("webSearch")?.checked || false;

    if (!message) return;

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

    messageInput.value = "";

    appendBubble("user", message);

    // Save user message
    currentChat.push({
      role: "user",
      text: message
    });
updateCurrentChatTitle(message);
saveCurrentChat(currentChat);

    const thinking = appendBubble("ai", "Thinking...");
    thinking.classList.add("typing");

    try {

      const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message,
    history: currentChat,
    webSearch
  })
});

const responseText = await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(responseText);
}

if (!response.ok) {
  throw new Error(data.error || "Server Error");
}

      thinking.classList.remove("typing");

      await typeReply(
        thinking,
        data.reply,
        7
      );

      // Save AI reply
      currentChat.push({
        role: "assistant",
        text: data.reply
      });

     saveCurrentChat(currentChat);
      renderChatHistory();
    } catch (err) {

      thinking.classList.remove("typing");

      thinking.textContent =
        "❌ " +
        (err.message || "Unknown Error");

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
  // Enter Key
  // ===========================
chatSearch?.addEventListener("input", e=>{

  renderChatHistory(e.target.value);

});
  messageInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

      }

    }
  );

});
