import bcrypt from "bcryptjs";

export interface User {
  id: string; name: string; email: string; password: string;
  role: string; createdAt: string; updatedAt: string;
}
export interface Warehouse {
  id: string; name: string; location: string;
  createdAt: string; updatedAt: string;
}
export interface Product {
  id: string; name: string; sku: string; price: number;
  quantity: number; description?: string; warehouseId: string;
  createdById: string; createdAt: string; updatedAt: string;
}
export interface InventoryMovement {
  id: string; productId: string; type: string; quantity: number;
  reason: string; createdById: string; createdAt: string;
}
export interface Order {
  id: string; customerId: string; status: string;
  totalPrice: number; createdAt: string; updatedAt: string;
}
export interface OrderItem {
  id: string; orderId: string; productId: string;
  quantity: number; price: number;
}

interface Store {
  users: User[];
  warehouses: Warehouse[];
  products: Product[];
  movements: InventoryMovement[];
  orders: Order[];
  orderItems: OrderItem[];
}

const g = globalThis as any;

function seed(): Store {
  const now = new Date().toISOString();
  const d = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

  const users: User[] = [
    { id: "user-superadmin", name: "Super Admin", email: "superadmin@inventory.com",
      password: bcrypt.hashSync("superadmin123", 8), role: "SUPER_ADMIN", createdAt: now, updatedAt: now },
    { id: "user-admin", name: "Admin User", email: "admin@inventory.com",
      password: bcrypt.hashSync("admin123", 8), role: "ADMIN", createdAt: now, updatedAt: now },
    { id: "user-employee", name: "Employee User", email: "employee@inventory.com",
      password: bcrypt.hashSync("employee123", 8), role: "EMPLOYEE", createdAt: now, updatedAt: now },
    { id: "user-customer", name: "Customer User", email: "customer@inventory.com",
      password: bcrypt.hashSync("customer123", 8), role: "CUSTOMER", createdAt: now, updatedAt: now },
  ];

  const warehouses: Warehouse[] = [
    { id: "wh-main", name: "Main Warehouse", location: "Building A, Floor 1", createdAt: now, updatedAt: now },
    { id: "wh-secondary", name: "Secondary Warehouse", location: "Building B, Floor 2", createdAt: now, updatedAt: now },
  ];

  const products: Product[] = [
    { id: "prod-1", name: "Dell Laptop", sku: "DELL-123", price: 999.99, quantity: 50,
      description: "Dell Inspiron 15 Laptop - Intel Core i7",
      warehouseId: "wh-main", createdById: "user-superadmin", createdAt: d(30), updatedAt: d(5) },
    { id: "prod-2", name: "Logitech Mouse", sku: "LOGI-55", price: 29.99, quantity: 200,
      description: "Logitech MX Master 3 Wireless Mouse",
      warehouseId: "wh-main", createdById: "user-superadmin", createdAt: d(28), updatedAt: d(3) },
    { id: "prod-3", name: "RGB Keyboard", sku: "KEY-88", price: 79.99, quantity: 150,
      description: "Mechanical RGB Gaming Keyboard",
      warehouseId: "wh-secondary", createdById: "user-admin", createdAt: d(25), updatedAt: d(2) },
    { id: "prod-4", name: "Monitor 24\"", sku: "MON-24", price: 249.99, quantity: 8,
      description: "Full HD IPS Monitor",
      warehouseId: "wh-main", createdById: "user-admin", createdAt: d(20), updatedAt: d(1) },
    { id: "prod-5", name: "USB Hub", sku: "USB-7P", price: 19.99, quantity: 5,
      description: "7-Port USB 3.0 Hub",
      warehouseId: "wh-secondary", createdById: "user-superadmin", createdAt: d(15), updatedAt: d(0) },
  ];

  const movements: InventoryMovement[] = [
    { id: "mov-1", productId: "prod-1", type: "IN", quantity: 50, reason: "Initial stock",
      createdById: "user-superadmin", createdAt: d(30) },
    { id: "mov-2", productId: "prod-2", type: "IN", quantity: 200, reason: "Initial stock",
      createdById: "user-superadmin", createdAt: d(28) },
    { id: "mov-3", productId: "prod-3", type: "IN", quantity: 150, reason: "Initial stock",
      createdById: "user-admin", createdAt: d(25) },
    { id: "mov-4", productId: "prod-4", type: "IN", quantity: 10, reason: "Initial stock",
      createdById: "user-admin", createdAt: d(20) },
    { id: "mov-5", productId: "prod-4", type: "OUT", quantity: 2, reason: "Order fulfilled",
      createdById: "user-employee", createdAt: d(5) },
    { id: "mov-6", productId: "prod-5", type: "IN", quantity: 5, reason: "Initial stock",
      createdById: "user-superadmin", createdAt: d(15) },
  ];

  const orders: Order[] = [
    { id: "ord-1", customerId: "user-customer", status: "PAID", totalPrice: 1029.98, createdAt: d(10), updatedAt: d(9) },
    { id: "ord-2", customerId: "user-customer", status: "SHIPPED", totalPrice: 79.99, createdAt: d(7), updatedAt: d(6) },
    { id: "ord-3", customerId: "user-customer", status: "PENDING", totalPrice: 249.99, createdAt: d(2), updatedAt: d(2) },
  ];

  const orderItems: OrderItem[] = [
    { id: "oi-1", orderId: "ord-1", productId: "prod-1", quantity: 1, price: 999.99 },
    { id: "oi-2", orderId: "ord-1", productId: "prod-2", quantity: 1, price: 29.99 },
    { id: "oi-3", orderId: "ord-2", productId: "prod-3", quantity: 1, price: 79.99 },
    { id: "oi-4", orderId: "ord-3", productId: "prod-4", quantity: 1, price: 249.99 },
  ];

  return { users, warehouses, products, movements, orders, orderItems };
}

export function getStore(): Store {
  if (!g.__store) g.__store = seed();
  return g.__store;
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
