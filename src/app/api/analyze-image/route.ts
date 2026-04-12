import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ZAI from "z-ai-web-dev-sdk";

export async function GET() {
  try {
    const imagePath = path.resolve(
      process.cwd(),
      "upload/pasted_image_1775829703100.png"
    );

    // Verify file exists
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: "Image file not found" }, { status: 404 });
    }

    // Read and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = "image/png";

    // Initialize SDK
    const zai = await ZAI.create();

    // Analyze with vision
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please describe this purchase order print template in full detail. Describe every text label, field, layout, table structure, positioning, fonts, borders, and formatting elements. Output the complete description of all visible content.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const analysis = response.choices[0]?.message?.content || "No analysis returned";

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Vision analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
