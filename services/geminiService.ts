
import { GoogleGenAI, Type } from "@google/genai";

// Use gemini-3-pro-preview for complex reasoning tasks like receipt analysis
export async function analyzeReceiptImage(base64Image: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze this receipt or payment confirmation image. 
  Extract the following details accurately:
  1. Total amount paid
  2. Currency (ISO code)
  3. Date of transaction (YYYY-MM-DD)
  4. Vendor or business name
  5. Category (one of: Food & Dining, Transport, Shopping, Utilities, Health, Entertainment, Business, Other)
  6. A brief 1-sentence description of the purchase.
  
  If details are missing, provide your best guess based on the context.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          date: { type: Type.STRING },
          vendor: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["amount", "currency", "date", "vendor", "category", "description"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not extract receipt data. Please try a clearer photo.");
  }
}

// Extract form field IDs from HTML using gemini-3-pro-preview
export async function extractFormFieldsFromHtml(html: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `I have the HTML source of a Google Form. Please identify the entry IDs (format: entry.12345678) that most likely correspond to these payment tracking fields:
  1. Amount (Total price)
  2. Date (Transaction date)
  3. Vendor (Merchant/Business name)
  4. Category (Type of expense)
  5. Description (Notes)

  HTML Snippet:
  ${html.substring(0, 15000)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.STRING },
          date: { type: Type.STRING },
          vendor: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["amount", "date", "vendor", "category", "description"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Failed to parse form fields:", error);
    throw new Error("Could not find field IDs in the HTML provided.");
  }
}
