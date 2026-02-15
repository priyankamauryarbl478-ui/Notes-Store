// App.jsx
// PERFECT FINAL VERSION – EXACT COLORS + CENTER + EMOJIS + SHADOW CARDS

import React, { useEffect, useState, useRef } from "react";

/* ---------- IndexedDB helpers ---------- */
const DB_NAME = "my-notes-db";
const DB_STORE = "files";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        const store = db.createObjectStore(DB_STORE, { keyPath: "id" });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("important", "important", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Helpers ---------- */
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const bstr = atob(data);
  const arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* ---------- Main App ---------- */
export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  /* ---- EXACT SECTIONS WITH EXACT COLORS ---- */
  const SECTIONS = [
    { key: "Coaching Notes", box: "bg-green-400 text-white" },
    { key: "IT Notes", box: "bg-yellow-900 text-black" },
    { key: "Web Projects", box: "bg-pink-500 text-black" },
    { key: "Notes", box: "bg-green-600 text-black" },
  ];

  const inputRefs = {
    "Coaching Notes": useRef(null),
    "IT Notes": useRef(null),
    "Web Projects": useRef(null),
    Notes: useRef(null),
  };

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const all = await dbGetAll();
    all.sort((a, b) => b.createdAt - a.createdAt);
    setItems(all);
  }

  async function handleFiles(fileList, category) {
    if (!fileList || !fileList.length) return;
    setUploading(true);

    for (const file of fileList) {
      const dataUrl = await fileToBase64(file);
      await dbPut({
        id: uid(),
        title: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        dataUrl,
        category,
        important: false,
        createdAt: Date.now(),
      });
    }

    await loadAll();
    if (inputRefs[category].current) inputRefs[category].current.value = null;
    setUploading(false);
  }

  function previewItem(it) {
    const blob = dataUrlToBlob(it.dataUrl);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function downloadItem(it) {
    const blob = dataUrlToBlob(it.dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = it.title;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  async function toggleImportant(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    await dbPut({ ...it, important: !it.important });
    await loadAll();
  }

  async function removeItem(id) {
    if (!window.confirm("Delete permanently?")) return;
    await dbDelete(id);
    await loadAll();
  }

  /* ---- MOVING EMOJI STYLE ---- */
  const emojis = ["📚", "📝", "✨", "📁", "💡", "📘", "🧠", "🖥️"];
  const emojiStyle = {
    position: "absolute",
    fontSize: "2rem",
    opacity: 0.22,
    pointerEvents: "none",
    animation: "float 10s infinite linear",
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#072146" }}>
      {/* FLOATING EMOJIS */}
      {emojis.map((e, i) => (
        <div
          key={i}
          style={{
            ...emojiStyle,
            left: `${Math.random() * 90}vw`,
            top: `${Math.random() * 90}vh`,
            animationDelay: `${i * 1.5}s`,
          }}
        >
          {e}
        </div>
      ))}

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(8deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}
      </style>

      <div className="min-h-screen flex justify-center items-center text-center px-4 py-10">
        <div className="w-full max-w-6xl">

          {/* TITLE */}
          <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-3">My Notes</h1>
          <p className="text-slate-200 mb-6">Store all notes, coaching files & projects in one place.</p>

          {/* SEARCH */}
          <div className="flex justify-center mb-8">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full max-w-2xl p-3 bg-slate-900/40 text-white rounded-xl border border-white/20"
            />
          </div>

          {/* SECTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECTIONS.map((sec) => {
              const files = items.filter(
                (it) =>
                  it.category === sec.key &&
                  it.title.toLowerCase().includes(query.toLowerCase())
              );

              return (
                <section
                  key={sec.key}
                  className={`rounded-2xl shadow-2xl p-6 border border-black/20 ${sec.box}`}
                >
                  <h2 className="text-2xl font-bold mb-4">{sec.key}</h2>

                  {/* UPLOAD BUTTON */}
                  <label className="px-4 py-2 bg-black/20 text-white rounded-lg cursor-pointer mb-4 inline-block">
                    Upload Files
                    <input
                      ref={inputRefs[sec.key]}
                      multiple
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files, sec.key)}
                    />
                  </label>

                  {/* FILE LIST */}
                  <div className="max-h-60 overflow-auto space-y-3">
                    {files.length === 0 && (
                      <p className="text-sm opacity-80">No files uploaded yet.</p>
                    )}

                    {files.map((it) => (
                      <div
                        key={it.id}
                        className="bg-white/30 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div className="text-left">
                          <p className="font-bold">{it.title}</p>
                          <p className="text-xs opacity-80">{new Date(it.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => previewItem(it)} className="px-2 py-1 bg-black/20 text-white rounded">View</button>
                          <button onClick={() => downloadItem(it)} className="px-2 py-1 bg-black/20 text-white rounded">Download</button>
                          <button
                            onClick={() => toggleImportant(it.id)}
                            className={`px-2 py-1 rounded ${
                              it.important ? "bg-yellow-400 text-black" : "bg-black/20 text-white"
                            }`}
                          >
                            {it.important ? "★" : "☆"}
                          </button>
                          <button
                            onClick={() => removeItem(it.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* QUICK UPLOAD PURPLE BOX */}
          <div className="mt-10">
            <div className="rounded-2xl bg-purple-700 text-white p-6 shadow-xl border border-purple-300">
              <h3 className="text-2xl font-bold mb-3">Quick Project Upload (any file type)</h3>

              <input
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files, "Web Projects")}
                className="mb-3"
              />

              <p className="text-white/80">
                These files will be stored under <strong>Web Projects</strong>
              </p>

              {uploading && <p className="mt-2 text-yellow-200">Uploading...</p>}
            </div>
          </div>

          <p className="text-white/60 text-sm mt-8">
            All files are saved locally in your browser using IndexedDB.
          </p>

        </div>
      </div>
    </div>
  );
}