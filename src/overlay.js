if (document.getElementById("yt-overlay")) {
  const overlay = document.getElementById("yt-overlay");
  overlay.style.display = overlay.style.display === "none" ? "block" : "none";
} else {
  const overlay = document.createElement("div");
  overlay.id = "yt-overlay";
  overlay.style.cssText = `
  position: fixed;
  top: 80px;
  right: 40px;
  z-index: 999999;
  background: #1e1e1e;
  color: #f0f0f0;
  padding: 16px;
  border: 1px solid #333;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.6);
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-family: sans-serif;
  `;

  overlay.innerHTML = `
    <button id="capture" class="yt-btn">Capture Screenshot + Info</button>
    <button id="metadata" class="yt-btn">Add Metadata</button>
    <div id="info" style="background:#2a2a2a;padding:5px;border-radius:4px;font-size:13px;color:#aaa;"></div>
    <textarea id="textarea" rows="8" cols="30" placeholder="Write your notes here..." style="width:100%;background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:6px;padding:10px;font-size:14px;"></textarea>
    `;

  document.body.appendChild(overlay);

  // Messaging via window.postMessage
  const sendToExtension = (action, payload = {}) => {
    window.postMessage({ action, payload }, "*");
  };

  document.getElementById("capture").addEventListener("click", () => {
    sendToExtension("captureRequest");
  });

  document.getElementById("metadata").addEventListener("click", () => {
    sendToExtension("getMetadataRequest");
  });

  window.addEventListener("message", (event) => {
    if (!event.data?.fromExtension) return;
    const msg = event.data.msg;

    if (msg.action === "displayInfo") {
      const { title, channel, time } = msg.info;
      document.getElementById("info").innerHTML = `
        <b>Captured:</b><br>
        Title: ${title}<br>
        Channel: ${channel}<br>
        Timestamp: ${time}
      `;
    }

    if (msg.action === "newFilename") {
      const textarea = document.getElementById("textarea");
      textarea.value += `\n![](${msg.filename})`;
    }

    if (msg.action === "metadataResponse") {
      const { title, channel } = msg.info;
      const textarea = document.getElementById("textarea");
      const metadata = `---\nTitle: ${title}\nChannel: ${channel}\n---\n`;
      textarea.value = metadata + textarea.value;
    }
  });
}
