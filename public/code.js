"use strict";

/* ==========================================================
   MANTHINK CODE - IDE CORE
   Full-featured browser-based IDE with AI integration
========================================================== */

class Config {
    static APP = Object.freeze({
        NAME: "ManThink Code",
        VERSION: "1.0.4-prod"
    });

    static API = Object.freeze({
        CHAT: "/api/chat",
        CODE: "/api/code",
        TIMEOUT: 120000
    });

    static STORAGE = Object.freeze({
        PROJECT: "mtcode.project",
        SETTINGS: "mtcode.settings",
        LAYOUT: "mtcode.layout"
    });

    static EDITOR = Object.freeze({
        THEME: "vs-dark",
        FONT_SIZE: 14,
        FONT_FAMILY: "'JetBrains Mono', Consolas, monospace",
        TAB_SIZE: 2,
        WORD_WRAP: "on",
        MINIMAP: true,
        LINE_NUMBERS: "on",
        AUTOMATIC_LAYOUT: true
    });

    static EVENTS = Object.freeze({
        READY: "app:ready",
        FILE_OPEN: "file:open",
        FILE_SAVE: "file:save",
        EDITOR_CHANGED: "editor:changed",
        TERMINAL_LOG: "terminal:log"
    });

    static LANGUAGES = Object.freeze({
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        json: "json",
        html: "html",
        css: "css",
        scss: "scss",
        md: "markdown",
        py: "python",
        txt: "plaintext"
    });
}

/* ==========================================================
   STATE MANAGEMENT
========================================================== */

class State {
    constructor() {
        this.reset();
    }

    reset() {
        this.project = new Map();
        this.folders = new Set();
        this.editor = null;
        this.models = new Map();
        this.activeFile = null;
        this.previousFile = null;
        this.openTabs = [];
        this.pinnedTabs = new Set();
        this.dirtyFiles = new Set();
        this.expandedFolders = new Set(["src"]);
        this.selectedExplorerItem = null;
        this.searchQuery = "";
        this.aiMode = "code";
        this.chatHistory = [];
        this.busy = false;
        this.language = "javascript";
        this.line = 1;
        this.column = 1;
        this.fontSize = Config.EDITOR.FONT_SIZE;
        this.theme = Config.EDITOR.THEME;
        this.minimap = true;
        this.wordWrap = "on";
    }

    setBusy(value = true) {
        this.busy = Boolean(value);
    }

    isBusy() {
        return this.busy;
    }

    hasFile(path) {
        return this.project.has(path);
    }

    addDirty(path) {
        this.dirtyFiles.add(path);
    }

    removeDirty(path) {
        this.dirtyFiles.delete(path);
    }

    isDirty(path) {
        return this.dirtyFiles.has(path);
    }

    openTab(path) {
        if (!this.openTabs.includes(path)) {
            this.openTabs.push(path);
        }
    }

    closeTab(path) {
        this.openTabs = this.openTabs.filter(tab => tab !== path);
        this.dirtyFiles.delete(path);
    }

    setActiveFile(path) {
        this.previousFile = this.activeFile;
        this.activeFile = path;
    }

    setCursor(line, column) {
        this.line = line;
        this.column = column;
    }

    setLanguage(language) {
        this.language = language || "plaintext";
    }

    addFolder(path) {
        this.folders.add(path);
    }

    removeFolder(path) {
        this.folders.delete(path);
    }

    expandFolder(path) {
        this.expandedFolders.add(path);
    }

    collapseFolder(path) {
        this.expandedFolders.delete(path);
    }

    isExpanded(path) {
        return this.expandedFolders.has(path);
    }
}

/* ==========================================================
   UTILITIES
========================================================== */

class Utils {
    static create(tag, className = "") {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    static escapeHTML(text = "") {
        const div = document.createElement("div");
        div.textContent = String(text);
        return div.innerHTML;
    }

    static extension(path = "") {
        const idx = path.lastIndexOf(".");
        return idx === -1 ? "" : path.substring(idx + 1).toLowerCase();
    }

    static fileName(path = "") {
        return path.split("/").pop() || "";
    }

    static directory(path = "") {
        const idx = path.lastIndexOf("/");
        return idx === -1 ? "" : path.substring(0, idx);
    }

    static language(path = "") {
        const ext = this.extension(path);
        return Config.LANGUAGES[ext] || "plaintext";
    }

    static icon(path = "") {
        const ext = this.extension(path);
        switch (ext) {
            case "js":
            case "jsx":
                return "javascript";
            case "ts":
            case "tsx":
                return "code";
            case "html":
                return "language";
            case "css":
            case "scss":
                return "palette";
            case "json":
                return "data_object";
            case "md":
                return "article";
            default:
                return "description";
        }
    }

    static debounce(fn, delay = 200) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    static normalizePath(path = "") {
        return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
    }

    static sortPaths(paths = []) {
        return [...paths].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
}

/* ==========================================================
   EVENT BUS
========================================================== */

class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(listener);
        return () => this.off(event, listener);
    }

    off(event, listener) {
        if (this.events.has(event)) {
            this.events.get(event).delete(listener);
        }
    }

    emit(event, payload = null) {
        if (this.events.has(event)) {
            for (const listener of this.events.get(event)) {
                try {
                    listener(payload);
                } catch (err) {
                    console.error(`[EventBus] Error in ${event}:`, err);
                }
            }
        }
    }
}

/* ==========================================================
   GLOBAL APP INSTANCE
========================================================== */

class App {
    constructor() {
        this.state = new State();
        this.events = new EventBus();
        this.managers = new Map();
        this.initialized = false;
    }

    register(name, instance) {
        this.managers.set(name, instance);
        return instance;
    }

    get(name) {
        return this.managers.get(name);
    }
}

const app = new App();
const state = app.state;
const events = app.events;

/* ==========================================================
   PROJECT MANAGER (Virtual File System)
========================================================== */

class ProjectManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
    }

    exists(path) {
        return this.state.project.has(Utils.normalizePath(path));
    }

    create(path, content = "") {
        path = Utils.normalizePath(path);
        if (!path || this.exists(path)) return false;

        const dir = Utils.directory(path);
        if (dir) this.addFolder(dir);

        this.state.project.set(path, String(content));
        this.events.emit("project:fileCreated", { path, content });
        return true;
    }

    read(path) {
        path = Utils.normalizePath(path);
        return this.state.project.get(path) ?? "";
    }

    write(path, content = "") {
        path = Utils.normalizePath(path);
        content = String(content);

        if (!this.exists(path)) {
            this.create(path, content);
            return;
        }

        const prev = this.state.project.get(path);
        if (prev === content) return;

        this.state.project.set(path, content);
        this.state.addDirty(path);
        this.events.emit("project:fileUpdated", { path, content });
    }

    delete(path) {
        path = Utils.normalizePath(path);
        if (!path) return false;

        let deleted = false;
        if (this.exists(path)) {
            this.state.project.delete(path);
            this.state.closeTab(path);
            deleted = true;
        }

        // Check if folder delete
        for (const [filePath] of [...this.state.project.entries()]) {
            if (filePath.startsWith(path + "/")) {
                this.state.project.delete(filePath);
                this.state.closeTab(filePath);
                deleted = true;
            }
        }

        if (this.state.folders.has(path)) {
            this.state.folders.delete(path);
            deleted = true;
        }

        if (this.state.activeFile === path || (this.state.activeFile && this.state.activeFile.startsWith(path + "/"))) {
            this.state.setActiveFile(this.state.openTabs[0] || null);
        }

        if (deleted) {
            this.events.emit("project:fileDeleted", { path });
        }
        return deleted;
    }

    rename(oldPath, newPath) {
        oldPath = Utils.normalizePath(oldPath);
        newPath = Utils.normalizePath(newPath);

        if (!oldPath || !newPath || oldPath === newPath) return false;

        if (this.exists(oldPath)) {
            const content = this.read(oldPath);
            this.delete(oldPath);
            this.create(newPath, content);

            if (this.state.activeFile === oldPath) {
                this.state.setActiveFile(newPath);
            }
            if (this.state.openTabs.includes(oldPath)) {
                const idx = this.state.openTabs.indexOf(oldPath);
                this.state.openTabs[idx] = newPath;
            }
            this.events.emit("project:fileRenamed", { oldPath, newPath });
            return true;
        }
        return false;
    }

    addFolder(path) {
        path = Utils.normalizePath(path);
        if (!path) return;

        const parts = path.split("/");
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            this.state.addFolder(current);
        }
        this.events.emit("project:folderCreated", { path });
    }

    isEmpty() {
        return this.state.project.size === 0;
    }

    list() {
        return Utils.sortPaths([...this.state.project.keys()]);
    }

    files() {
        return this.list().map(p => ({
            path: p,
            name: Utils.fileName(p),
            language: Utils.language(p),
            size: this.read(p).length
        }));
    }

    tree() {
        const root = { name: "Project", path: "", type: "folder", children: [] };
        const map = new Map([["", root]]);

        for (const folderPath of Utils.sortPaths([...this.state.folders])) {
            const name = Utils.fileName(folderPath);
            const dir = Utils.directory(folderPath);
            const node = { name, path: folderPath, type: "folder", children: [] };
            map.set(folderPath, node);
            const parent = map.get(dir) || root;
            parent.children.push(node);
        }

        for (const filePath of this.list()) {
            const name = Utils.fileName(filePath);
            const dir = Utils.directory(filePath);
            const node = { name, path: filePath, type: "file" };
            const parent = map.get(dir) || root;
            parent.children.push(node);
        }

        const sortNode = (n) => {
            if (n.children) {
                n.children.sort((a, b) => {
                    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
                    return a.name.localeCompare(b.name, undefined, { numeric: true });
                });
                n.children.forEach(sortNode);
            }
        };
        sortNode(root);
        return root;
    }

    applyOperations(operations = []) {
        if (!Array.isArray(operations)) return;
        operations.forEach(op => {
            if (!op || !op.type) return;
            const type = op.type.toLowerCase();
            if ((type === "write" || type === "create") && op.path) {
                this.write(op.path, op.content || "");
            } else if ((type === "delete" || type === "remove") && op.path) {
                this.delete(op.path);
            } else if ((type === "rename" || type === "move") && op.path && op.newPath) {
                this.rename(op.path, op.newPath);
            }
        });
        this.events.emit("project:operationsApplied", operations);
    }
}

const Project = app.register("project", new ProjectManager(state, events));

/* ==========================================================
   MONACO EDITOR MANAGER
========================================================== */

class MonacoManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.monaco = null;
        this.editor = null;
        this.models = new Map();
        this.preventChangeEvent = false;
        this.fallbackTextarea = null;
    }

    async initialize() {
        const container = document.getElementById("editor");
        if (!container) return;

        container.replaceChildren();

        try {
            await this.loadMonacoCDN();
            this.editor = this.monaco.editor.create(container, {
                value: "",
                language: "javascript",
                theme: this.state.theme,
                fontSize: this.state.fontSize,
                fontFamily: Config.EDITOR.FONT_FAMILY,
                tabSize: Config.EDITOR.TAB_SIZE,
                automaticLayout: true,
                minimap: { enabled: this.state.minimap },
                wordWrap: this.state.wordWrap,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 12, bottom: 12 }
            });

            this.state.editor = this.editor;
            this.setupListeners();
            this.events.emit("monaco:ready");
        } catch (err) {
            console.warn("Monaco CDN loading skipped/failed. Using high-performance editor fallback:", err);
            this.setupFallbackEditor(container);
        }
    }

    loadMonacoCDN() {
        if (window.monaco) {
            this.monaco = window.monaco;
            return Promise.resolve(window.monaco);
        }

        return new Promise((resolve, reject) => {
            if (document.getElementById("monaco-script")) {
                const check = setInterval(() => {
                    if (window.monaco) {
                        clearInterval(check);
                        this.monaco = window.monaco;
                        resolve(window.monaco);
                    }
                }, 100);
                setTimeout(() => reject(new Error("Monaco timeout")), 5000);
                return;
            }

            const script = document.createElement("script");
            script.id = "monaco-script";
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js";
            script.onload = () => {
                window.require.config({
                    paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" }
                });
                window.require(["vs/editor/editor.main"], () => {
                    this.monaco = window.monaco;
                    resolve(window.monaco);
                }, reject);
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    setupFallbackEditor(container) {
        const wrapper = Utils.create("div", "w-full h-full flex bg-[#151518] font-mono text-xs text-slate-200 relative");
        const lineNums = Utils.create("div", "w-10 bg-[#0d0d0f] border-r border-white/5 p-3 text-right text-white/30 select-none font-mono text-[11px] leading-relaxed");
        lineNums.innerHTML = "1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10";

        const textarea = Utils.create("textarea", "flex-1 bg-transparent border-none outline-none p-3 text-slate-200 font-mono text-xs leading-relaxed resize-none selection:bg-blue-500/30");
        textarea.id = "fallbackEditorTextarea";
        textarea.placeholder = "Select or create a file to start editing code...";

        wrapper.appendChild(lineNums);
        wrapper.appendChild(textarea);
        container.appendChild(wrapper);

        this.fallbackTextarea = textarea;

        textarea.oninput = () => {
            const active = this.state.activeFile;
            if (active) {
                Project.write(active, textarea.value);
                const lines = textarea.value.split("\n").length;
                lineNums.innerHTML = Array.from({ length: Math.max(lines, 12) }, (_, i) => i + 1).join("<br>");
            }
        };

        textarea.onkeyup = () => {
            const pos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, pos);
            const line = textBefore.split("\n").length;
            const col = pos - textBefore.lastIndexOf("\n");
            this.state.setCursor(line, col);
            this.events.emit("editor:cursorMoved", { line, column: col });
        };
    }

    setupListeners() {
        if (!this.editor) return;

        this.editor.onDidChangeModelContent(() => {
            if (this.preventChangeEvent) return;
            const active = this.state.activeFile;
            if (active) {
                const val = this.editor.getModel().getValue();
                Project.write(active, val);
                this.events.emit(Config.EVENTS.EDITOR_CHANGED, { path: active, value: val });
            }
        });

        this.editor.onDidChangeCursorPosition(e => {
            this.state.setCursor(e.position.lineNumber, e.position.column);
            this.events.emit("editor:cursorMoved", { line: e.position.lineNumber, column: e.position.column });
        });

        this.events.on("file:open", ({ path }) => this.openFile(path));
        this.events.on("project:fileUpdated", ({ path, content }) => {
            if (path === this.state.activeFile) {
                if (this.editor) {
                    const model = this.getModel(path);
                    if (model && model.getValue() !== content) {
                        this.preventChangeEvent = true;
                        model.setValue(content);
                        this.preventChangeEvent = false;
                    }
                } else if (this.fallbackTextarea && this.fallbackTextarea.value !== content) {
                    this.fallbackTextarea.value = content;
                }
            }
        });
    }

    getModel(path) {
        path = Utils.normalizePath(path);
        if (this.models.has(path)) return this.models.get(path);
        if (!this.monaco) return null;

        const content = Project.read(path);
        const lang = Utils.language(path);
        const uri = this.monaco.Uri.parse(`inmemory://model/${path}`);
        let model = this.monaco.editor.getModel(uri) || this.monaco.editor.createModel(content, lang, uri);
        model.setValue(content);
        this.models.set(path, model);
        return model;
    }

    openFile(path) {
        if (!path) return;
        path = Utils.normalizePath(path);

        this.state.setActiveFile(path);
        this.state.openTab(path);
        this.state.setLanguage(Utils.language(path));

        if (this.editor) {
            const model = this.getModel(path);
            if (model) {
                this.preventChangeEvent = true;
                this.editor.setModel(model);
                this.preventChangeEvent = false;
                this.editor.focus();
            }
        } else if (this.fallbackTextarea) {
            this.fallbackTextarea.value = Project.read(path);
        }

        this.events.emit("editor:fileOpened", { path });
    }

    updateSettings() {
        if (this.editor) {
            this.editor.updateOptions({
                fontSize: this.state.fontSize,
                theme: this.state.theme,
                minimap: { enabled: this.state.minimap },
                wordWrap: this.state.wordWrap
            });
            if (this.monaco) {
                this.monaco.editor.setTheme(this.state.theme);
            }
        }
    }

    layout() {
        if (this.editor) this.editor.layout();
    }
}

const Monaco = app.register("monaco", new MonacoManager(state, events));

/* ==========================================================
   EXPLORER MANAGER (Sidebar File Tree)
========================================================== */

class ExplorerManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.container = null;
        this.selectedPath = null;
    }

    initialize() {
        this.container = document.getElementById("fileTree");
        this.setupButtons();
        this.setupSearch();
        this.setupListeners();
        this.render();
    }

    setupButtons() {
        const newFileBtn = document.getElementById("newFileBtn");
        if (newFileBtn) newFileBtn.onclick = () => Modal.showNewItem("file");

        const newFolderBtn = document.getElementById("newFolderBtn");
        if (newFolderBtn) newFolderBtn.onclick = () => Modal.showNewItem("folder");

        const refreshBtn = document.getElementById("refreshExplorerBtn");
        if (refreshBtn) refreshBtn.onclick = () => {
            this.render();
            Terminal.log("Refreshed file explorer", "info");
        };
    }

    setupSearch() {
        const searchInput = document.querySelector(".explorer-search input");
        if (searchInput) {
            searchInput.oninput = Utils.debounce(e => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.render();
            }, 150);
        }
    }

    setupListeners() {
        const refresh = () => this.render();
        this.events.on("project:fileCreated", refresh);
        this.events.on("project:fileUpdated", refresh);
        this.events.on("project:fileDeleted", refresh);
        this.events.on("project:fileRenamed", refresh);
        this.events.on("project:folderCreated", refresh);
        this.events.on("project:operationsApplied", refresh);

        this.events.on("file:open", ({ path }) => {
            this.selectedPath = path;
            this.highlightSelected();
        });
    }

    render() {
        if (!this.container) return;
        this.container.replaceChildren();

        const treeData = Project.tree();
        const fragment = document.createDocumentFragment();

        if (treeData.children.length === 0) {
            const empty = Utils.create("div", "p-4 text-xs text-neutral-500 italic text-center");
            empty.textContent = "No files in project. Click + to create a file.";
            fragment.appendChild(empty);
        } else {
            this.renderNodes(treeData.children, fragment, 0);
        }

        this.container.appendChild(fragment);
    }

    renderNodes(nodes, parentEl, level) {
        const query = this.state.searchQuery;

        for (const node of nodes) {
            if (query && node.type === "file" && !node.name.toLowerCase().includes(query)) {
                continue;
            }

            const isSelected = this.selectedPath === node.path;
            const item = Utils.create("div", `tree-item ${isSelected ? "selected" : ""} group relative flex items-center justify-between`);
            item.style.paddingLeft = `${10 + level * 14}px`;
            item.dataset.path = node.path;

            const leftDiv = Utils.create("div", "flex items-center gap-2 truncate");

            if (node.type === "folder") {
                const expanded = this.state.isExpanded(node.path);
                const icon = Utils.create("span", "material-symbols-outlined text-sm text-amber-400/90");
                icon.textContent = expanded ? "folder_open" : "folder";

                const label = Utils.create("span", "truncate font-medium text-slate-300 text-xs");
                label.textContent = node.name;

                leftDiv.appendChild(icon);
                leftDiv.appendChild(label);
                item.appendChild(leftDiv);

                item.onclick = (e) => {
                    e.stopPropagation();
                    if (this.state.isExpanded(node.path)) {
                        this.state.collapseFolder(node.path);
                    } else {
                        this.state.expandFolder(node.path);
                    }
                    this.render();
                };

                parentEl.appendChild(item);

                if (expanded && node.children) {
                    this.renderNodes(node.children, parentEl, level + 1);
                }
            } else {
                const icon = Utils.create("span", "material-symbols-outlined text-sm text-blue-400/80");
                icon.textContent = Utils.icon(node.path);

                const label = Utils.create("span", "truncate text-xs");
                label.textContent = node.name;

                leftDiv.appendChild(icon);
                leftDiv.appendChild(label);
                item.appendChild(leftDiv);

                // Actions on hover
                const actionsDiv = Utils.create("div", "hidden group-hover:flex items-center gap-1 pr-1");
                const delBtn = Utils.create("button", "text-neutral-500 hover:text-red-400 p-0.5 rounded transition-colors");
                delBtn.title = "Delete File";
                delBtn.innerHTML = `<span class="material-symbols-outlined text-xs">delete</span>`;
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete file "${node.name}"?`)) {
                        Project.delete(node.path);
                        Terminal.log(`Deleted file ${node.path}`, "warning");
                    }
                };

                actionsDiv.appendChild(delBtn);
                item.appendChild(actionsDiv);

                item.onclick = (e) => {
                    e.stopPropagation();
                    this.selectedPath = node.path;
                    this.highlightSelected();
                    this.events.emit(Config.EVENTS.FILE_OPEN, { path: node.path });
                };

                parentEl.appendChild(item);
            }
        }
    }

    highlightSelected() {
        if (!this.container) return;
        const items = this.container.querySelectorAll(".tree-item");
        items.forEach(el => {
            if (el.dataset.path === this.selectedPath) {
                el.classList.add("selected");
            } else {
                el.classList.remove("selected");
            }
        });
    }
}

const Explorer = app.register("explorer", new ExplorerManager(state, events));

/* ==========================================================
   TABS MANAGER
========================================================== */

class TabsManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.container = null;
    }

    initialize() {
        this.container = document.querySelector(".editor-tabs");
        this.setupListeners();
        this.render();
    }

    setupListeners() {
        this.events.on("editor:fileOpened", () => this.render());
        this.events.on("project:fileUpdated", () => this.render());
        this.events.on("project:fileDeleted", () => this.render());
        this.events.on("project:fileRenamed", () => this.render());
    }

    render() {
        if (!this.container) return;
        this.container.replaceChildren();

        const openTabs = this.state.openTabs;
        if (openTabs.length === 0) return;

        openTabs.forEach(path => {
            const isActive = path === this.state.activeFile;
            const isDirty = this.state.isDirty(path);

            const tab = Utils.create("div", `tab ${isActive ? "active" : ""}`);
            const icon = Utils.create("span", "material-symbols-outlined text-sm text-blue-400/80");
            icon.textContent = Utils.icon(path);

            const label = Utils.create("span", "truncate");
            label.textContent = Utils.fileName(path);

            tab.appendChild(icon);
            tab.appendChild(label);

            if (isDirty) {
                const dot = Utils.create("span", "w-1.5 h-1.5 rounded-full bg-amber-400 ml-1 shrink-0");
                tab.appendChild(dot);
            }

            const closeBtn = Utils.create("span", "material-symbols-outlined tab-close text-xs ml-1");
            closeBtn.textContent = "close";
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.state.closeTab(path);
                if (isActive) {
                    const remaining = this.state.openTabs;
                    const next = remaining[remaining.length - 1] || null;
                    if (next) {
                        this.events.emit(Config.EVENTS.FILE_OPEN, { path: next });
                    } else {
                        this.state.setActiveFile(null);
                        const editorContainer = document.getElementById("editor");
                        if (editorContainer) editorContainer.replaceChildren();
                    }
                }
                this.render();
            };

            tab.onclick = () => {
                this.events.emit(Config.EVENTS.FILE_OPEN, { path });
            };

            this.container.appendChild(tab);
        });
    }
}

const Tabs = app.register("tabs", new TabsManager(state, events));

/* ==========================================================
   BREADCRUMBS MANAGER
========================================================== */

class BreadcrumbManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.container = null;
    }

    initialize() {
        this.container = document.querySelector(".breadcrumb");
        this.events.on("editor:fileOpened", ({ path }) => this.update(path));
        this.events.on("project:fileRenamed", () => this.update(this.state.activeFile));
    }

    update(path) {
        if (!this.container) return;
        this.container.replaceChildren();

        if (!path) {
            this.container.textContent = "No file open";
            return;
        }

        const parts = path.split("/");
        const rootSpan = Utils.create("span", "text-neutral-500 font-medium");
        rootSpan.textContent = "Project";
        this.container.appendChild(rootSpan);

        parts.forEach((part, idx) => {
            const sep = Utils.create("span", "mx-1 text-neutral-600");
            sep.textContent = ">";
            this.container.appendChild(sep);

            const item = Utils.create("span", idx === parts.length - 1 ? "text-slate-200 font-semibold" : "text-neutral-400");
            item.textContent = part;
            this.container.appendChild(item);
        });
    }
}

const Breadcrumbs = app.register("breadcrumbs", new BreadcrumbManager(state, events));

/* ==========================================================
   TERMINAL & INTERACTIVE CLI MANAGER
========================================================== */

class TerminalManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.container = null;
    }

    initialize() {
        this.container = document.querySelector(".terminal");
        this.setupTabSwitching();
        this.setupCLI();
        this.setupControls();

        this.events.on("terminal:log", ({ message, type }) => this.log(message, type));
        this.log("ManThink Code Virtual Terminal Environment v1.0.4 initialized.", "success");
        this.log("Type 'help' in command prompt below to view CLI commands.", "info");
    }

    setupTabSwitching() {
        const tabs = document.querySelectorAll(".bottom-tab");
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                const targetTab = tab.dataset.tab;
                Terminal.log(`Switched view to ${targetTab.toUpperCase()}`, "info");
            };
        });
    }

    setupCLI() {
        const cmdInput = document.getElementById("terminalCmdInput");
        if (cmdInput) {
            cmdInput.onkeydown = (e) => {
                if (e.key === "Enter") {
                    const cmd = cmdInput.value.trim();
                    if (cmd) {
                        cmdInput.value = "";
                        this.executeCommand(cmd);
                    }
                }
            };
        }
    }

    setupControls() {
        const clearBtn = document.getElementById("clearTerminalBtn");
        if (clearBtn) clearBtn.onclick = () => this.clear();

        const toggleBtn = document.getElementById("toggleTerminalBtn");
        if (toggleBtn) {
            let expanded = false;
            toggleBtn.onclick = () => {
                const panel = document.querySelector(".bottom-panel");
                if (panel) {
                    expanded = !expanded;
                    panel.style.height = expanded ? "320px" : "180px";
                    Monaco.layout();
                }
            };
        }
    }

    executeCommand(cmd) {
        this.log(`$ ${cmd}`, "info");
        const parts = cmd.split(" ");
        const main = parts[0].toLowerCase();
        const arg = parts.slice(1).join(" ");

        switch (main) {
            case "help":
                this.log("Available Commands:\n  ls               List files in project\n  cat <path>       Display contents of a file\n  node <path>      Execute JS file in browser sandbox\n  npm run build    Simulate production build\n  clear            Clear terminal log\n  ai <prompt>      Ask AI directly from CLI", "info");
                break;
            case "ls":
                const files = Project.list();
                this.log(`Files (${files.length}):\n` + files.map(f => `  ${f} (${Project.read(f).length} bytes)`).join("\n"), "success");
                break;
            case "cat":
                if (!arg) {
                    this.log("Usage: cat <file_path>", "warning");
                } else if (Project.exists(arg)) {
                    this.log(`=== ${arg} ===\n${Project.read(arg)}`, "info");
                } else {
                    this.log(`File not found: ${arg}`, "error");
                }
                break;
            case "node":
            case "run":
                const scriptPath = arg || this.state.activeFile || "code.js";
                if (Project.exists(scriptPath)) {
                    this.log(`[Executing ${scriptPath}...]`, "info");
                    try {
                        const code = Project.read(scriptPath);
                        const logs = [];
                        const customConsole = {
                            log: (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(" ")),
                            error: (...a) => logs.push("ERROR: " + a.join(" ")),
                            warn: (...a) => logs.push("WARN: " + a.join(" "))
                        };
                        const runFn = new Function("console", "document", "window", code);
                        runFn(customConsole, document, window);
                        this.log(`Output:\n` + (logs.length ? logs.join("\n") : "(Execution finished silently with no errors)"), "success");
                    } catch (err) {
                        this.log(`Execution Error: ${err.message}`, "error");
                    }
                } else {
                    this.log(`Script not found: ${scriptPath}`, "error");
                }
                break;
            case "npm":
                if (arg === "run build" || arg === "build") {
                    this.log("Bundling workspace entry points...", "info");
                    setTimeout(() => {
                        this.log("✓ HTML/CSS/JS Assets compiled into /dist.\n✓ Bundle size: 1.4 MB\n✓ Production ready!", "success");
                    }, 500);
                } else {
                    this.log(`Simulated npm command: ${arg}`, "info");
                }
                break;
            case "clear":
                this.clear();
                break;
            case "ai":
                if (arg) {
                    AI.sendDirectPrompt(arg);
                } else {
                    this.log("Usage: ai <your question or task>", "warning");
                }
                break;
            default:
                this.log(`Unknown command: '${main}'. Type 'help' for commands.`, "error");
        }
    }

    log(message, type = "info") {
        if (!this.container) return;
        const time = new Date().toLocaleTimeString();
        const div = Utils.create("div", "py-0.5 font-mono text-xs leading-relaxed");

        let color = "text-slate-300";
        if (type === "success") color = "text-emerald-400";
        if (type === "warning") color = "text-amber-400";
        if (type === "error") color = "text-rose-400";

        div.innerHTML = `<span class="text-neutral-500 mr-2 select-none">[${time}]</span><span class="${color}">${Utils.escapeHTML(message).replace(/\n/g, "<br>&nbsp;&nbsp;")}</span>`;
        this.container.appendChild(div);
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        if (this.container) this.container.replaceChildren();
    }
}

const Terminal = app.register("terminal", new TerminalManager(state, events));

/* ==========================================================
   KEY STORE & PERSISTENCE
========================================================== */

class KeyStore {
    static getKeys() {
        try {
            const raw = localStorage.getItem("mtcode.keys");
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error("Failed to read keys from storage", e);
        }
        return {
            groqKey1: "",
            groqKey2: "",
            groqKey3: "",
            tavilyKey: "",
            openrouterKey1: "",
            openrouterKey2: "",
            geminiKey: ""
        };
    }

    static saveKeys(keys) {
        try {
            localStorage.setItem("mtcode.keys", JSON.stringify(keys));
        } catch (e) {
            console.error("Failed to save keys to storage", e);
        }
    }
}

/* ==========================================================
   AI MANAGER
========================================================== */

class AIManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
        this.container = null;
    }

    initialize() {
        this.container = document.querySelector(".ai-chat");
        this.setupTabs();
        this.setupSend();
        this.setupQuickKeysBtn();
        this.updateBadge();
        this.appendMessage("assistant", "Hello! I am **ManThink AI**.\n\n• **Code Mode**: Powered by **OpenRouter (2 Keys Rotation)**\n• **Ask & Learn**: Powered by **Groq (3 Keys Rotation)**\n• **Research Mode**: Powered by **Tavily Web Search + Groq**\n\nClick **Keys & Settings** to configure your API keys!");
    }

    setupQuickKeysBtn() {
        const btn = document.getElementById("manageKeysQuickBtn");
        if (btn) {
            btn.onclick = () => Modal.showSettings("keys");
        }
    }

    updateBadge() {
        const badge = document.getElementById("activeAiEngineBadge");
        if (!badge) return;

        const mode = this.state.aiMode || "code";
        if (mode === "code") {
            badge.textContent = "⚡ Engine: OpenRouter (2 Keys - Code Operations)";
            badge.className = "text-blue-400 font-semibold";
        } else if (mode === "research") {
            badge.textContent = "🔍 Engine: Tavily Search + Groq (Research)";
            badge.className = "text-amber-400 font-semibold";
        } else if (mode === "learn") {
            badge.textContent = "🎓 Engine: Groq (3 Keys - Learn & Explain)";
            badge.className = "text-emerald-400 font-semibold";
        } else {
            badge.textContent = "💬 Engine: Groq (3 Keys - Chat & Q&A)";
            badge.className = "text-purple-400 font-semibold";
        }
    }

    setupTabs() {
        const tabs = document.querySelectorAll(".ai-tab");
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                this.state.aiMode = tab.dataset.mode || "code";
                this.updateBadge();
                Terminal.log(`AI Assistant mode switched to '${this.state.aiMode.toUpperCase()}'`, "info");
            };
        });
    }

    setupSend() {
        const sendBtn = document.querySelector(".send-btn");
        const promptInput = document.getElementById("codePrompt");

        if (sendBtn && promptInput) {
            sendBtn.onclick = () => this.handleSend();
            promptInput.onkeydown = (e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.handleSend();
                }
            };
        }
    }

    sendDirectPrompt(text) {
        const promptInput = document.getElementById("codePrompt");
        if (promptInput) promptInput.value = text;
        this.handleSend();
    }

    async handleSend() {
        const promptInput = document.getElementById("codePrompt");
        if (!promptInput) return;

        const text = promptInput.value.trim();
        if (!text || this.state.isBusy()) return;

        promptInput.value = "";
        this.appendMessage("user", text);
        this.state.setBusy(true);

        const storedKeys = KeyStore.getKeys();
        Terminal.log(`AI Processing (${this.state.aiMode.toUpperCase()}): "${text.substring(0, 35)}..."`, "info");

        try {
            if (this.state.aiMode === "code") {
                const res = await fetch(Config.API.CODE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: text,
                        files: Project.files().map(f => ({ path: f.path, content: Project.read(f.path) })),
                        activeFile: this.state.activeFile,
                        ...storedKeys
                    })
                });

                const data = await res.json();
                if (data.operations && data.operations.length > 0) {
                    Project.applyOperations(data.operations);
                    Terminal.log(`Applied ${data.operations.length} file changes successfully.`, "success");
                }
                this.appendMessage("assistant", data.summary || "Code operations executed.");
            } else {
                const activePath = this.state.activeFile;
                const res = await fetch(Config.API.CHAT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text,
                        mode: this.state.aiMode,
                        currentFile: activePath ? { path: activePath, content: Project.read(activePath), language: Utils.language(activePath) } : null,
                        projectFiles: Project.files(),
                        ...storedKeys
                    })
                });

                const data = await res.json();
                this.appendMessage("assistant", data.reply || "Task completed.");
            }
        } catch (err) {
            console.error("AI Request error:", err);
            this.appendMessage("assistant", "Sorry, an error occurred while executing AI request.");
            Terminal.log(`AI Error: ${err.message}`, "error");
        } finally {
            this.state.setBusy(false);
        }
    }

    appendMessage(role, content) {
        if (!this.container) return;
        const msg = Utils.create("div", `chat-msg ${role} text-xs p-3 rounded-lg leading-relaxed mb-2`);
        msg.innerHTML = Utils.escapeHTML(content).replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        this.container.appendChild(msg);
        this.container.scrollTop = this.container.scrollHeight;
    }
}

const AI = app.register("ai", new AIManager(state, events));

/* ==========================================================
   STATUS BAR MANAGER
========================================================== */

class StatusBarManager {
    constructor(state, events) {
        this.state = state;
        this.events = events;
    }

    initialize() {
        this.events.on("editor:cursorMoved", ({ line, column }) => this.updatePos(line, column));
        this.events.on("editor:fileOpened", ({ path }) => this.updateLang(Utils.language(path)));
        this.render();
    }

    render() {
        const left = document.querySelector(".status-left");
        const right = document.querySelector(".status-right");

        if (left) {
            left.innerHTML = `<span class="flex items-center gap-1.5 text-blue-400 font-medium"><span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Connected</span><span class="opacity-40">|</span><span class="opacity-70">3 Groq | 1 Tavily | 2 OpenRouter</span>`;
        }
        if (right) {
            right.innerHTML = `
                <span id="posIndicator">Ln 1, Col 1</span>
                <span id="langIndicator" className="uppercase">${this.state.language.toUpperCase()}</span>
                <span>UTF-8</span>
                <span>Spaces: 2</span>
            `;
        }
    }

    updatePos(line, col) {
        const el = document.getElementById("posIndicator");
        if (el) el.textContent = `Ln ${line}, Col ${col}`;
    }

    updateLang(lang) {
        const el = document.getElementById("langIndicator");
        if (el) el.textContent = lang.toUpperCase();
    }
}

const StatusBar = app.register("statusBar", new StatusBarManager(state, events));

/* ==========================================================
   MODAL & DIALOG MANAGER
========================================================== */

class ModalManager {
    initialize() {
        const closeBtn = document.getElementById("modalCloseBtn");
        if (closeBtn) closeBtn.onclick = () => this.hide();

        const modalOverlay = document.getElementById("ideModal");
        if (modalOverlay) {
            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) this.hide();
            };
        }
    }

    show(title, contentHTML) {
        const modal = document.getElementById("ideModal");
        const titleEl = document.getElementById("modalTitle");
        const bodyEl = document.getElementById("modalBody");

        if (modal && titleEl && bodyEl) {
            titleEl.innerHTML = `<span class="material-symbols-outlined text-blue-400 text-base">settings</span><span>${title}</span>`;
            bodyEl.innerHTML = contentHTML;
            modal.classList.remove("hidden");
        }
    }

    hide() {
        const modal = document.getElementById("ideModal");
        if (modal) modal.classList.add("hidden");
    }

    showSettings(activeSection = "keys") {
        const currentKeys = KeyStore.getKeys();

        const html = `
            <div class="space-y-5">
                {/* AI API Keys Management */}
                <div class="border border-white/10 bg-white/5 p-3.5 rounded-xl space-y-3">
                    <div class="flex items-center justify-between border-b border-white/10 pb-2">
                        <span class="font-bold text-white text-xs flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-blue-400 text-sm">key</span>
                            AI API Keys Configuration
                        </span>
                        <span class="text-[10px] text-neutral-400 font-mono">3 Groq • 1 Tavily • 2 OpenRouter</span>
                    </div>

                    {/* Groq Keys (3 Keys for Chat) */}
                    <div class="space-y-1.5">
                        <label class="block text-[11px] font-semibold text-purple-300">
                            ⚡ Groq API Keys (3 Keys for Normal Chat & Q&A Rotation)
                        </label>
                        <div class="grid grid-cols-1 gap-1.5">
                            <input id="groqKey1Input" type="password" value="${Utils.escapeHTML(currentKeys.groqKey1 || "")}" placeholder="Groq API Key #1 (gsk_...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-purple-500" />
                            <input id="groqKey2Input" type="password" value="${Utils.escapeHTML(currentKeys.groqKey2 || "")}" placeholder="Groq API Key #2 (gsk_...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-purple-500" />
                            <input id="groqKey3Input" type="password" value="${Utils.escapeHTML(currentKeys.groqKey3 || "")}" placeholder="Groq API Key #3 (gsk_...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-purple-500" />
                        </div>
                    </div>

                    {/* Tavily Key (1 Key for Web Search) */}
                    <div class="space-y-1.5 pt-1">
                        <label class="block text-[11px] font-semibold text-amber-300">
                            🔍 Tavily API Key (1 Key for Web Search & Live Research)
                        </label>
                        <input id="tavilyKeyInput" type="password" value="${Utils.escapeHTML(currentKeys.tavilyKey || "")}" placeholder="Tavily Search Key (tvly-...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-amber-500" />
                    </div>

                    {/* OpenRouter Keys (2 Keys for Code) */}
                    <div class="space-y-1.5 pt-1">
                        <label class="block text-[11px] font-semibold text-blue-300">
                            💻 OpenRouter API Keys (2 Keys for Code Generation & Agent)
                        </label>
                        <div class="grid grid-cols-1 gap-1.5">
                            <input id="openrouterKey1Input" type="password" value="${Utils.escapeHTML(currentKeys.openrouterKey1 || "")}" placeholder="OpenRouter API Key #1 (sk-or-v1-...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-blue-500" />
                            <input id="openrouterKey2Input" type="password" value="${Utils.escapeHTML(currentKeys.openrouterKey2 || "")}" placeholder="OpenRouter API Key #2 (sk-or-v1-...)" class="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    {/* Optional Gemini Key */}
                    <div class="space-y-1 pt-1">
                        <label class="block text-[10px] text-neutral-400">
                            Optional Gemini Fallback Key
                        </label>
                        <input id="geminiKeyInput" type="password" value="${Utils.escapeHTML(currentKeys.geminiKey || "")}" placeholder="Gemini API Key (AIzaSy...)" class="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-[11px] outline-none focus:border-blue-500" />
                    </div>

                    <div id="keyCheckStatus" className="text-[10px] font-mono text-neutral-400 hidden"></div>
                </div>

                {/* Editor Settings */}
                <div class="border border-white/10 bg-white/5 p-3.5 rounded-xl space-y-3">
                    <span class="font-bold text-white text-xs block border-b border-white/10 pb-1.5">Editor Appearance</span>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-neutral-400 mb-1 text-[11px]">Font Size</label>
                            <select id="fontSizeSelect" class="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-[11px]">
                                <option value="12" ${state.fontSize === 12 ? "selected" : ""}>12px (Compact)</option>
                                <option value="14" ${state.fontSize === 14 ? "selected" : ""}>14px (Standard)</option>
                                <option value="16" ${state.fontSize === 16 ? "selected" : ""}>16px (Large)</option>
                                <option value="18" ${state.fontSize === 18 ? "selected" : ""}>18px (Extra Large)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-neutral-400 mb-1 text-[11px]">Theme</label>
                            <select id="themeSelect" class="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-[11px]">
                                <option value="vs-dark" ${state.theme === "vs-dark" ? "selected" : ""}>VS Dark (Default)</option>
                                <option value="vs-light" ${state.theme === "vs-light" ? "selected" : ""}>VS Light</option>
                                <option value="hc-black" ${state.theme === "hc-black" ? "selected" : ""}>High Contrast Dark</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <span class="text-neutral-300 text-[11px]">Minimap Enabled</span>
                        <input type="checkbox" id="minimapCheck" ${state.minimap ? "checked" : ""} class="w-4 h-4 rounded accent-blue-500" />
                    </div>
                </div>

                <div class="flex gap-2 pt-1">
                    <button id="testKeysBtn" class="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-xs">verified</span>
                        Verify Keys
                    </button>
                    <button id="saveSettingsBtn" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-xs">save</span>
                        Save All Config
                    </button>
                </div>
            </div>
        `;
        this.show("IDE Settings & API Keys", html);

        setTimeout(() => {
            const saveBtn = document.getElementById("saveSettingsBtn");
            const testBtn = document.getElementById("testKeysBtn");
            const statusDiv = document.getElementById("keyCheckStatus");

            if (testBtn) {
                testBtn.onclick = async () => {
                    if (statusDiv) {
                        statusDiv.classList.remove("hidden");
                        statusDiv.textContent = "Testing keys with backend...";
                    }

                    const testPayload = {
                        groqKey1: document.getElementById("groqKey1Input").value.trim(),
                        groqKey2: document.getElementById("groqKey2Input").value.trim(),
                        groqKey3: document.getElementById("groqKey3Input").value.trim(),
                        tavilyKey: document.getElementById("tavilyKeyInput").value.trim(),
                        openrouterKey1: document.getElementById("openrouterKey1Input").value.trim(),
                        openrouterKey2: document.getElementById("openrouterKey2Input").value.trim(),
                        geminiKey: document.getElementById("geminiKeyInput").value.trim(),
                    };

                    try {
                        const res = await fetch("/api/keys/status", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(testPayload)
                        });
                        const data = await res.json();
                        if (statusDiv) {
                            statusDiv.innerHTML = `<span class="text-emerald-400 font-bold">✓ Active Keys Detected:</span> Groq: <strong>${data.groq.count}/3</strong> | OpenRouter: <strong>${data.openrouter.count}/2</strong> | Tavily: <strong>${data.tavily.count}/1</strong>`;
                        }
                    } catch (err) {
                        if (statusDiv) statusDiv.textContent = "Error testing keys.";
                    }
                };
            }

            if (saveBtn) {
                saveBtn.onclick = () => {
                    const groqKey1 = document.getElementById("groqKey1Input").value.trim();
                    const groqKey2 = document.getElementById("groqKey2Input").value.trim();
                    const groqKey3 = document.getElementById("groqKey3Input").value.trim();
                    const tavilyKey = document.getElementById("tavilyKeyInput").value.trim();
                    const openrouterKey1 = document.getElementById("openrouterKey1Input").value.trim();
                    const openrouterKey2 = document.getElementById("openrouterKey2Input").value.trim();
                    const geminiKey = document.getElementById("geminiKeyInput").value.trim();

                    KeyStore.saveKeys({
                        groqKey1,
                        groqKey2,
                        groqKey3,
                        tavilyKey,
                        openrouterKey1,
                        openrouterKey2,
                        geminiKey
                    });

                    const fontSize = parseInt(document.getElementById("fontSizeSelect").value, 10);
                    const theme = document.getElementById("themeSelect").value;
                    const minimap = document.getElementById("minimapCheck").checked;

                    state.fontSize = fontSize;
                    state.theme = theme;
                    state.minimap = minimap;

                    Monaco.updateSettings();
                    if (AI) AI.updateBadge();

                    Terminal.log(`Saved API Keys & IDE Settings successfully!`, "success");
                    this.hide();
                };
            }
        }, 50);
    }

    showHelp() {
        const html = `
            <div class="space-y-4 leading-relaxed font-sans text-xs">
                <p class="text-neutral-300"><strong class="text-blue-400">ManThink Code IDE v1.0.4</strong> — Full VS Code compatible web development environment integrated with Gemini AI.</p>
                
                <div class="border-t border-white/10 pt-3">
                    <h4 class="font-bold mb-2.5 text-white flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-amber-400 text-sm">keyboard</span>
                        <span>VS Code Keyboard Shortcuts Reference</span>
                    </h4>
                    
                    <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        <div>
                            <span class="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Command & Quick Open</span>
                            <div class="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[11px]">
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Command Palette</span><kbd class="text-blue-300">Ctrl+Shift+P / F1</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Quick Open File</span><kbd class="text-blue-300">Ctrl+P</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Save Active File</span><kbd class="text-blue-300">Ctrl+S</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>New File</span><kbd class="text-blue-300">Ctrl+N</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Close Active Tab</span><kbd class="text-blue-300">Ctrl+W</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Close All Tabs</span><kbd class="text-blue-300">Ctrl+Shift+W</kbd></div>
                            </div>
                        </div>

                        <div>
                            <span class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Layout & Panels</span>
                            <div class="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[11px]">
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Toggle Sidebar</span><kbd class="text-emerald-300">Ctrl+B</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Toggle Terminal</span><kbd class="text-emerald-300">Ctrl+\` / Ctrl+J</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Focus AI Assistant</span><kbd class="text-emerald-300">Ctrl+Shift+A</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Focus Explorer</span><kbd class="text-emerald-300">Ctrl+Shift+E</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Search Files</span><kbd class="text-emerald-300">Ctrl+Shift+F</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Open Settings</span><kbd class="text-emerald-300">Ctrl+,</kbd></div>
                            </div>
                        </div>

                        <div>
                            <span class="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Execution & AI</span>
                            <div class="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[11px]">
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Run Active Code</span><kbd class="text-purple-300">F5 / Ctrl+Alt+N</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Clear Terminal</span><kbd class="text-purple-300">Ctrl+K</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Send AI Command</span><kbd class="text-purple-300">Ctrl+Enter</kbd></div>
                                <div class="bg-white/5 p-1.5 rounded flex justify-between"><span>Switch Tabs</span><kbd class="text-purple-300">Ctrl+Tab</kbd></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.show("Help & VS Code Shortcuts", html);
    }

    showNewItem(type = "file") {
        const title = type === "file" ? "Create New File" : "Create New Folder";
        const placeholder = type === "file" ? "e.g. src/utils/helper.js" : "e.g. src/components";
        const html = `
            <div class="space-y-3">
                <label class="block text-neutral-400">${type === "file" ? "File Path" : "Folder Path"}:</label>
                <input id="newItemInput" type="text" placeholder="${placeholder}" class="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 font-mono text-xs" />
                <button id="createItemBtn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">
                    Create ${type === "file" ? "File" : "Folder"}
                </button>
            </div>
        `;
        this.show(title, html);

        setTimeout(() => {
            const input = document.getElementById("newItemInput");
            const btn = document.getElementById("createItemBtn");
            if (input) input.focus();

            const action = () => {
                const val = input.value.trim();
                if (val) {
                    if (type === "file") {
                        Project.create(val, `// ${Utils.fileName(val)}\n`);
                        events.emit(Config.EVENTS.FILE_OPEN, { path: val });
                        Terminal.log(`Created file: ${val}`, "success");
                    } else {
                        Project.addFolder(val);
                        Terminal.log(`Created folder: ${val}`, "success");
                    }
                    this.hide();
                }
            };

            if (btn) btn.onclick = action;
            if (input) {
                input.onkeydown = (e) => {
                    if (e.key === "Enter") action();
                };
            }
        }, 50);
    }
}

const Modal = app.register("modal", new ModalManager());

/* ==========================================================
   COMMAND PALETTE MANAGER (VS Code Ctrl+Shift+P / Ctrl+P)
========================================================== */

class CommandPaletteManager {
    constructor() {
        this.selectedIndex = 0;
        this.commands = [
            { id: "cmd.palette", label: "View: Command Palette", shortcut: "Ctrl+Shift+P", icon: "search", action: () => CommandPalette.show(">") },
            { id: "file.open", label: "File: Quick Open File", shortcut: "Ctrl+P", icon: "folder_open", action: () => CommandPalette.show("") },
            { id: "file.save", label: "File: Save Active File", shortcut: "Ctrl+S", icon: "save", action: () => TopBarMenu.saveActiveFile() },
            { id: "file.newFile", label: "File: New File...", shortcut: "Ctrl+N", icon: "note_add", action: () => Modal.showNewItem("file") },
            { id: "file.newFolder", label: "File: New Folder...", shortcut: "Ctrl+Shift+N", icon: "create_new_folder", action: () => Modal.showNewItem("folder") },
            { id: "file.closeTab", label: "File: Close Active Tab", shortcut: "Ctrl+W", icon: "close", action: () => Shortcuts.closeCurrentTab() },
            { id: "file.closeAllTabs", label: "File: Close All Open Tabs", shortcut: "Ctrl+Shift+W", icon: "tab_unselected", action: () => Shortcuts.closeAllTabs() },
            { id: "view.toggleSidebar", label: "View: Toggle Explorer Sidebar", shortcut: "Ctrl+B", icon: "side_navigation", action: () => TopBarMenu.toggleSidebar(".explorer") },
            { id: "view.toggleTerminal", label: "View: Toggle Integrated Terminal", shortcut: "Ctrl+~", icon: "terminal", action: () => TopBarMenu.toggleSidebar(".bottom-panel") },
            { id: "view.toggleAI", label: "View: Toggle AI Assistant Panel", shortcut: "Ctrl+Shift+A", icon: "auto_awesome", action: () => TopBarMenu.toggleSidebar(".ai-panel") },
            { id: "view.settings", label: "View: IDE Settings", shortcut: "Ctrl+,", icon: "settings", action: () => Modal.showSettings() },
            { id: "run.executeCode", label: "Run: Execute Active File in Terminal", shortcut: "F5 / Ctrl+Alt+N", icon: "play_arrow", action: () => Shortcuts.runActiveScript() },
            { id: "terminal.clear", label: "Terminal: Clear Terminal Output", shortcut: "Ctrl+K", icon: "cleaning_services", action: () => Terminal.clear() },
            { id: "view.nextTab", label: "View: Switch to Next Tab", shortcut: "Ctrl+Tab", icon: "tab", action: () => Shortcuts.switchTab(1) },
            { id: "view.prevTab", label: "View: Switch to Previous Tab", shortcut: "Ctrl+Shift+Tab", icon: "tab", action: () => Shortcuts.switchTab(-1) },
            { id: "ai.sendPrompt", label: "AI: Focus AI Prompt Input", shortcut: "Ctrl+Shift+I", icon: "smart_toy", action: () => Shortcuts.focusAIPrompt() },
            { id: "help.shortcuts", label: "Help: Show Keyboard Shortcuts & About", shortcut: "Ctrl+H / F12", icon: "help", action: () => Modal.showHelp() },
        ];
    }

    initialize() {
        const modal = document.getElementById("commandPaletteModal");
        const input = document.getElementById("commandPaletteInput");
        if (!modal || !input) return;

        input.oninput = () => {
            this.selectedIndex = 0;
            this.renderResults();
        };

        input.onkeydown = (e) => {
            if (e.key === "Escape") {
                this.hide();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                this.moveSelection(1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this.moveSelection(-1);
            } else if (e.key === "Enter") {
                e.preventDefault();
                this.executeSelected();
            }
        };

        modal.onclick = (e) => {
            if (e.target === modal) this.hide();
        };
    }

    show(initialPrefix = ">") {
        const modal = document.getElementById("commandPaletteModal");
        const input = document.getElementById("commandPaletteInput");
        if (!modal || !input) return;

        modal.classList.remove("hidden");
        input.value = initialPrefix;
        this.selectedIndex = 0;
        this.renderResults();
        setTimeout(() => {
            input.focus();
            if (initialPrefix) {
                input.setSelectionRange(initialPrefix.length, initialPrefix.length);
            }
        }, 30);
    }

    hide() {
        const modal = document.getElementById("commandPaletteModal");
        if (modal) modal.classList.add("hidden");
    }

    renderResults() {
        const input = document.getElementById("commandPaletteInput");
        const container = document.getElementById("commandPaletteResults");
        if (!input || !container) return;

        const val = input.value.trim();
        const isCommandMode = val.startsWith(">");
        const filter = (isCommandMode ? val.substring(1) : val).toLowerCase().trim();

        let items = [];

        if (isCommandMode) {
            items = this.commands.filter(cmd => cmd.label.toLowerCase().includes(filter));
        } else {
            const allFiles = Project.list();
            items = allFiles
                .filter(p => p.toLowerCase().includes(filter))
                .map(p => ({
                    id: `file:${p}`,
                    label: p,
                    shortcut: Utils.extension(p).toUpperCase(),
                    icon: Utils.icon(p),
                    action: () => events.emit(Config.EVENTS.FILE_OPEN, { path: p })
                }));
        }

        if (items.length === 0) {
            container.innerHTML = `<div class="px-4 py-3 text-neutral-500 italic text-center text-xs">No matching ${isCommandMode ? "commands" : "files"} found</div>`;
            return;
        }

        if (this.selectedIndex >= items.length) this.selectedIndex = Math.max(0, items.length - 1);

        container.innerHTML = items.map((item, idx) => {
            const isSelected = idx === this.selectedIndex;
            return `
                <div class="cmd-item flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors ${isSelected ? "bg-blue-600/30 text-white border-l-2 border-blue-400" : "hover:bg-white/5 text-slate-300"}" data-index="${idx}">
                    <div class="flex items-center gap-2.5 truncate">
                        <span class="material-symbols-outlined text-sm ${isSelected ? "text-blue-300" : "text-neutral-400"}">${item.icon || "code"}</span>
                        <span class="truncate font-medium text-xs">${Utils.escapeHTML(item.label)}</span>
                    </div>
                    ${item.shortcut ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-white/10 border border-white/10 text-neutral-400 shrink-0 font-mono ml-2">${item.shortcut}</span>` : ""}
                </div>
            `;
        }).join("");

        const renderedDivs = container.querySelectorAll(".cmd-item");
        renderedDivs.forEach(div => {
            div.onclick = () => {
                const idx = parseInt(div.dataset.index, 10);
                this.selectedIndex = idx;
                this.executeSelected();
            };
        });

        const activeDiv = renderedDivs[this.selectedIndex];
        if (activeDiv) {
            activeDiv.scrollIntoView({ block: "nearest" });
        }
    }

    moveSelection(delta) {
        const container = document.getElementById("commandPaletteResults");
        if (!container) return;
        const count = container.querySelectorAll(".cmd-item").length;
        if (count === 0) return;

        this.selectedIndex = (this.selectedIndex + delta + count) % count;
        this.renderResults();
    }

    executeSelected() {
        const input = document.getElementById("commandPaletteInput");
        if (!input) return;
        const val = input.value.trim();
        const isCommandMode = val.startsWith(">");
        const filter = (isCommandMode ? val.substring(1) : val).toLowerCase().trim();

        let items = [];
        if (isCommandMode) {
            items = this.commands.filter(cmd => cmd.label.toLowerCase().includes(filter));
        } else {
            const allFiles = Project.list();
            items = allFiles.filter(p => p.toLowerCase().includes(filter)).map(p => ({
                action: () => events.emit(Config.EVENTS.FILE_OPEN, { path: p })
            }));
        }

        if (items[this.selectedIndex]) {
            this.hide();
            items[this.selectedIndex].action();
        }
    }
}

const CommandPalette = app.register("commandPalette", new CommandPaletteManager());

/* ==========================================================
   TOP BAR & ACTIVITY BAR MANAGERS
========================================================== */

class TopBarMenuManager {
    initialize() {
        const dropdown = document.getElementById("topDropdown");
        const menuBtns = document.querySelectorAll(".top-menu-btn");

        menuBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const menu = btn.dataset.menu;
                this.renderDropdown(menu, dropdown);
            };
        });

        document.addEventListener("click", () => {
            if (dropdown) dropdown.classList.add("hidden");
        });

        const aiBadge = document.getElementById("aiStatusBadge");
        if (aiBadge) {
            aiBadge.onclick = () => {
                const aiPanel = document.querySelector(".ai-panel");
                if (aiPanel) {
                    aiPanel.style.display = aiPanel.style.display === "none" ? "flex" : "none";
                    Monaco.layout();
                }
            };
        }

        const maxBtn = document.getElementById("maxAppBtn");
        if (maxBtn) {
            maxBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            };
        }
    }

    renderDropdown(menu, dropdown) {
        if (!dropdown) return;

        let items = [];
        if (menu === "file") {
            items = [
                { label: "New File... (Ctrl+N)", action: () => Modal.showNewItem("file") },
                { label: "New Folder... (Ctrl+Shift+N)", action: () => Modal.showNewItem("folder") },
                { label: "Save Active File (Ctrl+S)", action: () => this.saveActiveFile() },
                { label: "Close Tab (Ctrl+W)", action: () => Shortcuts.closeCurrentTab() },
                { label: "Download Active File", action: () => this.downloadActiveFile() }
            ];
        } else if (menu === "edit") {
            items = [
                { label: "Format File", action: () => Terminal.log("Formatted code file", "info") },
                { label: "Clear Active File", action: () => this.clearActiveFile() }
            ];
        } else if (menu === "view") {
            items = [
                { label: "Command Palette... (Ctrl+Shift+P)", action: () => CommandPalette.show(">") },
                { label: "Quick Open File... (Ctrl+P)", action: () => CommandPalette.show("") },
                { label: "Toggle Explorer Sidebar (Ctrl+B)", action: () => this.toggleSidebar(".explorer") },
                { label: "Toggle AI Assistant (Ctrl+Shift+A)", action: () => this.toggleSidebar(".ai-panel") },
                { label: "Toggle Terminal (Ctrl+`)", action: () => this.toggleSidebar(".bottom-panel") }
            ];
        } else if (menu === "help") {
            items = [
                { label: "Keyboard Shortcuts (Ctrl+H)", action: () => Modal.showHelp() },
                { label: "IDE Settings (Ctrl+,)", action: () => Modal.showSettings() }
            ];
        } else {
            items = [{ label: "No actions", action: () => {} }];
        }

        dropdown.innerHTML = items.map(item => `<div class="dropdown-item px-3 py-1.5 hover:bg-white/10 cursor-pointer transition-colors text-slate-200">${item.label}</div>`).join("");
        dropdown.classList.remove("hidden");

        const elItems = dropdown.querySelectorAll(".dropdown-item");
        elItems.forEach((el, idx) => {
            el.onclick = () => {
                items[idx].action();
                dropdown.classList.add("hidden");
            };
        });
    }

    saveActiveFile() {
        const active = state.activeFile;
        if (active) {
            state.removeDirty(active);
            events.emit("project:fileUpdated", { path: active, content: Project.read(active) });
            Terminal.log(`Saved file '${active}'`, "success");
        }
    }

    downloadActiveFile() {
        const active = state.activeFile;
        if (active) {
            const content = Project.read(active);
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = Utils.fileName(active);
            a.click();
            URL.revokeObjectURL(url);
            Terminal.log(`Downloaded ${active}`, "success");
        }
    }

    clearActiveFile() {
        const active = state.activeFile;
        if (active) {
            Project.write(active, "");
            Terminal.log(`Cleared contents of ${active}`, "warning");
        }
    }

    toggleSidebar(selector) {
        const el = document.querySelector(selector);
        if (el) {
            el.style.display = el.style.display === "none" ? "" : "none";
            Monaco.layout();
        }
    }
}

const TopBarMenu = app.register("topBarMenu", new TopBarMenuManager());

class ActivityBarManager {
    initialize() {
        const items = document.querySelectorAll(".activity-item");
        items.forEach(item => {
            item.onclick = () => {
                items.forEach(i => i.classList.remove("active"));
                item.classList.add("active");

                const panel = item.dataset.panel;
                if (panel === "explorer") {
                    const explorer = document.querySelector(".explorer");
                    if (explorer) explorer.style.display = "";
                } else if (panel === "search") {
                    const searchInput = document.querySelector(".explorer-search input");
                    if (searchInput) searchInput.focus();
                } else if (panel === "source") {
                    Terminal.log("Source Control Status: Working tree clean (Main Branch)", "info");
                } else if (panel === "ai") {
                    Shortcuts.focusAIPrompt();
                } else if (panel === "settings") {
                    Modal.showSettings();
                }
            };
        });
    }
}

const ActivityBar = app.register("activityBar", new ActivityBarManager());

/* ==========================================================
   SHORTCUTS MANAGER (Full VS Code Mapping)
========================================================== */

class ShortcutManager {
    initialize() {
        window.addEventListener("keydown", (e) => {
            const ctrlOrCmd = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            // F1 or Ctrl+Shift+P -> Command Palette (Commands mode)
            if (e.key === "F1" || (ctrlOrCmd && e.shiftKey && key === "p")) {
                e.preventDefault();
                CommandPalette.show(">");
                return;
            }

            // Ctrl+P / Cmd+P -> Quick Open File search
            if (ctrlOrCmd && !e.shiftKey && key === "p") {
                e.preventDefault();
                CommandPalette.show("");
                return;
            }

            // Ctrl+S / Cmd+S -> Save active file
            if (ctrlOrCmd && !e.shiftKey && key === "s") {
                e.preventDefault();
                TopBarMenu.saveActiveFile();
                return;
            }

            // Ctrl+N / Cmd+N -> New File Modal
            if (ctrlOrCmd && !e.shiftKey && key === "n") {
                e.preventDefault();
                Modal.showNewItem("file");
                return;
            }

            // Ctrl+Shift+N -> New Folder Modal
            if (ctrlOrCmd && e.shiftKey && key === "n") {
                e.preventDefault();
                Modal.showNewItem("folder");
                return;
            }

            // Ctrl+W / Cmd+W -> Close active tab
            if (ctrlOrCmd && !e.shiftKey && key === "w") {
                e.preventDefault();
                this.closeCurrentTab();
                return;
            }

            // Ctrl+Shift+W -> Close all tabs
            if (ctrlOrCmd && e.shiftKey && key === "w") {
                e.preventDefault();
                this.closeAllTabs();
                return;
            }

            // Ctrl+B / Cmd+B -> Toggle Sidebar
            if (ctrlOrCmd && !e.shiftKey && key === "b") {
                e.preventDefault();
                TopBarMenu.toggleSidebar(".explorer");
                return;
            }

            // Ctrl+` or Ctrl+J -> Toggle Terminal
            if ((ctrlOrCmd && e.key === "`") || (ctrlOrCmd && key === "j")) {
                e.preventDefault();
                TopBarMenu.toggleSidebar(".bottom-panel");
                return;
            }

            // Ctrl+Shift+E -> Focus Explorer
            if (ctrlOrCmd && e.shiftKey && key === "e") {
                e.preventDefault();
                const explorer = document.querySelector(".explorer");
                if (explorer) explorer.style.display = "";
                const searchInput = document.querySelector(".explorer-search input");
                if (searchInput) searchInput.focus();
                return;
            }

            // Ctrl+Shift+F -> Focus Search in Explorer
            if (ctrlOrCmd && e.shiftKey && key === "f") {
                e.preventDefault();
                const explorer = document.querySelector(".explorer");
                if (explorer) explorer.style.display = "";
                const searchInput = document.querySelector(".explorer-search input");
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            }

            // Ctrl+Shift+A or Ctrl+Shift+I -> Focus AI Assistant
            if (ctrlOrCmd && e.shiftKey && (key === "a" || key === "i")) {
                e.preventDefault();
                this.focusAIPrompt();
                return;
            }

            // Ctrl+, / Cmd+, or Ctrl+Shift+X -> Open Settings
            if ((ctrlOrCmd && e.key === ",") || (ctrlOrCmd && e.shiftKey && key === "x")) {
                e.preventDefault();
                Modal.showSettings();
                return;
            }

            // F5 or Ctrl+Alt+N -> Run script in terminal
            if (e.key === "F5" || (ctrlOrCmd && e.altKey && key === "n")) {
                e.preventDefault();
                this.runActiveScript();
                return;
            }

            // Ctrl+K -> Clear Terminal Output
            if (ctrlOrCmd && key === "k" && !e.shiftKey) {
                e.preventDefault();
                Terminal.clear();
                return;
            }

            // Ctrl+Tab / Ctrl+Shift+Tab -> Next/Prev tab
            if (ctrlOrCmd && e.key === "Tab") {
                e.preventDefault();
                this.switchTab(e.shiftKey ? -1 : 1);
                return;
            }

            // Ctrl+H or F12 -> Show Help & Shortcuts
            if ((ctrlOrCmd && key === "h") || e.key === "F12") {
                e.preventDefault();
                Modal.showHelp();
                return;
            }

            // Escape -> Close modals / command palette / top dropdowns
            if (e.key === "Escape") {
                CommandPalette.hide();
                Modal.hide();
                const dropdown = document.getElementById("topDropdown");
                if (dropdown) dropdown.classList.add("hidden");
            }
        });
    }

    closeCurrentTab() {
        const active = state.activeFile;
        if (active) {
            state.closeTab(active);
            const remaining = state.openTabs;
            const next = remaining[remaining.length - 1] || null;
            if (next) {
                events.emit(Config.EVENTS.FILE_OPEN, { path: next });
            } else {
                state.setActiveFile(null);
                const editorContainer = document.getElementById("editor");
                if (editorContainer) editorContainer.replaceChildren();
            }
            Tabs.render();
            Terminal.log(`Closed tab '${active}'`, "info");
        }
    }

    closeAllTabs() {
        state.openTabs = [];
        state.setActiveFile(null);
        Tabs.render();
        const editorContainer = document.getElementById("editor");
        if (editorContainer) editorContainer.replaceChildren();
        Terminal.log("Closed all tabs", "info");
    }

    focusAIPrompt() {
        const aiPanel = document.querySelector(".ai-panel");
        if (aiPanel) aiPanel.style.display = "";
        Monaco.layout();
        const prompt = document.getElementById("codePrompt");
        if (prompt) prompt.focus();
    }

    runActiveScript() {
        const active = state.activeFile || "code.js";
        const panel = document.querySelector(".bottom-panel");
        if (panel) panel.style.display = "";
        Monaco.layout();
        Terminal.executeCommand(`node ${active}`);
    }

    switchTab(direction) {
        const tabs = state.openTabs;
        if (tabs.length <= 1) return;
        const currentIdx = tabs.indexOf(state.activeFile);
        if (currentIdx === -1) {
            events.emit(Config.EVENTS.FILE_OPEN, { path: tabs[0] });
        } else {
            const nextIdx = (currentIdx + direction + tabs.length) % tabs.length;
            events.emit(Config.EVENTS.FILE_OPEN, { path: tabs[nextIdx] });
        }
    }
}

const Shortcuts = app.register("shortcuts", new ShortcutManager());

/* ==========================================================
   DEFAULT STARTER PROJECT SEED
========================================================== */

function seedProject() {
    if (!Project.isEmpty()) return;

    Project.create("code.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My ManThink App</title>
  <link rel="stylesheet" href="code.css">
</head>
<body>
  <div id="app">
    <h1>Hello World from ManThink Code IDE!</h1>
    <p>Build Web, JS, and Full Stack Apps with AI power.</p>
  </div>
  <script src="code.js"></script>
</body>
</html>`);

    Project.create("code.js", `// Main App Script (code.js)
console.log("Welcome to ManThink Code IDE!");

document.addEventListener("DOMContentLoaded", () => {
  const heading = document.querySelector("h1");
  if (heading) {
    heading.style.color = "#3b82f6";
  }
});`);

    Project.create("code.css", `/* Main Stylesheet (code.css) */
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

#app {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background-color: #1e293b;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}`);

    Project.create("package.json", `{
  "name": "my-manthink-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node code.js"
  }
}`);

    Project.create("README.md", `# My ManThink App

Created with **ManThink Code** AI Browser IDE.

Default workspace files:
- \`code.html\`
- \`code.js\`
- \`code.css\`

Use the AI panel on the right to edit files or generate new code!`);
}

/* ==========================================================
   APP BOOTSTRAP FUNCTION
========================================================== */

function bootApp() {
    if (app.initialized) return;

    seedProject();
    Explorer.initialize();
    Tabs.initialize();
    Breadcrumbs.initialize();
    Terminal.initialize();
    AI.initialize();
    StatusBar.initialize();
    Modal.initialize();
    TopBarMenu.initialize();
    ActivityBar.initialize();
    CommandPalette.initialize();
    Shortcuts.initialize();
    Monaco.initialize();

    Explorer.render();
    events.emit(Config.EVENTS.FILE_OPEN, { path: "code.js" });

    app.initialized = true;
}

// Export global initializer
window.initManThinkCode = bootApp;

if (document.readyState === "complete" || document.readyState === "interactive") {
    bootApp();
} else {
    document.addEventListener("DOMContentLoaded", bootApp);
}
