import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment with Paystack');
    }

    const data = await response.json();

    // Check if payment was successful
    if (data.data.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment was not successful' },
        { status: 400 }
      );
    }

    // Payment verified successfully
    // TODO: Update order status in database to 'confirmed'

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        reference: data.data.reference,
        amount: data.data.amount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

