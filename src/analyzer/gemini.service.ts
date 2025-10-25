import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntentionEnum } from 'src/analyzed_messages/enum/intention_enum';
import { GoogleGenAI } from '@google/genai';

export interface AnalysisResult {
  intent: IntentionEnum;
  confidence_score: number;
  analysis_notes: string;
  product?: string;
  quantity?: number;
  location?: string;
  phone_number?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenAI({ apiKey: apiKey });
  }

  async analyzeMessage(message: string): Promise<AnalysisResult> {
    try {
      const prompt = this.createAnalysisPrompt(message);

      // const model = this.genAI.models.generateContent({
      //   model:
      //     this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash',
      //     contents: ""
      // });

      const result = await this.genAI.models.generateContent({
        model:
          this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash',
        contents: prompt,
      });
      const text = result.text;

      if (!text) {
        throw new Error('No response from Gemini');
      }

      return this.parseAnalysisResult(text, message);
    } catch (error) {
      this.logger.error(`Error analyzing message: ${error.message}`, error);
      return this.fallbackAnalysis(message);
    }
  }

  private createAnalysisPrompt(message: string): string {
    return `
Analyze the following customer message and provide a structured response.
- Always interpret Khmer words written in English characters and translate them to Khmer, if there is any.
- For "product" and "location": 
  - Keep the original text exactly as it appears in the message.
  - Always also provide the translation in parentheses:
    + If the original is in Khmer, add the English translation in parentheses.  
    + If the original is in English, add the Khmer translation in parentheses. 
  - If no product/location/phone_number is mentioned, return with "Not mentioned".
  - If the product/location cannot be analyzed, return with "Unknown".
  - The location must always include the full phrase exactly as in the message, including prepositions or descriptive parts (e.g., "នៅជិតផ្សារដើមថ្កូវ" stays exactly as is, not shortened).
    However, ignore meta-labels like "location", "address", "place", etc. Keep only the actual place name and its prepositional phrase.
- For "quantity":
  - If there is any quantity mentioned, include it.
- For "analysis_note":
  - The analysis_notes must explain step by step how the interpretation was made.  
  - **Do not include any translations here**; use only the original message text.
- Do **not** treat quantity units (like "ដប"/"bottle", "កំប៉ុង"/"can", "kg", "pack") as products.
- Do **not** include grammatical particles (e.g., "នេះ", "នោះ", "នឹង") as part of product names.
- If only a unit and number are given without a product name, set product = "Not mentioned".
- If the message mentions or requests money, payment, or a cash amount (e.g., “som 1000”, “please send 5000”, “ខ្ញុំចង់បាន 2000រៀល”), this is not a buying intent.
- "confidence_score" is based on how accurate the analysis you provided is.

Message: "${message}"

Respond ONLY in this strict JSON format:
{
  "intent": buy|info|others (info = asking for information),
  "product": What the customer wants to buy (with translation in parentheses if applicable),
  "quantity": Amount of product requested, must be a number,
  "location": Customer's location (with translation in parentheses if applicable),
  "phone_number": Customer's phone number,
  "analysis_notes": Brief explanation of your analysis,
  "confidence_score": Between 1 and 5
}
`;
  }

  private parseAnalysisResult(
    response: string,
    originalMessage: string,
  ): AnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // const intent = this.normalizeIntent(parsed.intent);
      const intent = parsed.intent;
      const confidence_score = this.normalizeConfidence(
        parsed.confidence_score,
      );
      const analysis_notes =
        parsed.analysis_notes || 'Gemini analysis completed';
      const product = parsed.product;
      const location = parsed.location;
      const quantity = parsed.quantity;
      const phone_number = this.normalizePhoneNumber(parsed.phone_number);

      return {
        intent,
        confidence_score,
        analysis_notes,
        product,
        quantity,
        location,
        phone_number,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse Gemini response: ${error.message}`);
      return this.fallbackAnalysis(originalMessage);
    }
  }

  private normalizeIntent(intent: string): IntentionEnum {
    const upperIntent = intent?.toUpperCase();
    if (Object.values(IntentionEnum).includes(upperIntent as IntentionEnum)) {
      return upperIntent as IntentionEnum;
    }
    return IntentionEnum.OTHERS;
  }

  private normalizeConfidence(confidence: any): number {
    const score = parseFloat(confidence);
    if (isNaN(score)) return 0.7;
    return Math.max(1, Math.min(5, score));
  }

  private normalizePhoneNumber(phone: any): string {
    // if (!phone) return 'undetected';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('885')) {
      digits = '0' + digits.slice(3);
    }
    if (digits.length === 9) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    if (digits.length === 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }

    return 'Not mentioned';
  }

  private fallbackAnalysis(message: string): AnalysisResult {
    const lowerMessage = message.toLowerCase();

    let intent: IntentionEnum = IntentionEnum.OTHERS;

    const buyingKeywords = [
      'buy',
      'purchase',
      'order',
      'price',
      'cost',
      'available',
    ];
    const infoKeywords = [
      'how',
      'what',
      'when',
      'where',
      'delivery',
      'shipping',
    ];

    if (buyingKeywords.some((k) => lowerMessage.includes(k))) {
      intent = IntentionEnum.BUY;
    } else if (infoKeywords.some((k) => lowerMessage.includes(k))) {
      intent = IntentionEnum.INFO;
    }

    return {
      intent,
      confidence_score: 1,
      analysis_notes: 'Fallback analysis - Gemini unavailable',
    };
  }
}
