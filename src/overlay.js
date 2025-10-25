// Prevent multiple overlays
if (document.getElementById("yt-overlay")) {
  console.warn("Overlay already exists. Toggling visibility.");
  const existingOverlay = document.getElementById("yt-overlay");
  // Optional: Toggle visibility instead of preventing creation
  existingOverlay.style.display = (existingOverlay.style.display === "none" ? "block" : "none");
} else {
  const overlay = document.createElement("div");
  overlay.id = "yt-overlay";

  // Minimal CSS for styling (using a style attribute for simplicity)
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
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    width: 350px; /* <--- WIDER OVERLAY */
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

  // HTML structure
  overlay.innerHTML = `
    <style>
        /* Styles scoped to the overlay */
        .yt-btn {
            width: 100%; 
            padding: 10px; /* Slightly larger padding */
            font-weight: bold;
            color: #fff; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            text-align: center;
        }
        .yt-btn:hover {
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
        }
        #capture { background: #c00; margin-bottom : 10px; }
        #capture:hover { background: #d00; }

        #metadata { background: #1a73e8; } /* Google Blue */
        #metadata:hover { background: #1668cc; }

        #save { background: #070; }
        #save:hover { background: #090; }
    </style>

<button id="capture" class="yt-btn">Capture Screenshot + Info</button>
    <button id="metadata" class="yt-btn">Add Metadata</button>
    
    <div id="info" style="
        margin-top:0; 
        padding: 5px;
        font-size:13px; 
        color:#aaa;
        background: #2a2a2a;
        border-radius: 4px;
    "></div>
    
    <textarea id="textarea" rows="8" cols="30" placeholder="Write your notes here..."
    style="
        width:100%; 
        min-height: 180px; /* <--- TEXTAREA IS TALLER */
        box-sizing: border-box; 
        resize:vertical;
        background:#2a2a2a; 
        color:#fff; 
        border:1px solid #444;
        border-radius:6px; 
        padding:10px;
        font-size: 14px;
        line-height: 1.5;
    "></textarea>
    
    <button id="save" class="yt-btn">Save Notes (to Markdown)</button>
`;

  document.body.appendChild(overlay);

  // METADATA
  document.getElementById("metadata").addEventListener("click", () => {
    console.log("[Overlay] Metadata button clicked. Requesting data...");
    // Send a simple request to the background script
    browser.runtime.sendMessage({ action: "getMetadataRequest" });
  });

  // CAPTURE button: Triggers the main workflow in background.js
  document.getElementById("capture").addEventListener("click", () => {
    browser.runtime.sendMessage({ action: "captureRequest" });
  });

  // SAVE button: Sends textarea content to background.js for saving
  document.getElementById("save").addEventListener("click", () => { // Removed 'async' from the function
    console.log("[Overlay] Save button clicked! (Sending message to background...)"); // STEP 1: Check if the button is firing

    const saveButton = document.getElementById("save");
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    const content = document.getElementById("textarea").value;

    // CRITICAL FIX 1: Do NOT use 'await' here. Fire and forget the message.
    browser.runtime.sendMessage({ action: "saveNotes", content })
      .then(() => {
        // This 'then' might still fire before the file is saved, 
        // so we rely on the notesSavedConfirmation message from the background.
      })
      .catch(error => {
        // CRITICAL FIX 2: This will now catch the timeout/disconnect error and display it.
        console.error("[Overlay] Failed to send/receive saveNotes response:", error);
        saveButton.textContent = "Error! ❌ (Check Console)";
        saveButton.disabled = false;
        setTimeout(() => saveButton.textContent = "Save", 3000);
      });

    // We rely entirely on the background script to send the 'notesSavedConfirmation' 
    // message when the download is truly finished.
  });
  // --- Message Listeners from Background Script ---
  browser.runtime.onMessage.addListener((msg) => {
    // Update the info div after a successful capture
    if (msg.action === "displayInfo") {
      const { title, channel, time } = msg.info;
      const infoDiv = document.getElementById("info");
      infoDiv.innerHTML = `
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

      const metadataString = `---
Title: ${title || "N/A"}
Channel: ${channel || "N/A"}
---
`;
      // Prepend the metadata to the textarea
      textarea.value = metadataString + textarea.value;
      console.log("[Overlay] Metadata added to textarea.");
    }
  });
}
