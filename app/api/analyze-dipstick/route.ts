import { generateText, Output } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const { beforeImage, afterImage } = await req.json()

    if (!afterImage) {
      return Response.json(
        { error: "After-dip image is required" },
        { status: 400 }
      )
    }

    // Build multimodal content with the strip images
    const messages: Array<{
      role: "system" | "user"
      content: string | Array<{ type: string; text?: string; image?: string; mimeType?: string }>
    }> = [
      {
        role: "system",
        content: `You are a medical AI assistant specialized in analyzing urine dipstick test strips for protein levels. 
You are analyzing images of urine dipstick strips to determine the protein (albumin) level.

The protein pad on a urine dipstick changes color based on protein concentration:
- NEGATIVE (yellow/pale yellow): No protein detected (< 10 mg/dL)
- TRACE (yellow-green): Small amount of protein (15-30 mg/dL)  
- 1+ (light green): Mild protein (30-100 mg/dL)
- 2+ (green): Moderate protein (100-300 mg/dL)
- 3+ (blue-green): High protein (300-2000 mg/dL)
- 4+ (dark green/blue): Very high protein (> 2000 mg/dL)

The color progresses from yellow (negative) through green shades to blue-green/dark green (4+).

Analyze the protein pad color carefully and provide your reading. If the image quality is poor or the strip is not visible, indicate low confidence.
Be conservative in your assessment - when in doubt, choose the lower reading.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this urine dipstick test strip image and determine the protein level. The image shows the strip AFTER it was dipped in urine and the 60 second wait period has elapsed. Focus on the protein/albumin pad.",
          },
          ...(beforeImage
            ? [
                {
                  type: "text" as const,
                  text: "Reference image (BEFORE dipping):",
                },
                {
                  type: "image" as const,
                  image: beforeImage.replace(
                    /^data:image\/\w+;base64,/,
                    ""
                  ),
                  mimeType: "image/jpeg",
                },
              ]
            : []),
          {
            type: "text",
            text: "Test strip image (AFTER dipping - analyze this):",
          },
          {
            type: "image",
            image: afterImage.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: "image/jpeg",
          },
        ],
      },
    ]

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      // @ts-expect-error - multimodal message format
      messages,
      output: Output.object({
        schema: z.object({
          result: z.enum(["negative", "trace", "1+", "2+", "3+", "4+"]),
          confidence: z.enum(["high", "medium", "low"]),
          reasoning: z.string(),
          proteinPadColor: z.string(),
          recommendation: z.string(),
        }),
      }),
    })

    return Response.json({
      success: true,
      analysis: result.output,
    })
  } catch (error) {
    console.error("[AI Dipstick Analysis Error]", error)

    // Fallback: return a simulated result so the app still works
    return Response.json({
      success: false,
      error: "AI analysis unavailable. Please use manual reading.",
      fallback: true,
    })
  }
}
