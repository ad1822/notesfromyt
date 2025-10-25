async function saveTextareaToFile(textarea) {
  if (!textarea) return;

  const result = await browser.storage.local.get("title");
  let title = result.title || "unknown_video";

  // title = title.replace(/[\/\\:*?"<>|]/g, "").trim();

  // Folder + filename
  const filename = `yt/${title}.md`;

  // Get textarea content
  const content = textarea.value;

  // Create Blob URL
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  // Use extension API to download — folder works
  await browser.downloads.download({
    url: url,
    filename: filename, // 'yt/' folder works here
    saveAs: false       // optional: set true to show Save dialog
  });

  URL.revokeObjectURL(url);

  // console.log(`Saved notes as ${filename}`);
}

document.getElementById("textarea");
document.getElementById("save").addEventListener("click", () => {
  saveTextareaToFile(textarea);
});

document.getElementById("capture").addEventListener("click", async () => {
  const infoDiv = document.getElementById("info");
  const textarea = document.getElementById("textarea");

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Get video info
    const { title, channel } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });

    const { time } = await browser.tabs.sendMessage(tab.id, { action: "getTimestamp" });

    // const { lastFilename } = await browser.storage.local.get("lastFilename");
    // console.log("Filename from storage:", lastFilename);

    infoDiv.innerHTML = `
      <b>Captured:</b><br>
      Title: ${title || "Unknown"}<br>
      Channel: ${channel || "Unknown"}<br>
      Timestamp: ${time}<br>
    `;
    // Filename : ${lastFilename}<br>
    // textarea.value += `\n![](${lastFilename})`

  } catch (err) {
    console.error(err);
  }
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "newFilename") {
    const textarea = document.getElementById("textarea");
    textarea.value += `\n![](${msg.filename})`;
  }
});

// Get latest filename when popup opens
(async () => {
  const { filename } = await browser.runtime.sendMessage({ action: "getFilename" });
  if (filename) {
    const textarea = document.getElementById("textarea");
    textarea.value += `\n![](${filename})`;
  }
})();
