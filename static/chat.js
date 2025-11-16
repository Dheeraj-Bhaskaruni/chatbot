// static/chat.js

// ----- DOM hooks -----
const chat = document.getElementById("chat");
const form = document.getElementById("form");
const msg  = document.getElementById("msg");
const send = document.getElementById("send");

// Derive the base path from the current page (works at /, /chatbot/, /foo/bar/)
const BASE = window.location.pathname.replace(/\/$/, ""); // no trailing slash
const CHAT_URL = `${BASE}/chat`; // e.g. "/chatbot/chat"

// ----- UI helpers -----
function addRow(text, who) {
  const row = document.createElement("div");
  row.className = `row ${who}`;

  const box = document.createElement("div");
  box.style.display = "flex";
  box.style.flexDirection = "column";

  const role = document.createElement("div");
  role.className = "role";
  role.textContent = who === "you" ? "You" : "Assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  box.appendChild(role);
  box.appendChild(bubble);
  row.appendChild(box);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function setLoading(loading) {
  send.disabled = loading;
  if (loading) {
    send.dataset.prev = send.textContent;
    send.textContent = "Sending…";
  } else {
    send.textContent = send.dataset.prev || "Send";
  }
}

// ----- Chat flow -----
async function ask(text) {
  addRow(text, "you");
  setLoading(true);

  // Optional loading spinner next to the button
  const loader = document.createElement("span");
  loader.className = "spinner";
  send.after(loader);

  try {
    console.log("[chat] POST", CHAT_URL, { message: text });
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch (e) {
      console.warn("[chat] Response not JSON:", e);
    }

    console.log("[chat] status:", res.status, "payload:", payload);

    if (!res.ok) {
      const msg = (payload && payload.error) ? payload.error : `${res.status} ${res.statusText}`;
      addRow(`Error: ${msg}`, "bot");
      return;
    }

    if (payload && payload.reply) {
      addRow(payload.reply, "bot");
    } else if (payload && payload.error) {
      addRow(`Error: ${payload.error}`, "bot");
    } else {
      addRow("Unexpected response from server.", "bot");
    }
  } catch (e) {
    console.error("[chat] fetch failed:", e);
    addRow("Network error. Please try again.", "bot");
  } finally {
    setLoading(false);
    loader.remove();
  }
}

// ----- Events -----
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = msg.value.trim();
  if (!text) return;
  msg.value = "";
  ask(text);
});

// Submit on Enter (no Shift)
msg.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
