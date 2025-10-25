import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { GeminiService } from './gemini.service';

@Controller('analyzer')
export class AnalyzerController {
  constructor(
    private readonly analyzerService: AnalyzerService,
    private readonly geminiService: GeminiService,
  ) {}

  @Post('process')
  async processUnanalyzedData() {
    return await this.analyzerService.processUnanalyzedData();
  }

  @Post('process/chats')
  async processUnanalyzedChat() {
    return await this.analyzerService.processUnanalyzedChat();
  }

  @Post('test')
  async testAnalysis(@Body() body: { message: string }) {
    if (!body.message) {
      return { error: 'Message is required' };
    }

    try {
      // const result = await this.openAIService.analyzeMessage(body.message);
      const result = await this.geminiService.analyzeMessage(body.message);
      return {
        message: body.message,
        analysis: result,
      };
    } catch (error) {
      return {
        error: 'Analysis failed',
        details: error.message,
      };
    }
  }
}
