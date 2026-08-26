(function () {
  const sessionId =
    localStorage.getItem("canplus_session_id") ||
    (() => {
      const id = "sess_" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("canplus_session_id", id);
      return id;
    })();

  const messagesEl = document.getElementById("messages");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const quickActions = document.getElementById("quickActions");

  const modalOverlay = document.getElementById("demoModalOverlay");
  const demoForm = document.getElementById("demoForm");
  const demoConfirmation = document.getElementById("demoConfirmation");
  const closeModalBtn = document.getElementById("closeModal");

  function addMessage(role, text) {
    const el = document.createElement("div");
    el.className = "msg " + role;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "msg typing";
    el.textContent = "CanPlus assistant is typing...";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function openDemoModal() {
    modalOverlay.classList.remove("hidden");
    demoForm.classList.remove("hidden");
    demoConfirmation.classList.add("hidden");
  }

  function closeDemoModal() {
    modalOverlay.classList.add("hidden");
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMessage("user", text);
    input.value = "";
    sendBtn.disabled = true;
    const typingEl = showTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();
      typingEl.remove();

      if (!res.ok) {
        addMessage("assistant", data.error || "Something went wrong. Please try again.");
        return;
      }

      addMessage("assistant", data.reply);
      quickActions.classList.remove("hidden");

      if (data.showDemoForm) {
        openDemoModal();
      }
    } catch (err) {
      typingEl.remove();
      addMessage("assistant", "I couldn't reach the server. Please try again in a moment.");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  quickActions.addEventListener("click", (e) => {
    const btn = e.target.closest(".qa-btn");
    if (!btn) return;
    sendMessage(btn.dataset.msg);
  });

  closeModalBtn.addEventListener("click", closeDemoModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeDemoModal();
  });

  demoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(demoForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        demoConfirmation.textContent = data.error || "Something went wrong submitting your request.";
        demoConfirmation.classList.remove("hidden");
        return;
      }

      demoForm.classList.add("hidden");
      demoConfirmation.textContent = data.message;
      demoConfirmation.classList.remove("hidden");
      addMessage("assistant", data.message);
    } catch (err) {
      demoConfirmation.textContent = "Could not submit your request. Please try again.";
      demoConfirmation.classList.remove("hidden");
    }
  });

  // Opening message
  addMessage(
    "assistant",
    "Hi! I'm the CanPlus assistant. I can help you understand whether CanPlus is a good fit for your organization and which deployment approach may suit your requirements.\n\nWhat are you currently using for learning management, and what are you hoping to improve?"
  );
})();
