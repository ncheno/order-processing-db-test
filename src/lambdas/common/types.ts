export interface Order {
  orderId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  shippingStatus: 'PENDING' | 'SHIPPED' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  [key: string]: any;
}

export interface OrderMessage {
  orderId: string;
  eventType: string;
  timestamp: number;
}

export interface CreateOrderRequest {
  orderId?: string;
  [key: string]: any;
}
