"use server";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type GeminiClassification =
  | "illegal_dumping"
  | "tree_cutting"
  | "unknown";

type GeminiModule =
  | "complaint"
  | "permit"
  | "unknown";

type GeminiResult = {
  module: GeminiModule;
  classification: GeminiClassification;
  message: string;
};

function validateGeminiResult(
  result: unknown
): result is GeminiResult {
  if (!result || typeof result !== "object") {
    return false;
  }

  const data = result as Record<string, unknown>;

  if (
    data.module !== "complaint" &&
    data.module !== "permit" &&
    data.module !== "unknown"
  ) {
    return false;
  }

  if (
    data.classification !== "illegal_dumping" &&
    data.classification !== "tree_cutting" &&
    data.classification !== "unknown"
  ) {
    return false;
  }

  if (typeof data.message !== "string") {
    return false;
  }

  // Make sure the module and classification agree.

  if (
    data.module === "complaint" &&
    data.classification !== "illegal_dumping"
  ) {
    return false;
  }

  if (
    data.module === "permit" &&
    data.classification !== "tree_cutting"
  ) {
    return false;
  }

  if (
    data.module === "unknown" &&
    data.classification !== "unknown"
  ) {
    return false;
  }

  return true;
}

export async function classifyEnvironmentalConcern(
  concern: string
) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: "Gemini API key is not configured.",
    };
  }

  if (!concern || concern.trim().length === 0) {
    return {
      success: false,
      error: "Please describe your environmental concern.",
    };
  }

  const prompt = `
You are the EcoGuard resident guidance assistant.

Your role is to understand a resident's general environmental
concern and identify which EcoGuard module is appropriate.

EcoGuard currently has only these two AI classification targets:

1. Illegal Dumping Complaint
2. Tree Cutting Permit

IMPORTANT PRIVACY RULES:

Do NOT request, collect, process, or store:
- name
- email
- phone number
- home address
- exact location
- GPS coordinates
- photographs
- identification numbers
- user IDs
- other personal information

The resident's actual submission will happen separately
through the appropriate EcoGuard form.

Return ONLY valid JSON.

The JSON must use exactly this structure:

{
  "module": "complaint" | "permit" | "unknown",
  "classification": "illegal_dumping" | "tree_cutting" | "unknown",
  "message": "short guidance for the resident"
}

Classification rules:

Illegal dumping:
{
  "module": "complaint",
  "classification": "illegal_dumping"
}

Tree cutting:
{
  "module": "permit",
  "classification": "tree_cutting"
}

Anything outside these two supported areas:
{
  "module": "unknown",
  "classification": "unknown"
}

The module and classification MUST always agree.

Never include personal information in your response.

Resident's general concern:

${concern.trim()}
`;

  try {
    const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return {
        success: false,
        error: "Gemini returned an empty response.",
      };
    }

    // Remove Markdown code fences if Gemini adds them.
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedResult: unknown;

    try {
      parsedResult = JSON.parse(cleanedText);
    } catch {
      return {
        success: false,
        error: "Gemini returned an invalid JSON response.",
      };
    }

    if (!validateGeminiResult(parsedResult)) {
      return {
        success: false,
        error: "Gemini returned an invalid classification.",
      };
    }

    return {
      success: true,
      result: parsedResult,
    };
 } catch (error) {
  console.error("Gemini API error:", error);

  const errorMessage =
    error instanceof Error ? error.message : String(error);

  if (
    /503|UNAVAILABLE|high demand|overloaded/i.test(errorMessage)
  ) {
    return {
      success: false,
      error:
        "EcoGuard AI is temporarily busy. Please wait a moment and try again.",
    };
  }

  return {
    success: false,
    error:
      "EcoGuard AI could not process your request. Please try again later.",
  };
}
}