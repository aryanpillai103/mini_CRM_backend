import { Order } from '../../orders/entities/order.entity';

export class Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: any;
  tags: string[];
  orders?: Order[];
}