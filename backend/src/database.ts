import { promises as fs } from 'fs';
import path from 'path';
import { MenuItem, AdminOrder, AdminStats, CartItem } from './types';

interface Database {
  menuItems: MenuItem[];
  testimonials: any[]; // You might want to create a type for this
  orders: AdminOrder[];
  stats: AdminStats;
}

const dbPath = path.join(__dirname, 'db.json');

let inMemoryDb: Database | null = null;

async function readDb(): Promise<Database> {
  if (inMemoryDb) {
    return inMemoryDb;
  }
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    inMemoryDb = JSON.parse(data);
    return inMemoryDb!;
  } catch (error) {
    // If the file doesn't exist or is invalid, this will be caught.
    // You might want to handle this more gracefully, e.g., by creating a default DB.
    console.error('Error reading or parsing db.json:', error);
    throw new Error('Could not read database.');
  }
}

async function writeDb(db: Database): Promise<void> {
  inMemoryDb = db; // Update in-memory cache
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const db = await readDb();
  return db.menuItems;
};

export const getTestimonials = async (): Promise<any[]> => {
  const db = await readDb();
  return db.testimonials;
};

export const getOrders = async (): Promise<AdminOrder[]> => {
  const db = await readDb();
  return db.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getStats = async (): Promise<AdminStats> => {
  const db = await readDb();
  return db.stats;
};

export const addOrder = async (order: AdminOrder): Promise<AdminOrder> => {
  const db = await readDb();
  db.orders.push(order);
  
  // Update stats
  db.stats.ordersToday += 1;
  db.stats.revenueToday += order.total;
  if (!db.orders.some(o => o.customerName === order.customerName && o.id !== order.id)) {
      db.stats.newCustomers += 1;
  }

  await writeDb(db);
  return order;
};
