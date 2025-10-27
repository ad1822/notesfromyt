async function saveTextareaToFile(textarea) {
  if (!textarea) return;

  const result = await browser.storage.local.get("title");
  let title = result.title || "unknown_video";

  title = title.replace(/[\/\\:*?"<>|]/g, "").trim();

  const filename = `notesfromyt/${title}/${title}.md`;

  const content = textarea.value;

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  // console.log(filename)

  await browser.downloads.download({
    url: url,
    filename: filename,
    saveAs: false
  });

  URL.revokeObjectURL(url);
}

document.getElementById("clean").addEventListener("click", () => {
  const textarea = document.getElementById("textarea");
  textarea.value = ""
})

document.getElementById("save").addEventListener("click", () => {
  saveTextareaToFile(textarea);
});

document.getElementById("metadata").addEventListener("click", async () => {
  const textarea = document.getElementById("textarea");

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Get video info
    const { title, channel, url, duration } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });

    textarea.value = `---\ntitle: ${title || "Unknown"}\nchannel: ${channel || "Unknown"}\nsource: ${url}\nduration: ${duration}\n---\n` + textarea.value

    await browser.storage.local.set({ notes: textarea.value });

  } catch (err) {
    console.error(err);
  }
})

document.getElementById("timestamp").addEventListener("click", async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    const { time, actualTime } = await browser.tabs.sendMessage(tab.id, {
      action: "getTimestamp"
    });

    const { hash } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });


    const textarea = document.getElementById("textarea");
    textarea.value += `\n[${time}](https://youtu.be/${hash}?t=${actualTime})`;
    await browser.storage.local.set({ notes: textarea.value });

  } catch (err) {
    console.error(err);
  }
});

document.getElementById("capture").addEventListener("click", async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.captureCurrentVideoFrame()
    });

  } catch (err) {
    console.error(err);
  }
});

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "newFilename") {
    const textarea = document.getElementById("textarea");
    textarea.value += `\n![](${msg.filename})`;
  }
  const textarea = document.getElementById("textarea");

  await browser.storage.local.set({ notes: textarea.value });
});


const textarea = document.getElementById("textarea");

textarea.addEventListener("input", async () => {
  await browser.storage.local.set({ notes: textarea.value });
});

// Load saved content when popup opens
(async () => {
  const { notes } = await browser.storage.local.get("notes");
  if (notes) textarea.value = notes;
})();
