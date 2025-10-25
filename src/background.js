browser.browserAction.onClicked.addListener(async (tab) => {
  // 1. When the extension icon is clicked, inject the overlay script
  await browser.tabs.executeScript(tab.id, { file: "src/overlay.js" });
});

let latestFilename = null;

async function captureScreenshot(msg) {
  try {
    const { rect } = msg;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;   // Generate a timestamped filename

    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const img = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const canvas = new OffscreenCanvas(rect.width * rect.devicePixelRatio, rect.height * rect.devicePixelRatio);
    const ctx = canvas.getContext("2d");

    // Crop the image to the video's bounding box
    ctx.drawImage(
      img,
      rect.x * rect.devicePixelRatio,
      rect.y * rect.devicePixelRatio,
      rect.width * rect.devicePixelRatio,
      rect.height * rect.devicePixelRatio,
      0,
      0,
      rect.width * rect.devicePixelRatio,
      rect.height * rect.devicePixelRatio
    );

    const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
    const croppedUrl = URL.createObjectURL(croppedBlob);


    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const date = `${YYYY}-${MM}-${DD}-${hh}-${mm}-${ss}`;

    const folder = "yt";
    const filename = `screenshot/screenshot-${date}.png`;
    latestFilename = filename;

    // Download the file
    await browser.downloads.download({
      url: croppedUrl,
      filename: `${folder}/${filename}`
    });

    // Send the filename back to the overlay to update the textarea
    browser.tabs.sendMessage(tabId, { action: "newFilename", filename });
    console.log("Cropped frame saved as", filename);

  } catch (err) {
    console.error("Capture failed:", err);
  }
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  // Logic for the 'Capture Screenshot' button in the overlay
  if (msg.action === "captureRequest") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    await browser.tabs.executeScript(tab.id, { file: "src/content.js" });

    const { title, channel } = await browser.tabs.sendMessage(tab.id, { action: "getVideoInfo" });
    console.log(title, channel)
    const { time } = await browser.tabs.sendMessage(tab.id, { action: "getTimestamp" });

    const rect = await browser.tabs.sendMessage(tab.id, { action: "getVideoRect" });
    captureScreenshot({ rect });

    browser.tabs.sendMessage(tab.id, {
      action: "displayInfo",
      info: { title, channel, time }
    });
  }

  if (msg.action === "saveNotes") {
    (async () => {
      const result = await browser.storage.local.get("title");
      let title = result.title || "unknown_video";
      const filename = `yt/${title}.md`;

      const blob = new Blob([msg.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      await browser.downloads.download({
        url,
        filename,
        saveAs: false
      });

      URL.revokeObjectURL(url);
      console.log("[Background] Saved file:", filename);
      // Send a confirmation back to the overlay if needed, or simply let it resolve.
      // Returning true is CRITICAL for async responses in MV2 listeners
      sender.tab && browser.tabs.sendMessage(sender.tab.id, { action: "notesSaved" });
    })();

    return true; // Keeps the message channel open for the async response
  }

  if (msg.action === "getMetadataRequest") {

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;

    try {
      await browser.tabs.executeScript(tab.id, { file: "src/content.js" });

      // Now, content.js is guaranteed to be ready to receive the message
      const { title, channel } = await browser.tabs.sendMessage(tab.id, { action: "getVideoInfo" });
      console.log(title, channel)

      browser.tabs.sendMessage(tabId, {
        action: "metadataResponse",
        info: { title, channel }
      });

      console.log("[Background] Metadata retrieved and sent to overlay.");

    } catch (error) {
      // The error is now likely a legitimate failure to get info, not a communication error.
      console.error("[Background] Failed to get metadata from content script:", error);
    }
  }
});
