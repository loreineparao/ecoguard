"use server";

import { GoogleGenAI } from "@google/genai";
import {
  cleanJsonOutput,
  getFallbackGuidance,
  validateGeminiResult,
  type GeminiClassification,
  type GeminiModule,
  type GeminiResult,
} from "@/lib/gemini-utils";

export type { GeminiClassification, GeminiModule, GeminiResult };

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Calls Gemini models with strict per-model timeouts and multi-model fallback.
 * Prioritizes fast models (gemini-3.5-flash-lite, gemini-flash-lite-latest) to eliminate latency hangs.
 */
async function callGeminiWithFallback(prompt: string, timeoutMs = 7000): Promise<string | null> {
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
  ];

  for (const model of modelsToTry) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt,
      });

      const response = await Promise.race([
        generatePromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
        ),
      ]);

      if (response && response.text) {
        const text = response.text.trim();
        if (text.length > 0) {
          return text;
        }
      }
    } catch {
      // Model call timed out or was temporarily unavailable (e.g. 503); continue to next model
      continue;
    }
  }

  return null;
}

/**
 * Classifies a resident's environmental concern and produces tailored guidance.
 * Supports Filipino, Taglish, and English with strict alignment to EcoGuard's municipal scope.
 */
export async function classifyEnvironmentalConcern(concern: string): Promise<{
  success: boolean;
  result?: GeminiResult;
  error?: string;
}> {
  if (!concern || concern.trim().length === 0) {
    return {
      success: false,
      error: "Please describe your environmental concern.",
    };
  }

  const trimmedConcern = concern.trim();

  // If Gemini API key is not configured, seamlessly return deterministic municipal guidance
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: true,
      result: getFallbackGuidance(trimmedConcern),
    };
  }

  const prompt = `
You are the EcoGuard resident guidance assistant for the Municipality of Mabini, Batangas (MENR Office).

Your role is to understand a resident's environmental inquiry and provide clear, polite, and actionable guidance, while classifying which EcoGuard service module is appropriate.

MUNICIPAL SCOPE (Mabini, Batangas):
1. Illegal Dumping Complaints: Reporting dumped garbage, trash in streets, waterways, or public spaces in Mabini.
   - Module: "complaint", Classification: "illegal_dumping"
   - When asked how to submit a complaint ("pano mag submit ng complaint?", "paano mag-report", etc.):
     Provide the 3 clear steps in their language:
     1. Ilarawan ang insidente ng illegal dumping (uri ng basura).
     2. I-tag ang GPS location o tukuyin ang barangay sa Mabini.
     3. Mag-attach ng picture/photo evidence (opsyonal pero makakatulong).
     Sabihin na buksan ang "Submit Complaint" form (/complaints/new) para opisyal na maipadala sa MENR. HUWAG sabihing nai-submit na ito.
2. Tree Cutting Permit: Inquiries about permits to cut or trim trees.
   - Module: "permit", Classification: "tree_cutting"
   - Explain requirements: Barangay clearance, Proof of land ownership/consent, photos of trees, valid reason. Direct to "Tree Cutting Permit" form (/permits/new).
3. Complaint Status: Asking where or how to check the status of a filed complaint ("saan makikita ang status ng complaint ko?").
   - Module: "complaint_status", Classification: "complaint_status"
   - Direct resident to the "My Complaints" page (/complaints) to see inspector updates (Pending, Under Review, Dispatched, Resolved).
4. Garbage Collection Schedule: Inquiries about collection days, truck schedules, or collection routes.
   - Module: "collection_schedule", Classification: "collection_schedule"
   - Direct resident to the "Collection Schedules" section of the portal where barangay schedules are posted.
5. General MENR Guidance: General environmental queries or greetings.
   - Module: "general_inquiry", Classification: "general_inquiry"

LANGUAGE AND TONE:
- Understand Filipino (Tagalog), English, and Taglish.
- ALWAYS respond in the same language the resident used (reply in Tagalog/Taglish if asked in Tagalog/Taglish; English if asked in English).
- Be polite, courteous (use "po/opo" in Filipino where appropriate), and encouraging.

IMPORTANT PRIVACY & SECURITY:
- Do NOT ask for passwords, bank details, or private sensitive numbers.
- Do NOT claim a report or permit has been submitted; always guide them to use the official forms in the portal.

Return ONLY a valid JSON object matching this structure:
{
  "module": "complaint" | "permit" | "complaint_status" | "collection_schedule" | "general_inquiry" | "unknown",
  "classification": "illegal_dumping" | "tree_cutting" | "complaint_status" | "collection_schedule" | "general_inquiry" | "unknown",
  "message": "Your helpful response here in the resident's language"
}

Resident's message:
${trimmedConcern}
`;

  try {
    const rawText = await callGeminiWithFallback(prompt);

    if (rawText) {
      const cleaned = cleanJsonOutput(rawText);
      try {
        const parsed = JSON.parse(cleaned);
        if (validateGeminiResult(parsed)) {
          return {
            success: true,
            result: parsed,
          };
        }
      } catch {
        // Fall through to deterministic municipal guidance
      }
    }

    // Graceful fallback: return high quality deterministic municipal guidance
    return {
      success: true,
      result: getFallbackGuidance(trimmedConcern),
    };
  } catch {
    // Under all error conditions, ensure the resident receives helpful, immediate guidance
    return {
      success: true,
      result: getFallbackGuidance(trimmedConcern),
    };
  }
}
