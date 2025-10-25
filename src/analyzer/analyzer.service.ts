import { Injectable, Logger } from '@nestjs/common';
import { FacebookService } from 'src/facebook/facebook.service';
import { AnalyzedMessagesService } from 'src/analyzed_messages/analyzed_messages.service';
import { IntentionEnum } from 'src/analyzed_messages/enum/intention_enum';
import { CreateAnalyzedMessageDto } from 'src/analyzed_messages/dto/create-analyzed_message.dto';
import { GeminiService } from './gemini.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { OrdersService } from 'src/orders/orders.service';
import { FbMessage } from 'src/facebook_message/entities/facebook_message.entity';

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(
    private readonly facebookService: FacebookService,
    private readonly analyzedDataService: AnalyzedMessagesService,
    private readonly orderService: OrdersService,
    private readonly geminiService: GeminiService,
  ) {}

  async processUnanalyzedData(): Promise<{
    processed: number;
    errors: number;
  }> {
    this.logger.log('Starting analysis of unprocessed raw data...');

    const comments = await this.facebookService.findUnprocessedComment();

    let processed = 0;
    let errors = 0;

    for (const msg of comments) {
      try {
        this.logger.log(
          `Analyzing message ${msg.id} from buyer ${msg.buyer} (${msg.sender_id})...`,
        );

        const analysis = await this.geminiService.analyzeMessage(
          msg.message_text,
        );

        const createAnalyzedDataDto: CreateAnalyzedMessageDto = {
          buyerId: msg.sender_id,
          buyerName: msg.sender_name,
          intention: analysis.intent,
          confidence_score: analysis.confidence_score,
          analysisNote: analysis.analysis_notes,
          location: analysis.location,
          phoneNumber: analysis.phone_number,
        };

        const createOrderDto: CreateOrderDto = {
          buyerId: msg.sender_id,
          buyerName: msg.sender_name,
          product_name: analysis.product,
          quantity: analysis.quantity,
        };

        await this.analyzedDataService.create(createAnalyzedDataDto);
        await this.orderService.create(createOrderDto);

        // Mark this single message as processed
        await this.facebookService.markAsProcessed(msg.id);
        processed++;
      } catch (error) {
        this.logger.error(
          `Error processing message ${msg.id} from buyer ${msg.buyer}: ${error.message}`,
          error.stack,
        );
        errors++;
      }

      this.logger.log(
        `Analysis complete. Processed: ${processed}, Errors: ${errors}`,
      );
    }
    return { processed, errors };
  }

  async processUnanalyzedChat(): Promise<{
    processed: number;
    errors: number;
  }> {
    this.logger.log('Starting analysis of unprocessed raw data...');

    const chats = await this.facebookService.findUnprocessedChat();

    console.log(chats);

    const grouped = chats.reduce(
      (acc, chat) => {
        if (!acc[chat.conversationId]) acc[chat.conversationId] = [];
        acc[chat.conversationId].push(chat);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // const grouped = chats.reduce(
    //   (acc, chat) => {
    //     if (!acc[chat.conversationId]) acc[chat.conversationId] = [];
    //     acc[chat.conversationId].push({ message: chat.message });
    //     return acc;
    //   },
    //   {} as Record<string, any[]>,
    // );
    // const grouped = {
    //   conversationId: chats[0].conversationId,
    //   buyerId: chats[0].from.id,
    //   buyer: chats[0].from.name,
    //   messages: <any>[],
    // };

    let processed = 0;
    let errors = 0;

    for (const [conversationId, messages] of Object.entries(grouped)) {
      try {
        this.logger.log(
          `Analyzing conversation: ${conversationId} (${messages.length} messages)`,
        );

        const conversationText = messages.map((m) => m.message);

        console.log(conversationText);

        const analysis = await this.geminiService.analyzeMessage(
          JSON.stringify(conversationText),
        );

        const createAnalyzedDataDto: CreateAnalyzedMessageDto = {
          buyerId: messages[0].from.id,
          buyerName: messages[0].from.name,
          intention: analysis.intent,
          confidence_score: analysis.confidence_score,
          analysisNote: analysis.analysis_notes,
          location: analysis.location,
          phoneNumber: analysis.phone_number,
        };

        const createOrderDto: CreateOrderDto = {
          buyerId: messages[0].from.id,
          buyerName: messages[0].from.name,
          product_name: analysis.product,
          quantity: analysis.quantity,
        };

        await this.analyzedDataService.create(createAnalyzedDataDto);
        await this.orderService.create(createOrderDto);

        await Promise.all(
          messages.map((msg) =>
            this.facebookService.markFbMessageAsProcessed(msg.id),
          ),
        );

        processed++;
      } catch (error) {
        this.logger.log(
          `Error processing conversation ${conversationId}: ${error.message}`,
          error.stack,
        );
        errors++;
      }
      this.logger.log(
        `Analysis complete. Processed: ${processed}, Errors: ${errors}`,
      );
    }
    return { processed, errors };
  }
}
