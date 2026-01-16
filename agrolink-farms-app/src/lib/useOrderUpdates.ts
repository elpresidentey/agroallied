import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface OrderUpdate {
  id: string;
  status: string;
  updated_at: string;
  buyer_id?: string;
  animal_id?: string;
}

export function useOrderUpdates(userId: string, userRole: 'buyer' | 'seller') {
  const [orders, setOrders] = useState<OrderUpdate[]>([]);
  const [notification, setNotification] = useState<string>('');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to order changes
    const orderChannel = supabase
      .channel(`orders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: userRole === 'buyer' 
            ? `buyer_id=eq.${userId}`
            : `farm_id=eq.${userId}`,
        },
        (payload) => {
          const { eventType, new: newData, old: oldData } = payload;

          if (eventType === 'INSERT') {
            setOrders((prev) => [...prev, newData as OrderUpdate]);
            setNotification(`New ${userRole === 'seller' ? 'inquiry' : 'order'} received!`);
            
            // Clear notification after 5 seconds
            setTimeout(() => setNotification(''), 5000);
          } else if (eventType === 'UPDATE') {
            const oldStatus = oldData?.status;
            const newStatus = newData?.status;
            
            if (oldStatus !== newStatus) {
              setOrders((prev) =>
                prev.map((o) => (o.id === newData.id ? (newData as OrderUpdate) : o))
              );
              
              const statusMessages = {
                pending: 'Your order has been accepted!',
                confirmed: 'Payment confirmed! Order is being prepared.',
                completed: 'Order completed! 🎉',
                cancelled: 'Order has been cancelled.',
              };
              
              setNotification(statusMessages[newStatus as keyof typeof statusMessages] || `Order updated to ${newStatus}`);
              setTimeout(() => setNotification(''), 5000);
            }
          }
        }
      )
      .subscribe();

    setChannel(orderChannel);

    return () => {
      orderChannel?.unsubscribe();
    };
  }, [userId, userRole]);

  return { orders, notification, channel };
}

export function useRealtimeNotifications() {
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return { toastMessage, toastType, showNotification };
}
