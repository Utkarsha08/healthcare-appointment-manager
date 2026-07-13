import { GoogleGenAI } from "@google/genai";
import { AIProvider, PreVisitSummary } from "./types";
import { GEMINI_MODEL } from "./config";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      console.log(`✅ Gemini initialized with model: ${GEMINI_MODEL}`);
    } else {
      console.warn(
        "⚠️ GEMINI_API_KEY is not set. Gemini integration will be disabled."
      );
    }
  }

  async generatePreVisitSummary(
    symptoms: string
  ): Promise<PreVisitSummary | null> {
    if (!this.ai) return null;

    const prompt = `Analyse these symptoms and return ONLY valid JSON with keys:

"urgencyLevel" ("Low"|"Medium"|"High")
"chiefComplaint" (string)
"suggestedQuestions" (array of exactly 3 strings)

Symptoms:
${symptoms}

Rules:
- Return ONLY valid JSON.
- Do NOT wrap in markdown.
- Do NOT use backticks.
- Do NOT explain anything.
- suggestedQuestions MUST contain exactly 3 strings.
`;

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🤖 Gemini request (attempt ${attempt}/${MAX_RETRIES}) using model: ${GEMINI_MODEL}`
        );

        const response = await this.ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        const text = response.text;

        console.log("Gemini Raw Response:");
        console.log(text);

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        const cleanedText = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleanedText) as PreVisitSummary;

        if (
          !["Low", "Medium", "High"].includes(parsed.urgencyLevel) ||
          typeof parsed.chiefComplaint !== "string" ||
          !Array.isArray(parsed.suggestedQuestions) ||
          parsed.suggestedQuestions.length !== 3
        ) {
          throw new Error("Gemini returned invalid JSON structure.");
        }

        console.log("✅ Gemini summary generated successfully.");

        return parsed;
      } catch (error: unknown) {
        console.error(
          `❌ Gemini attempt ${attempt} failed:`,
          error
        );

        let shouldRetry = false;

        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error
        ) {
          const status = (error as { status?: number }).status;

          // Retry only on temporary failures
          if (status === 429 || status === 500 || status === 503) {
            shouldRetry = true;
          }
        }

        if (attempt < MAX_RETRIES && shouldRetry) {
          console.log("⏳ Retrying Gemini request in 2 seconds...");

          await new Promise((resolve) => setTimeout(resolve, 2000));

          continue;
        }

        console.warn(
          "⚠️ AI summary unavailable. Continuing booking without blocking."
        );

        return null;
      }
    }

    return null;
  }
}

export const aiProvider: AIProvider = new GeminiProvider();