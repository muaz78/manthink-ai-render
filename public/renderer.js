document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const chatbox = document.getElementById("chatbox");
  const messageInput = document.getElementById("message");
  const sendBtn = document.getElementById("sendBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const themeBtn = document.getElementById("themeBtn");
  const menuButtons = Array.from(document.querySelectorAll(".menu-btn"));

  if (!chatbox || !messageInput || !sendBtn || !newChatBtn || !themeBtn) {
    console.error("Required elements not found.");
    return;
  }

  let activeView = "chats";

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

  function renderChatsPanel() {
    renderWelcome();
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
  // Profile
  // =========================

  function renderProfilePanel() {

    renderPanel(
      "👤 Profile",
      "Muaz Multani",
      "Creator of ManThink AI.",

      `
      <div class="mini-note">
        Version 1.0
      </div>

      <div
        style="
          margin-top:16px;
          line-height:2;
        "
      >

        <div>
          <strong>Project:</strong>
          ManThink AI
        </div>

        <div>
          <strong>Mode:</strong>
          Web AI Assistant
        </div>

        <div>
          <strong>Status:</strong>
          Online
        </div>

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

    if (!message) return;

    if (activeView !== "chats") {
      renderChatsPanel();
    }

    removeWelcome();

    messageInput.value = "";

    appendBubble("user", message);

    const thinking = appendBubble("ai", "Thinking...");
    thinking.classList.add("typing");

    try {

      const response = await fetch("/api/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message
        })

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Server Error"
        );
      }

      thinking.classList.remove("typing");

      await typeReply(
        thinking,
        data.reply,
        7
      );

    } catch (err) {

      thinking.classList.remove("typing");

      thinking.textContent =
        "❌ " +
        (err.message || "Unknown Error");

    }

    scrollBottom();

  }

  function newChat() {

    renderChatsPanel();

    messageInput.value = "";

    messageInput.focus();

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