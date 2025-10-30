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


    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Take value from local
    // const { title } = await browser.storage.local.get("title");

    // No, Take value from youtube page, because in local value maybe wrong
    const { title } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });

    const safeTitle = (title || "unknown_video").replace(/[\/\\:*?"<>|]/g, "").trim();

    const filename = `screenshot/screenshot-${date}.png`;
    latestFilename = filename;

    await browser.downloads.download({
      url: croppedUrl,
      filename: `${folder}/${safeTitle}/${filename}`,
      saveAs: false
    });

    browser.runtime.sendMessage({ action: "newFilename", filename });
    // console.log("Cropped frame saved as", filename);
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
                  "Analyze the following YouTube transcript and produce a concise, structured report in Markdown only.\n\n" +
                  "Output structure (required):\n" +
                  "1. Title — one line, precise, and forward-looking.\n" +
                  "2. TL;DR (≤40 words) — a single-sentence concise summary.\n" +
                  "3. Key Points — numbered list of the 6–10 most important facts or claims (1–2 lines each).\n" +
                  "4. Core Arguments / Reasoning — numbered list explaining the main arguments or lines of reasoning (1–3 lines each).\n" +
                  "5. Evidence & Examples — bullet list of the most persuasive examples, data points, or demonstrations cited in the transcript (include exact phrasing if quoted).\n" +
                  "6. Notable Quotes — up to 5 verbatim quotes (preserve original wording; enclose in blockquote).\n" +
                  "7. Timestamps — if timestamps are available, map the most important items to approximate timestamps (format: MM:SS — point). If not available, write: N/A.\n" +
                  "8. Actionable Takeaways — 3–6 specific, prioritized actions a knowledgeable practitioner could implement immediately (imperative verbs, 1 line each).\n" +
                  "9. Suggested Chapters / Headings — 4–6 short chapter titles suitable for turning the transcript into a 3–6 minute article or blog post.\n" +
                  "10. Suggested Tweet (≤240 characters) — one punchy, shareable sentence.\n" +
                  "11. Tags / Keywords — 6–10 single-word or short-phrase tags, comma-separated.\n" +
                  "12. Confidence — one short sentence stating the confidence level in the summary and any obvious blind spots or missing context.\n\n" +
                  "Rules & Constraints:\n" +
                  "- Output only Markdown following the exact structure above. Do not write any additional commentary, preamble, or concluding statements outside the sections.\n" +
                  "- Keep the TL;DR ≤ 40 words and Actionable Takeaways practical and prioritized.\n" +
                  "- For Key Points, prefer clarity over verbosity; each item 1–2 lines.\n" +
                  "- Preserve verbatim text for Notable Quotes; escape or remove problematic characters if necessary.\n" +
                  "- If timestamps are not present, omit the Timestamps section or write N/A.\n" +
                  "- Use plain language, professional tone, and avoid speculation beyond what the transcript supports. If a point is uncertain, label it with (uncertain) and a one-line rationale.\n\n" +
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
