// import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
// import { SourceEmun } from '../enum/source_enum';

// export class CreateMessageDto {
//   @IsNotEmpty({ message: 'Must have facebook_message_id.' })
//   @IsString()
//   facebook_message_id: string;

//   @IsNotEmpty({ message: 'Each message must clearly indicate a source.' })
//   @IsEnum(SourceEmun)
//   source: SourceEmun;

//   @IsNotEmpty({ message: 'No message is found.' })
//   @IsString()
//   @IsArray()
//   content: string[];
// }
