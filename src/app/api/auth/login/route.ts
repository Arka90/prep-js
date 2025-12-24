import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json();

    if (!accessKey) {
      return NextResponse.json(
        { error: 'Access key is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the user with the stored access key
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No user found. Please set up the database.' },
        { status: 404 }
      );
    }

    const user = users[0] as User;

    // Compare the provided access key with the stored hash
    const isValid = await bcrypt.compare(accessKey, user.access_key);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 401 }
      );
    }

    // Return user info (without the access key)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        current_streak: user.current_streak,
        total_points: user.total_points,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
