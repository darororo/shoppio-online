import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FacebookLoginDto } from 'src/users/dto/facebook-login.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { facebookId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createOrUpdateUser(facebookData: FacebookLoginDto): Promise<User> {
    let user = await this.findByFacebookId(facebookData.userID);
    
    if (user) {
      // Update existing user
      user.name = facebookData.name;
      user.email = facebookData.email || null;
      user.profilePicture = facebookData.profilePicture || null;
      user.accessToken = facebookData.accessToken;
      user.lastLoginAt = new Date();
      
      return this.usersRepository.save(user);
    } else {
      // Create new user
      user = this.usersRepository.create({
        facebookId: facebookData.userID,
        name: facebookData.name,
        email: facebookData.email || null,
        profilePicture: facebookData.profilePicture || null,
        accessToken: facebookData.accessToken,
        lastLoginAt: new Date(),
      });
      
      return this.usersRepository.save(user);
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  async deactivateUser(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { isActive: false });
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
  }
}
