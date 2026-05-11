const analyzeBtn = document.getElementById("analyzeBtn");
const messageInput = document.getElementById("message");
const resultsSection = document.getElementById("results");
const errorBox = document.getElementById("error");
const vibeCheck = document.getElementById("vibeCheck");
const optionA = document.getElementById("optionA");
const optionB = document.getElementById("optionB");
const optionC = document.getElementById("optionC");

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

analyzeBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) {
    setError("Önce bir mesaj yapıştır.");
    return;
  }

  setError("");
  setLoading(true);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Bir şeyler ters gitti.");
    }

    const data = await response.json();
    fillResults(data);
  } catch (error) {
    setError(error.message || "Sunucu hatası oluştu.");
  } finally {
    setLoading(false);
  }
});
