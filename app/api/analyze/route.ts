import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    const body = await request.json();
    const { image } = body;

    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid product image." },
        { status: 400 }
      );
    }

    const commaIndex = image.indexOf(",");

    if (commaIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Invalid image format." },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(
      image.slice(commaIndex + 1),
      "base64"
    );

    if (imageBuffer.length === 0 || imageBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be smaller than 10 MB." },
        { status: 400 }
      );
    }

    worker = await createWorker("eng");

    const result = await worker.recognize(imageBuffer);
    const extractedText = result.data.text.trim();

    if (!extractedText) {
      return NextResponse.json({
        success: true,
        extractedText: "",
        productName: "Not detected",
        ingredients: "Not detected",
        expiryDate: "Not detected",
        complianceStatus: "WARNING",
        message: "No readable text found. Please upload a clearer product label."
      });
    }

    const lines = extractedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const expiryMatch = extractedText.match(
      /\b(?:EXP(?:IRY|IRATION)?|USE\s*BY|BEST\s*BEFORE)\s*[:.-]?\s*(\d{1,2}[/-]\d{2,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s+\d{4})/i
    );

    const ingredientsMatch = extractedText.match(
      /ingredients?\s*[:.-]?\s*([\s\S]*?)(?=\n\s*(?:nutrition|allergen|storage|manufactured|marketed|net\s*(?:weight|quantity)|expiry|best\s*before)\b|$)/i
    );

    const productName =
      lines.find(
        (line) =>
          !/^(ingredients?|nutrition|manufactured|marketed|expiry|best before|use by)\b/i.test(line) &&
          line.length >= 3
      ) ?? "Not detected";

    return NextResponse.json({
      success: true,
      extractedText,
      productName,
      ingredients: ingredientsMatch?.[1]?.trim() || "Not detected",
      expiryDate: expiryMatch?.[1] || "Not detected",
      complianceStatus: "REVIEW REQUIRED",
      message:
        "Text extraction completed. A full compliance decision requires verified product rules and label checks."
    });
  } catch (error) {
    console.error("Product analysis failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Product analysis failed. Please try another image."
      },
      { status: 500 }
    );
  } finally {
    if (worker) {
      await worker.terminate().catch(console.error);
    }
  }
}