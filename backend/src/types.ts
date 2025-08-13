export enum CustomizationType {
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
}

export interface CustomizationOptionChoice {
  name: string;
  priceModifier: number;
}

export interface CustomizationOption {
  title: string;
  type: CustomizationType;
  options: CustomizationOptionChoice[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  customizableOptions?: CustomizationOption[];
}

export interface CartItem {
  id: string; // Unique ID for each cart entry
  menuItem: MenuItem;
  quantity: number;
  totalPrice: number;
  customizations: Record<string, CustomizationOptionChoice>;
}

// Admin Panel Types
export type OrderStatus = 'Preparando' | 'En Camino' | 'Entregado' | 'Cancelado';

export interface AdminOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: CartItem[];
}

export interface AdminStats {
  revenueToday: number;
  ordersToday: number;
  newCustomers: number;
  averageRating: number;
}
