// import {
//   Column,
//   CreateDateColumn,
//   Entity,
//   ManyToOne,
//   OneToOne,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { SourceEnum } from '../enum/source_enum';
// import { Buyer } from 'src/buyers/entities/buyer.entity';
// import { AnalyzedMessage } from 'src/analyzed_messages/entities/analyzed_message.entity';
// import { SocialAccount } from 'src/social_account/entities/social_account.entity';

// @Entity()
// export class Message {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true })
//   facebook_message_id: string;

//   @Column({ type: 'enum', enum: SourceEnum })
//   source: SourceEnum;

//   @Column("text", { array: true })
//   content: string[];

//   @CreateDateColumn()
//   create_at: Date;

//   @UpdateDateColumn()
//   update_at: Date;

//   @ManyToOne(() => Buyer, (buyer) => buyer.id)
//   buyer: Buyer;

//   @ManyToOne(() => SocialAccount, (page) => page.id)
//   page: SocialAccount;

//   @OneToOne(() => AnalyzedMessage, (analyzed_message) => analyzed_message.id)
//   analyzed_message = AnalyzedMessage;
// }
