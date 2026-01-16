import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Email templates
const orderConfirmationTemplate = (buyerName: string, animalBreed: string, quantity: number, totalPrice: number, orderId: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2D5016 0%, #6B8E23 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f7f4; padding: 20px; border-radius: 0 0 8px 8px; }
    .order-details { background: white; padding: 15px; border-left: 4px solid #2D5016; margin: 15px 0; }
    .button { display: inline-block; background: #2D5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation 🎉</h1>
    </div>
    <div class="content">
      <p>Hi ${buyerName},</p>
      
      <p>Thank you for placing your order on AgroLink Farms! We're excited to help you connect with quality livestock.</p>
      
      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Animal:</strong> ${animalBreed}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> ₹${totalPrice.toLocaleString()}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Wait for the seller to review your inquiry</li>
        <li>Once accepted, proceed to payment</li>
        <li>Arrange delivery details with the seller</li>
        <li>Complete the transaction</li>
      </ol>

      <p>You can track your order status in your AgroLink dashboard.</p>

      <a href="https://agrolink-farms.vercel.app/orders" class="button">View Your Orders</a>

      <div class="footer">
        <p>AgroLink Farms • Connecting Farms with Buyers</p>
        <p>© 2024 All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const sellerNotificationTemplate = (sellerName: string, buyerName: string, animalBreed: string, quantity: number, orderId: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2D5016 0%, #6B8E23 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f7f4; padding: 20px; border-radius: 0 0 8px 8px; }
    .order-details { background: white; padding: 15px; border-left: 4px solid #2D5016; margin: 15px 0; }
    .button { display: inline-block; background: #2D5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Inquiry Received 📬</h1>
    </div>
    <div class="content">
      <p>Hi ${sellerName},</p>
      
      <p>You've received a new inquiry from a buyer on AgroLink Farms!</p>
      
      <div class="order-details">
        <h3>Buyer Inquiry Details</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Buyer:</strong> ${buyerName}</p>
        <p><strong>Animal Requested:</strong> ${animalBreed}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
      </div>

      <p><strong>What to do next:</strong></p>
      <ol>
        <li>Review the buyer's inquiry details</li>
        <li>Accept or reject the inquiry</li>
        <li>If accepted, the buyer will proceed with payment</li>
        <li>Arrange delivery logistics</li>
      </ol>

      <a href="https://agrolink-farms.vercel.app/orders" class="button">Manage This Inquiry</a>

      <div class="footer">
        <p>AgroLink Farms • Connecting Farms with Buyers</p>
        <p>© 2024 All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  try {
    const { orderId, type } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, animals(breed), users(email, full_name), farms(user_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch buyer details
    const { data: buyer } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', order.buyer_id)
      .single();

    // Fetch seller details
    const { data: seller } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', order.farms?.user_id)
      .single();

    const emailData = {
      to: type === 'buyer' ? buyer?.email : seller?.email,
      subject: type === 'buyer' 
        ? 'Order Confirmation - AgroLink Farms'
        : 'New Buyer Inquiry - AgroLink Farms',
      html: type === 'buyer'
        ? orderConfirmationTemplate(
            buyer?.full_name || 'Buyer',
            order.animals?.breed || 'Animal',
            order.quantity,
            order.total_price,
            orderId
          )
        : sellerNotificationTemplate(
            seller?.full_name || 'Seller',
            buyer?.full_name || 'Buyer',
            order.animals?.breed || 'Animal',
            order.quantity,
            orderId
          ),
    };

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, log the email that would be sent
    console.log('Email to send:', emailData);

    // In production, send via your email service:
    // await sendEmail(emailData);

    // For demo purposes, store in emails_sent table
    const { error: insertError } = await supabase
      .from('emails_sent')
      .insert({
        order_id: orderId,
        recipient: emailData.to,
        subject: emailData.subject,
        type: type,
        status: 'sent',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.warn('Could not log email:', insertError);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Email sent to ${emailData.to}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
