// User repository for managing user accounts
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { User, UserRole } from '../../types';

export class UserRepository extends BaseRepository<User> {
  protected collectionName = 'users';
  
  /**
   * Create a new user
   */
  async createUser(
    email: string,
    passwordHash: string,
    name: string,
    role: UserRole
  ): Promise<User> {
    return this.create({
      email,
      passwordHash,
      name,
      role,
      createdAt: new Date(),
    } as User);
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email } as Filter<User>);
  }
  
  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.find({ role } as Filter<User>);
  }
  
  /**
   * Update user password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<User | null> {
    return this.updateById(userId, { passwordHash });
  }
  
  /**
   * Update user role
   */
  async updateRole(userId: string, role: UserRole): Promise<User | null> {
    return this.updateById(userId, { role });
  }
  
  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email } as Filter<User>);
  }
}
