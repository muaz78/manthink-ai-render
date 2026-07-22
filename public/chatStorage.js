const STORAGE_KEY = "manthink_chats";

function loadChats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveChats(chats) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chats)
  );
}

function createChat() {
  return {
    id: Date.now().toString(),
    title: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
}

function getCurrentChat() {
  const chats = loadChats();

  const id = localStorage.getItem("manthink_current_chat");

  if (!id) return null;

  return chats.find(chat => chat.id === id) || null;
}

function setCurrentChat(id) {
  localStorage.setItem("manthink_current_chat", id);
}

function saveCurrentChat(messages) {

  const chats = loadChats();

  const id = localStorage.getItem("manthink_current_chat");

  if (!id) return;

  const chat = chats.find(c => c.id === id);

  if (!chat) return;

  chat.messages = messages;
  chat.updatedAt = Date.now();

  if (!chat.title && messages.length > 0) {

    const firstUser = messages.find(
      m => m.role === "user"
    );

    if (firstUser) {

      chat.title =
        firstUser.text.length > 35
          ? firstUser.text.substring(0, 35) + "..."
          : firstUser.text;

    }

  }

  saveChats(chats);

}

function deleteChat(id) {

  const chats = loadChats().filter(
    c => c.id !== id
  );

  saveChats(chats);

}

function renameChat(id, title) {

  const chats = loadChats();

  const chat = chats.find(
    c => c.id === id
  );

  if (!chat) return;

  chat.title = title;
  chat.updatedAt = Date.now();

  saveChats(chats);

}