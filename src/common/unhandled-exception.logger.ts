import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UnhandledExceptionLogger {
    private readonly logger: Logger = new Logger(UnhandledExceptionLogger.name);
    constructor() {
        process.on('unhandledRejection', (reason) => {
            this.logger.error(reason);
            // here you can do anything else
        });
    }
}