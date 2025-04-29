/**
 * A simple user service example to be tested by the AI Testing Agent
 */

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
}

export interface UserDatabase {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UserService {
  private db: UserDatabase;
  
  constructor(db: UserDatabase) {
    this.db = db;
  }
  
  async getUserById(id: string): Promise<User | null> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid user ID');
    }
    
    return this.db.findById(id);
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    
    return this.db.findByEmail(email);
  }
  
  async createUser(userData: { username: string; email: string; isActive?: boolean }): Promise<User> {
    // Validate input
    if (!userData.username || userData.username.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }
    
    if (!this.isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }
    
    // Check if user with this email already exists
    const existingUser = await this.db.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }
    
    // Create new user
    return this.db.create({
      username: userData.username,
      email: userData.email,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    });
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    // Validate ID
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid user ID');
    }
    
    // Check if user exists
    const existingUser = await this.db.findById(id);
    if (!existingUser) {
      return null;
    }
    
    // Validate email if provided
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }
    
    // Validate username if provided
    if (userData.username && userData.username.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }
    
    // Update user
    return this.db.update(id, userData);
  }
  
  async deleteUser(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid user ID');
    }
    
    return this.db.delete(id);
  }
  
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}