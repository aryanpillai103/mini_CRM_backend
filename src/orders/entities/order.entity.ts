export class Order {
  id: string;
  customerId: string;
  amount: number;
  items: any[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}