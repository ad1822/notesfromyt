
async function loadSettings() {
  const settings = await browser.storage.local.get(["geminiKey", "youtubeKey"]);
  document.getElementById("geminiKey").value = settings.geminiKey || "";
  document.getElementById("youtubeKey").value = settings.youtubeKey || "";
}

async function saveSettings() {
  const geminiKey = document.getElementById("geminiKey").value.trim();
  const youtubeKey = document.getElementById("youtubeKey").value.trim();

  await browser.storage.local.set({ geminiKey, youtubeKey });
  alert("Settings saved successfully.");
}

document.getElementById("saveBtn").addEventListener("click", saveSettings);
loadSettings();
