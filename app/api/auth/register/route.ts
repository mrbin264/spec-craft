// POST /api/auth/register - User registration endpoint
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { User, AuthResponse } from '@/types/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['PM', 'TA', 'Dev', 'QA', 'Stakeholder']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name, role } = validation.data;

    // Connect to database
    const db = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser: Omit<User, '_id'> = {
      email,
      passwordHash,
      name,
      role,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser as User);
    const userId = result.insertedId.toString();

    // Generate JWT token
    const token = generateToken({
      userId,
      email,
      role,
    });

    // Return response
    const response: AuthResponse = {
      user: {
        id: userId,
        email,
        name,
        role,
      },
      token,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration',
        },
      },
      { status: 500 }
    );
  }
}
