"use client";
import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "react-todolist";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let _nextId = Date.now();
function uid() { return ++_nextId; }

export default function TodoList() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTasks(prev => [...prev, { id: uid(), text, done: false }]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggle = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const startEdit = (t) => { setEditingId(t.id); setEditText(t.text); };

  const confirmEdit = (id) => {
    const text = editText.trim();
    if (text) setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    setEditingId(null);
  };

  const clearDone = () => setTasks(prev => prev.filter(t => !t.done));

  const filtered = tasks.filter(t =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Mes tâches</h1>
          <span style={styles.badge}>{tasks.length - doneCount} restantes</span>
        </div>

        {/* Add input */}
        <div style={styles.addRow}>
          <input
            ref={inputRef}
            style={styles.addInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Ajouter une tâche…"
          />
          <button style={styles.addBtn} onClick={add}>+</button>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          {["all", "active", "done"].map(f => (
            <button
              key={f}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toutes" : f === "active" ? "En cours" : "Terminées"}
            </button>
          ))}
        </div>

        {/* Task list */}
        <ul style={styles.list}>
          {filtered.length === 0 && (
            <li style={styles.empty}>Aucune tâche ici.</li>
          )}
          {filtered.map(t => (
            <li key={t.id} style={styles.item}>
              {/* Checkbox */}
              <button
                style={{ ...styles.cb, ...(t.done ? styles.cbDone : {}) }}
                onClick={() => toggle(t.id)}
                aria-label={t.done ? "Marquer non terminé" : "Marquer terminé"}
              >
                {t.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Text / Edit */}
              {editingId === t.id ? (
                <input
                  autoFocus
                  style={styles.editInput}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") confirmEdit(t.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => confirmEdit(t.id)}
                />
              ) : (
                <span
                  style={{ ...styles.label, ...(t.done ? styles.labelDone : {}) }}
                  onDoubleClick={() => !t.done && startEdit(t)}
                  title={!t.done ? "Double-cliquer pour modifier" : ""}
                >
                  {t.text}
                </span>
              )}

              {/* Actions */}
              <div style={styles.actions}>
                {!t.done && editingId !== t.id && (
                  <button style={styles.iconBtn} onClick={() => startEdit(t)} title="Modifier">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M9 2L11 4L4.5 10.5H2.5V8.5L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <button style={{ ...styles.iconBtn, ...styles.iconDel }} onClick={() => remove(t.id)} title="Supprimer">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2.5 3.5H10.5M5 3.5V2.5H8V3.5M4 3.5L4.5 10.5H8.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        {doneCount > 0 && (
          <div style={styles.footer}>
            <button style={styles.clearBtn} onClick={clearDone}>
              Supprimer les terminées ({doneCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0ede8",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "3rem 1rem",
    fontFamily: "'Georgia', serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e2dc",
    padding: "2rem",
    width: "100%",
    maxWidth: "480px",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "22px",
    fontWeight: "normal",
    color: "#1a1a18",
    letterSpacing: "-0.3px",
  },
  badge: {
    fontSize: "12px",
    background: "#f0ede8",
    color: "#7a7570",
    padding: "3px 10px",
    borderRadius: "99px",
    fontFamily: "system-ui, sans-serif",
  },
  addRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "1rem",
  },
  addInput: {
    flex: 1,
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "'Georgia', serif",
    color: "#1a1a18",
    background: "#faf9f7",
  },
  addBtn: {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "8px",
    background: "#1a1a18",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  filters: {
    display: "flex",
    gap: "6px",
    marginBottom: "1.25rem",
  },
  filterBtn: {
    padding: "4px 12px",
    fontSize: "12px",
    border: "1px solid #e0ddd8",
    borderRadius: "99px",
    background: "transparent",
    color: "#7a7570",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  filterActive: {
    background: "#1a1a18",
    color: "#fff",
    border: "1px solid #1a1a18",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    borderBottom: "1px solid #f0ede8",
  },
  cb: {
    width: "20px",
    height: "20px",
    minWidth: "20px",
    border: "1.5px solid #ccc",
    borderRadius: "6px",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cbDone: {
    background: "#1a1a18",
    border: "1.5px solid #1a1a18",
  },
  label: {
    flex: 1,
    fontSize: "14px",
    color: "#1a1a18",
    fontFamily: "'Georgia', serif",
    cursor: "default",
  },
  labelDone: {
    textDecoration: "line-through",
    color: "#bbb",
  },
  editInput: {
    flex: 1,
    fontSize: "14px",
    border: "none",
    borderBottom: "1.5px solid #1a1a18",
    outline: "none",
    padding: "0 0 2px",
    fontFamily: "'Georgia', serif",
    color: "#1a1a18",
    background: "transparent",
  },
  actions: {
    display: "flex",
    gap: "4px",
    opacity: 0,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#aaa",
    padding: "2px",
    display: "flex",
    alignItems: "center",
  },
  iconDel: {
    color: "#daa",
  },
  empty: {
    fontSize: "13px",
    color: "#bbb",
    padding: "1rem 0",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
  },
  footer: {
    marginTop: "1rem",
    textAlign: "right",
  },
  clearBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "#aaa",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
