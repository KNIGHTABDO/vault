import fs from "node:fs/promises";

async function parseWithPdfJs(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const doc = await task.promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => (typeof item?.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      pageTexts.push(text);
    }
  }

  await doc.destroy().catch(() => undefined);

  return {
    ok: true,
    parser: "pdfjs-dist-script",
    pages: Number(doc.numPages || 0),
    text: pageTexts.join("\n\n").trim(),
    details: {
      pages: Number(doc.numPages || 0),
    },
  };
}

async function parseWithPdfParse(buffer) {
  const pdfModule = await import("pdf-parse");
  const parser = new pdfModule.PDFParse({ data: buffer });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo().catch(() => undefined),
    ]);

    return {
      ok: true,
      parser: "pdf-parse-script",
      pages: Number(infoResult?.total || textResult?.total || 0),
      text: String(textResult?.text || "").trim(),
      details: {
        pages: Number(infoResult?.total || textResult?.total || 0),
        info: infoResult?.info || null,
      },
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Missing input/output path arguments.");
    process.exit(1);
  }

  const buffer = await fs.readFile(inputPath);

  const attempts = [];

  try {
    const result = await parseWithPdfJs(buffer);
    await fs.writeFile(outputPath, JSON.stringify(result));
    return;
  } catch (error) {
    attempts.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const result = await parseWithPdfParse(buffer);
    await fs.writeFile(outputPath, JSON.stringify(result));
    return;
  } catch (error) {
    attempts.push(error instanceof Error ? error.message : String(error));
  }

  await fs.writeFile(
    outputPath,
    JSON.stringify({
      ok: false,
      parser: "pdf-script",
      text: "",
      pages: 0,
      error: attempts.join(" | "),
      details: { attempts },
    })
  );
  return;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
