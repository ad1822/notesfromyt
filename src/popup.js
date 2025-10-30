async function saveTextareaToFile(textarea) {
  if (!textarea) return;

  const result = await browser.storage.local.get("title");
  let title = result.title || "unknown_video";

  title = title.replace(/[\/\\:*?"<>|]/g, "").trim();
  const filename = `notesfromyt/${title}/${title}.md`;

  const content = textarea.value;
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const existing = await browser.downloads.search({ filename });

  if (existing && existing.length > 0) {
    try {
      await browser.downloads.removeFile(existing[0].id);
    } catch (e) {
      console.warn("removeFile not supported, erasing download entry instead");
    }
    await browser.downloads.erase({ id: existing[0].id });
  }

  // Download new version
  await browser.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: "overwrite" // ensure overwrite if supported
  });

  URL.revokeObjectURL(url);
}

document.getElementById("clean").addEventListener("click", async () => {
  const textarea = document.getElementById("textarea");
  textarea.value = ""
  await browser.storage.local.set({ notes: textarea.value });
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
    const textToInsert = `\n[${time}](https://youtu.be/${hash}?t=${actualTime})`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value =
      textarea.value.substring(0, start) + // Text before the cursor
      textToInsert +                       // The new text
      textarea.value.substring(end);       // Text after the cursor

    const newCursorPosition = start + textToInsert.length;
    textarea.selectionStart = newCursorPosition;
    textarea.selectionEnd = newCursorPosition;

    textarea.focus();
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


document.getElementById("open-settings").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

browser.runtime.onMessage.addListener(async (msg) => {
  const textarea = document.getElementById("textarea");
  if (!textarea) {
    console.error("Textarea element not found.");
    return;
  }

  if (msg.action === "newFilename") {
    const textToInsert = `\n![](${msg.filename})`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value =
      textarea.value.substring(0, start) +
      textToInsert +
      textarea.value.substring(end);

    const newCursorPosition = start + textToInsert.length;
    textarea.selectionStart = newCursorPosition;
    textarea.selectionEnd = newCursorPosition;

    textarea.focus();
  }

  await browser.storage.local.set({ notes: textarea.value });
});

document.getElementById("bold").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `**${selectedText}**` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})


document.getElementById("italic").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `_${selectedText}_` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})


document.getElementById("checkbox").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `- [ ] ${selectedText}` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})

document.getElementById("bullets").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);

  const lines = selectedText.split('\n');

  const bulletedLines = lines.map(line => `- ${line}`);

  const newText = bulletedLines.join('\n');

  const newValue = currentValue.slice(0, start) + `${newText}` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})


document.getElementById("h1").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `# ${selectedText}` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})


document.getElementById("h2").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `## ${selectedText}` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})


document.getElementById("h3").addEventListener("click", async () => {
  const textarea = document.getElementById('textarea');

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const currentValue = textarea.value;

  const selectedText = textarea.value.substring(start, end);
  const newValue = currentValue.slice(0, start) + `### ${selectedText}` + currentValue.slice(end)

  textarea.value = newValue

  await browser.storage.local.set({ notes: textarea.value });
})

const textarea = document.getElementById("textarea");

textarea.addEventListener("input", async () => {
  await browser.storage.local.set({ notes: textarea.value });
});

// popup.js - Click Handler Update
const script = document.getElementById("transcript");
script.addEventListener("click", async () => {
  const textarea = document.getElementById("textarea");
  const { hash } = await browser.storage.local.get("hash");

  await browser.storage.local.remove(["lastSummary", "lastError"]);

  textarea.value = (textarea.value || "") + "\n\n[Starting summary... Please wait or check back later.]";

  browser.runtime.sendMessage({ type: "FETCH_TRANSCRIPT", videoId: hash });

  await browser.storage.local.set({ notes: textarea.value });
});

// Load saved content when popup opens
// (async () => {
//   const { notes } = await browser.storage.local.get("notes");
//   if (notes) textarea.value = notes;
// })();

document.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById("textarea");

  const { notes, lastSummary, lastError } = await browser.storage.local.get(["notes", "lastSummary", "lastError"]);

  if (notes) {
    textarea.value = notes;
  }

  if (lastSummary) {
    textarea.value = textarea.value.replace(/\n\n\[Starting summary... Please wait or check back later\.\]/g, '');

    textarea.value = textarea.value + "\n\n### Summary\n\n" + lastSummary;

    await browser.storage.local.set({ notes: textarea.value });
    await browser.storage.local.remove("lastSummary");

  } else if (lastError) {
    textarea.value = textarea.value.replace(/\n\n\[Starting summary... Please wait or check back later\.\]/g, '');
    textarea.value = textarea.value + "\n\n[Error during summarization: " + lastError + "]";

    await browser.storage.local.set({ notes: textarea.value });
    await browser.storage.local.remove("lastError");
  }
});
