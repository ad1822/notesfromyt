browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "capture") {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const imageData = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });

      // Convert base64 data URL to Blob
      const res = await fetch(imageData);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      await browser.downloads.download({
        url: objectUrl,
        filename: "tab_screenshot.png",
        saveAs: false
      });

      console.log("Screenshot captured and downloaded successfully.");
    } catch (err) {
      console.error("Error capturing screenshot:", err);
    }
  }
});
