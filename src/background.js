let latestFilename = null;

async function captureScreenshot({ rect }) {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });

    const img = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const canvas = new OffscreenCanvas(rect.width * rect.devicePixelRatio, rect.height * rect.devicePixelRatio);
    const ctx = canvas.getContext("2d");

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

    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const folder = "notesfromyt";


    // await browser.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   files: ["src/content.js"]
    // });

    // Take value from local
    // const { title } = await browser.storage.local.get("title");

    // No, Take value from youtube page, because in local value maybe wrong
    const { title } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });


    const safeTitle = (title || "unknown_video").replace(/[\/\\:.'*?"<>|]/g, "").trim();

    const filename = `screenshot/screenshot-${date}.png`;
    latestFilename = filename;

    await browser.downloads.download({
      url: croppedUrl,
      filename: `${folder}/${safeTitle}/${filename}`,
      saveAs: false
    });

    browser.runtime.sendMessage({ action: "newFilename", filename });
  } catch (err) {
    console.error("Capture failed:", err);
  }
}

browser.runtime.onMessage.addListener((msg) => {
  switch (msg.action) {
    case "captureVideoFrame":
      captureScreenshot(msg);
      break;
    case "getFilename":
      return Promise.resolve({ filename: latestFilename });

  }
});


async function summarizeTranscript(transcriptText) {
  const { geminiKey } = await browser.storage.local.get("geminiKey")
  const model = "gemini-2.5-flash";

  // Use a template literal (backticks ``) for the URL to embed the model variable
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(
    url, // Use the correctly formatted URL
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 2. CORRECT AUTHENTICATION: Pass the API key in the custom header
        "x-goog-api-key": geminiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Analyze the following YouTube transcript. Extract the important points, main arguments, and final conclusion. " +
                  "Do not include any introductory or concluding sentences outside of the list.\n\n" +
                  "Transcript:\n\n" + transcriptText,
                // text: "Summarize this YouTube transcript clearly and concisely in markdown foramt:\n\n" + transcriptText
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    // Include status code in the error message for better debugging
    throw new Error(`Gemini API error (Status: ${response.status}): ${err}`);
  }

  const data = await response.json();
  const summary =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "No output.";

  console.log("Summary:", summary);
  return summary;
}


browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "FETCH_TRANSCRIPT") {
    try {
      const { youtubeKey } = await browser.storage.local.get("youtubeKey");
      const res = await fetch("https://www.youtube-transcript.io/api/transcripts", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${youtubeKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: [message.videoId] })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Transcript API failed: ${res.status} ${errText}`);
      }

      const json = await res.json();

      const transcriptText = json[0]?.tracks?.[0]?.transcript
        ?.map(t => t.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!transcriptText) throw new Error("No transcript found.");

      const summary = await summarizeTranscript(transcriptText);
      console.log(summary)
      await browser.storage.local.set({ lastSummary: summary });

      return { summary: summary };
    } catch (err) {
      console.error("Error:", err);
      return { error: err.message };
    }
  }
  return true;
});
