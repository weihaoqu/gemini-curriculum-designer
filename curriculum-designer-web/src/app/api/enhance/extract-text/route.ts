import { NextResponse } from "next/server";

/** Supported binary formats that require server-side extraction. */
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".xlsx", ".rtf"];

function getExtension(name: string): string {
  return name.substring(name.lastIndexOf(".")).toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = getExtension(file.name);

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let text = "";

    if (ext === ".pdf") {
      // pdf-parse v2: class-based API
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
      const result = await parser.getText();
      text = result.text;
    } else if (ext === ".docx") {
      // mammoth: best for DOCX — preserves structure better than officeparser
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(arrayBuffer),
      });
      text = result.value;
    } else if (ext === ".pptx" || ext === ".xlsx" || ext === ".rtf") {
      // officeparser: handles PPTX, XLSX, RTF
      const officeParser = await import("officeparser");
      const ast = await officeParser.parseOffice(Buffer.from(arrayBuffer));
      text = ast.toText();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from this file. It may be empty or contain only images." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Text extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to extract text: ${message}` },
      { status: 500 }
    );
  }
}
