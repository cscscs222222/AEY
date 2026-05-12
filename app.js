const analyzeBtn = document.getElementById("analyzeBtn");
const messageInput = document.getElementById("message");
const resultsSection = document.getElementById("results");
const errorBox = document.getElementById("error");
const vibeCheck = document.getElementById("vibeCheck");
const optionA = document.getElementById("optionA");
const optionB = document.getElementById("optionB");
const optionC = document.getElementById("optionC");
const keyStatus = document.getElementById("keyStatus");

const STATUS_LABELS = {
  "configured": "Hazır",
  "missing": "Eksik",
  "success": "Başarılı",
  "error": "Başarısız",
  "pending": "Bilgi bekleniyor",
};

let currentProvider = "Gemini";

const setLoading = (state) => {
  if (state) {
    analyzeBtn.classList.add("loading");
    analyzeBtn.disabled = true;
  } else {
    analyzeBtn.classList.remove("loading");
    analyzeBtn.disabled = false;
  }
};

const setError = (message) => {
  errorBox.textContent = message;
};

const setKeyStatus = ({ provider, state }) => {
  if (!keyStatus) {
    return;
  }
  const label = STATUS_LABELS[state] || STATUS_LABELS.pending;
  keyStatus.textContent = `Anahtar: ${provider} • Durum: ${label}`;
  keyStatus.dataset.state = state;
};

const applyBackendStatus = (payload, fallbackState) => {
  if (!payload) {
    setKeyStatus({ provider: currentProvider, state: fallbackState });
    return;
  }
  currentProvider = payload.provider || currentProvider;
  const mappedState = payload.key_status || fallbackState;
  setKeyStatus({ provider: currentProvider, state: mappedState });
};

const fetchKeyStatus = async () => {
  if (!keyStatus) {
    return;
  }
  try {
    const response = await fetch("/status");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    currentProvider = data.provider || currentProvider;
    const state = data.key_configured ? "configured" : "missing";
    setKeyStatus({ provider: currentProvider, state });
  } catch (error) {
    setKeyStatus({ provider: currentProvider, state: "error" });
  }
};

const fillResults = (data) => {
  vibeCheck.textContent = data.vibe_check || "";
  optionA.textContent = data.secenek_a || "";
  optionB.textContent = data.secenek_b || "";
  optionC.textContent = data.secenek_c || "";
  resultsSection.classList.remove("hidden");
};

const copyText = async (text, button) => {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Kopyalandı";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch (error) {
    setError("Kopyalama başarısız oldu.");
  }
};

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.copy;
    const target = document.getElementById(targetId);
    if (target && target.textContent.trim()) {
      copyText(target.textContent, button);
    }
  });
});

fetchKeyStatus();

analyzeBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) {
    setError("Önce bir mesaj yapıştır.");
    return;
  }

  setError("");
  setLoading(true);

  let didUpdateStatus = false;

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      applyBackendStatus(payload, "error");
      didUpdateStatus = true;
      throw new Error(payload.error || "Bir şeyler ters gitti.");
    }

    const data = await response.json();
    applyBackendStatus(data, "success");
    didUpdateStatus = true;
    fillResults(data);
  } catch (error) {
    if (!didUpdateStatus) {
      applyBackendStatus(null, "error");
    }
    setError(error.message || "Sunucu hatası oluştu.");
  } finally {
    setLoading(false);
  }
});
