// memory.js

const MEMORY_KEY = "manthink_memory";

export function loadMemory() {
    const data = localStorage.getItem(MEMORY_KEY);

    if (!data) return {};

    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export function saveMemory(memory) {
    localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
    );
}

export function remember(key, value) {

    const memory = loadMemory();

    memory[key] = value;

    saveMemory(memory);
}

export function forget(key) {

    const memory = loadMemory();

    delete memory[key];

    saveMemory(memory);
}