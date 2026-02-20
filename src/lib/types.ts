export type ProductType = "metre" | "logo";

export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus = "received" | "producing" | "delivered";

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  active: boolean;
  tiers: PriceTierData[];
}

export interface PriceTierData {
  id: string;
  productId: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
  label: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerCompany: string;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
  stripeSessionId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  shippingAmount: number;
  vatAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeLabel: string;
  fileName: string;
  filePath: string;
}

/** Cart item used in the frontend configurator */
export interface CartItem {
  productId: string;
  productName: string;
  productType: ProductType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeLabel: string;
  file: File | null;
  fileName: string;
}
