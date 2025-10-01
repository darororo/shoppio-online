import { Injectable, Logger } from '@nestjs/common';
import { SocialMessagesService } from 'src/social_messages/social_messages.service';
import { AnalyzedMessagesService } from 'src/analyzed_messages/analyzed_messages.service';
import { IntentionEnum } from 'src/analyzed_messages/enum/intention_enum';
import { CreateAnalyzedMessageDto } from 'src/analyzed_messages/dto/create-analyzed_message.dto';
import { GeminiService } from './gemini.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(
    private readonly socialMessageService: SocialMessagesService,
    private readonly analyzedDataService: AnalyzedMessagesService,
    private readonly geminiService: GeminiService,
  ) {}

  async processUnanalyzedData(): Promise<{
    processed: number;
    errors: number;
  }> {
    this.logger.log('Starting analysis of unprocessed raw data...');

    const unprocessedData = await this.socialMessageService.findUnprocessed();
    const unpresscessedMessages = unprocessedData.messages;
    const messageIds = unprocessedData.messageIds;

    let processed = 0;
    let errors = 0;

    for (const rawData of unpresscessedMessages) {
      try {
        // 🔹 Combine all buyer messages into one transcript
        const combinedMessages = rawData.messages.join('\n');

        this.logger.log(
          `Analyzing buyer ${rawData.buyer} (${rawData.buyer_id}) with ${rawData.messages.length} messages...`,
        );

        // 🔹 Call Gemini once with the full conversation
        const analysis =
          await this.geminiService.analyzeMessage(combinedMessages);

        // 🔹 Save only one analysis result per buyer
        const createAnalyzedDataDto: CreateAnalyzedMessageDto = {
          buyerId: rawData.buyer_id,
          buyerName: rawData.buyer,
          intention: analysis.intent,
          confidence_score: analysis.confidence_score,
          analysisNote: analysis.analysis_notes,
          location: analysis.location,
          phoneNumber: analysis.phone_number,
        };

        const createOrderDto: CreateOrderDto = {
          product_name: analysis.product,
          quantity: analysis.quantity,
        };

        await this.analyzedDataService.create(createAnalyzedDataDto);

        // // 🔹 Mark as processed

        for (const id in messageIds) {
          await this.socialMessageService.markAsProcessed(id);
          console.log('Here here');
          processed++;
        }

        this.logger.log(
          `Processed buyer ${rawData.buyer}: ${analysis.intent} (confidence: ${analysis.confidence_score})`,
        );
      } catch (error) {
        this.logger.error(
          `Error processing buyer ${rawData.buyer}: ${error.message}`,
          error.stack,
        );
        errors++;
      }
    }

    this.logger.log(
      `Analysis complete. Processed: ${processed}, Errors: ${errors}`,
    );
    return { processed, errors };
  }
}
