import { generateText, Output } from "ai"
import { z } from "zod"

const DIPSTICK_SYSTEM_PROMPT = `You are a medical image analysis assistant specialising in urinary dipstick interpretation for paediatric Nephrotic Syndrome monitoring.

You will receive TWO images:
- Image 1: The unused dipstick strip (reference colours, before dipping)
- Image 2: The strip after being dipped in urine for exactly 60 seconds

YOUR TASK:
Focus exclusively on the PROTEIN pad — this is the THIRD coloured square from the patient's end of the strip (counting from the handle end, it is the 3rd pad). Compare the colour of the protein pad in Image 2 to the reference colours in Image 1.

RESULT OPTIONS (choose exactly one):
- "negative" — pad colour matches negative reference (yellow/pale yellow, <10 mg/dL)
- "trace" — pad colour is slightly yellow-green (15–30 mg/dL)
- "1+" — pad colour is light green (30–100 mg/dL)
- "2+" — pad colour is medium green (100–300 mg/dL)
- "3+" — pad colour is dark green or blue-green (300–2000 mg/dL)
- "4+" — pad colour is very dark green or blue (>2000 mg/dL)

CONFIDENCE (0.0 to 1.0):
- 0.9–1.0: colour is unambiguous, well-lit, strip clearly visible
- 0.7–0.9: minor lighting variation but readable
- 0.5–0.7: uncertain — state both candidate results in reasoning
- <0.5: cannot reliably read — state reason (too dark, blurry, strip not visible, wrong pad)

CRITICAL RULES:
- Do NOT read any other pad (glucose, blood, leukocytes, specific gravity, etc.)
- Do NOT guess if the strip is not clearly visible — set confidence below 0.5
- The recommendation must be in simple language a rural Indian caregiver can understand (no medical jargon)
- Recommendation guidance by result:
  - negative/trace: "Good news — protein is low. Continue daily testing."
  - 1+/2+: "Protein is a little high. Test again tomorrow morning."
  - 3+/4+: "Protein is very high. Test again tomorrow and contact your doctor if this reading continues."`

export async function POST(req: Request) {
  try {
    const { beforeImage, afterImage } = await req.json()

    if (!afterImage) {
      return Response.json(
        { error: "After-dip image is required" },
        { status: 400 }
      )
    }

    const messages: Array<{
      role: "system" | "user"
      content: string | Array<{ type: string; text?: string; image?: string; mimeType?: string }>
    }> = [
      {
        role: "system",
        content: DIPSTICK_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          ...(beforeImage
            ? [
                {
                  type: "text" as const,
                  text: "Image 1 — BEFORE dipping (reference colours):",
                },
                {
                  type: "image" as const,
                  image: beforeImage.replace(/^data:image\/\w+;base64,/, ""),
                  mimeType: "image/jpeg",
                },
              ]
            : []),
          {
            type: "text",
            text: "Image 2 — AFTER dipping (analyse the protein pad — 3rd pad from end):",
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
          confidence: z.number().min(0).max(1),
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

    // Return structured failure — the client MUST prompt manual entry, never assign a random result
    return Response.json({
      success: false,
      error: "AI analysis unavailable. Please enter the result manually.",
      fallback: true,
    })
  }
}
