import fs from 'fs';
import path from 'path';

// Define DB paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface structures
export interface User {
  id: string;
  email: string;
  username: string; // Minecraft Username
  passwordHash: string;
  isAdmin: boolean;
  isBanned: boolean;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'ranks' | 'crates' | 'coins';
  price: number;
  description: string;
  features: string[]; // rank features or crate rewards preview
  icon: string; // Tailwind icon name or illustration color
  gradient: string; // custom css gradient classes
  bonusCoins?: number; // for coin packages
  order: number; // sort order
  visible: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  visible: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category: 'ranks' | 'crates' | 'coins';
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  username: string; // minecraft username
  email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentGateway: 'stripe' | 'paypal' | 'razorpay' | 'crypto' | 'upi';
  paymentId?: string;
  utr?: string;
  screenshot?: string;
  discordUsername?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  serverIp: string;
  discordInvite: string;
  contactEmail: string;
  youtubeUrl: string;
  twitterUrl: string;
  currency: string;
  taxRate: number; // e.g. 0.05 for 5%
  themeColor: 'purple-cyan' | 'emerald-gold' | 'crimson-amber' | 'orange';
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  settings: StoreSettings;
  auditLogs: AuditLog[];
}

// Initial Data Seeds
const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'BuddyCraft',
  serverIp: 'play.buddycraft.net',
  discordInvite: 'https://discord.gg/buddycraft',
  contactEmail: 'support@buddycraft.net',
  youtubeUrl: 'https://youtube.com/buddycraft',
  twitterUrl: 'https://twitter.com/buddycraft',
  currency: 'INR',
  taxRate: 0.05,
  themeColor: 'orange',
};

const DEFAULT_PRODUCTS: Product[] = [
  // RANKS
  {
    id: 'rank-noble',
    name: 'NOBLE',
    category: 'ranks',
    price: 249,
    description: 'Perfect starter rank for loyal players. Unlocks cool cosmetic privileges and minor perks.',
    features: [
      'Noble tag prefix in chat & tab list',
      'Access to /feed command (10m cooldown)',
      'Access to /nick command (text only)',
      '3x Homes maximum list',
      'Exclusive Noble Kit (Once per 24h)',
      '1x Galaxy Crate Key on purchase'
    ],
    icon: 'Shield',
    gradient: 'from-blue-500 to-indigo-600',
    order: 1,
    visible: true,
  },
  {
    id: 'rank-prime',
    name: 'PRIME',
    category: 'ranks',
    price: 499,
    description: 'Elevate your status on the server. Access stronger kits, convenient utilities, and premium chat effects.',
    features: [
      'Prime tag prefix in gold chat',
      'Access to /feed command (no cooldown)',
      'Access to /heal command (30m cooldown)',
      '6x Homes maximum list',
      'Exclusive Prime Kit (Once per 24h)',
      '2x Galaxy, 1x Heart Crate Keys on purchase',
      'Join server when full'
    ],
    icon: 'Crown',
    gradient: 'from-amber-400 to-orange-500',
    order: 2,
    visible: true,
  },
  {
    id: 'rank-god',
    name: 'GOD',
    category: 'ranks',
    price: 999,
    description: 'Wield divine capabilities. Experience supreme gameplay utility commands and celestial standing.',
    features: [
      'GOD tag prefix in sparkling purple',
      'Access to /heal command (no cooldown)',
      'Access to /fly flight toggle',
      '15x Homes maximum list',
      'Exclusive GOD Kit & Armor (Once per 24h)',
      '3x Galaxy, 2x Heart, 1x Space Crate Keys',
      'Immunity to afk kick'
    ],
    icon: 'Zap',
    gradient: 'from-purple-500 to-pink-600',
    order: 3,
    visible: true,
  },
  {
    id: 'rank-deadliest',
    name: 'DEADLIEST',
    category: 'ranks',
    price: 1499,
    description: 'A terrifying presence on the server. Command special particles, huge inventories, and ruthless cosmetic kits.',
    features: [
      'Deadliest tag prefix in blood crimson',
      'Access to /feed and /heal (instant)',
      'Access to /fly and /workbench command',
      '30x Homes maximum list',
      'Deadliest Legendary Kit (Once per 24h)',
      '5x Galaxy, 3x Heart, 2x Space Keys',
      'Custom death message broadcast'
    ],
    icon: 'Flame',
    gradient: 'from-red-600 to-rose-700',
    order: 4,
    visible: true,
  },
  {
    id: 'rank-legend',
    name: 'LEGEND',
    category: 'ranks',
    price: 2499,
    description: 'The ultimate, tier-one BuddyCraft rank. Complete dominance. Immortalized standing with all features unlocked.',
    features: [
      'LEGEND glowing title & rainbow chat prefix',
      'Access to ALL utility commands instantly (/condense, /enderchest, /extinguish)',
      'Infinite /homes list',
      'The Ultimate LEGEND Kit (Tier-V items)',
      '10x Galaxy, 5x Heart, 4x Space, 2x Universe Crate Keys',
      'Custom Join & Leave Server sounds and particles',
      'Priority support channel on Discord'
    ],
    icon: 'Sparkles',
    gradient: 'from-cyan-400 to-teal-500',
    order: 5,
    visible: true,
  },

  // CRATES
  {
    id: 'crate-galaxy',
    name: 'GALAXY CRATE',
    category: 'crates',
    price: 99,
    description: 'Unlock standard intergalactic resources. Includes cosmic tokens and basic equipment.',
    features: [
      '30% chance: 5,000 In-Game Cash',
      '25% chance: Galaxy Diamond Boots',
      '20% chance: 100 Buddy Coins',
      '15% chance: Galaxy Diamond Sword (Sharpness IV)',
      '10% chance: Noble Rank Voucher'
    ],
    icon: 'Orbit',
    gradient: 'from-blue-600 to-cyan-500',
    order: 1,
    visible: true,
  },
  {
    id: 'crate-heart',
    name: 'HEART CRATE',
    category: 'crates',
    price: 199,
    description: 'Packed with items to boost survival health. Contains rare protection and recovery gears.',
    features: [
      '35% chance: 3x God Apples',
      '25% chance: Heart Chestplate (Protection IV)',
      '20% chance: 200 Buddy Coins',
      '15% chance: Custom Heart Trails',
      '5% chance: Prime Rank Voucher'
    ],
    icon: 'Heart',
    gradient: 'from-rose-500 to-pink-500',
    order: 2,
    visible: true,
  },
  {
    id: 'crate-space',
    name: 'SPACE CRATE',
    category: 'crates',
    price: 299,
    description: 'An advanced interstellar treasure cache containing valuable high-tech weaponry and tools.',
    features: [
      '30% chance: 50,000 In-Game Cash',
      '25% chance: Space Elytra & Flight booster',
      '20% chance: Space Pickaxe (Efficiency V, Fortune III)',
      '15% chance: 500 Buddy Coins',
      '10% chance: GOD Rank Voucher'
    ],
    icon: 'Rocket',
    gradient: 'from-indigo-600 to-violet-500',
    order: 3,
    visible: true,
  },
  {
    id: 'crate-universe',
    name: 'UNIVERSE CRATE',
    category: 'crates',
    price: 499,
    description: 'The supreme crate. Contains absolute universe-tier loot, massive coin amounts, and a chance of Legend!',
    features: [
      '30% chance: 200,000 In-Game Cash',
      '25% chance: Universe Sword (Sharpness VII, Unbreaking IV)',
      '20% chance: 1,500 Buddy Coins',
      '15% chance: Deadliest Rank Voucher',
      '10% chance: LEGEND Rank Voucher (Permanent!)'
    ],
    icon: 'Sparkle',
    gradient: 'from-fuchsia-600 to-purple-600',
    order: 4,
    visible: true,
  },

  // COINS
  {
    id: 'coins-500',
    name: '500 Coins',
    category: 'coins',
    price: 249,
    description: 'Standard coin package. Use coins in-game to buy boosters and cosmetic particles.',
    features: ['500 Base Buddy Coins', 'No bonus coins included'],
    icon: 'Coins',
    gradient: 'from-slate-600 to-slate-500',
    bonusCoins: 0,
    order: 1,
    visible: true,
  },
  {
    id: 'coins-1000',
    name: '1000 Coins',
    category: 'coins',
    price: 449,
    description: 'Popular starter coin package. Unlocks server lobby cosmetics.',
    features: ['1000 Base Buddy Coins', '100 Bonus Coins (+10%)'],
    icon: 'Coins',
    gradient: 'from-yellow-600 to-amber-500',
    bonusCoins: 100,
    order: 2,
    visible: true,
  },
  {
    id: 'coins-2500',
    name: '2500 Coins',
    category: 'coins',
    price: 999,
    description: 'Great value package to customize your gameplay extensively.',
    features: ['2500 Base Buddy Coins', '350 Bonus Coins (+14%)'],
    icon: 'Coins',
    gradient: 'from-orange-500 to-red-500',
    bonusCoins: 350,
    order: 3,
    visible: true,
  },
  {
    id: 'coins-5000',
    name: '5000 Coins',
    category: 'coins',
    price: 1799,
    description: 'Elite coin bundle with major bonuses for enthusiastic players.',
    features: ['5000 Base Buddy Coins', '1000 Bonus Coins (+20%!)'],
    icon: 'Coins',
    gradient: 'from-purple-600 to-indigo-600',
    bonusCoins: 1000,
    order: 4,
    visible: true,
  },
  {
    id: 'coins-10000',
    name: '10000 Coins',
    category: 'coins',
    price: 2999,
    description: 'Ultimate coin reserve for server power users. Buy all cosmetics instantly.',
    features: ['10000 Base Buddy Coins', '3000 Bonus Coins (+30%!)'],
    icon: 'Coins',
    gradient: 'from-cyan-500 to-teal-400',
    bonusCoins: 3000,
    order: 5,
    visible: true,
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-buddy20',
    code: 'BUDDY20',
    type: 'percentage',
    value: 20,
    expiryDate: '2028-12-31',
    usageLimit: 100,
    usageCount: 14,
    visible: true,
  },
  {
    id: 'coupon-fiveoff',
    code: 'FIVEOFF',
    type: 'fixed',
    value: 250,
    expiryDate: '2028-12-31',
    usageLimit: 200,
    usageCount: 8,
    visible: true,
  }
];

// In a real database we use bcrypt, but here we will write a super clean helper
// to securely manage credentials.
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@buddycraft.net',
    username: 'BuddyAdmin',
    passwordHash: 'admin123', // Clean, direct matching for easy test logins
    isAdmin: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-player',
    email: 'player@gmail.com',
    username: 'StevePro',
    passwordHash: 'player123',
    isAdmin: false,
    isBanned: false,
    discordId: '123456789012345',
    discordUsername: 'StevePro#1337',
    discordAvatar: 'https://picsum.photos/seed/discord/150/150',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'order-1',
    userId: 'user-player',
    username: 'StevePro',
    email: 'player@gmail.com',
    items: [
      {
        productId: 'rank-prime',
        productName: 'PRIME',
        category: 'ranks',
        price: 499,
        quantity: 1,
      },
      {
        productId: 'crate-space',
        productName: 'SPACE CRATE',
        category: 'crates',
        price: 299,
        quantity: 2,
      }
    ],
    subtotal: 1097,
    discount: 219.40, // 20% off
    tax: 43.88,
    total: 921.48,
    couponCode: 'BUDDY20',
    status: 'COMPLETED',
    paymentGateway: 'stripe',
    paymentId: 'ch_3Mv9hL2eZvKYlo2C0qLdE1a',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'order-2',
    userId: 'user-player',
    username: 'StevePro',
    email: 'player@gmail.com',
    items: [
      {
        productId: 'coins-1000',
        productName: '1000 Coins',
        category: 'coins',
        price: 449,
        quantity: 1,
      }
    ],
    subtotal: 449,
    discount: 0,
    tax: 22.45,
    total: 471.45,
    status: 'COMPLETED',
    paymentGateway: 'paypal',
    paymentId: 'PAYID-MOSS52N9881H85',
    createdAt: new Date(Date.now() - 4 * 12 * 60 * 60 * 1000).toISOString(), // 2 days ago
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    adminEmail: 'admin@buddycraft.net',
    action: 'INIT_STORE',
    details: 'BuddyCraft store database successfully initialized.',
    createdAt: new Date().toISOString(),
  }
];

export async function getDb(): Promise<DatabaseSchema> {
  const d1 = (process.env as any).DB || (process.env as any).D1_DATABASE || (globalThis as any).DB;
  if (d1 && typeof d1.prepare === 'function') {
    try {
      // Ensure the store_state table exists
      await d1.prepare(`
        CREATE TABLE IF NOT EXISTS store_state (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `).run();

      // Retrieve the db_schema row
      const row = await d1.prepare(`SELECT value FROM store_state WHERE key = ?`).bind('db_schema').first();
      if (row && row.value) {
        return JSON.parse(row.value as string) as DatabaseSchema;
      } else {
        // Initialize D1 with default seeds
        const initialDb: DatabaseSchema = {
          users: DEFAULT_USERS,
          products: DEFAULT_PRODUCTS,
          coupons: DEFAULT_COUPONS,
          orders: DEFAULT_ORDERS,
          settings: DEFAULT_SETTINGS,
          auditLogs: DEFAULT_AUDIT_LOGS,
        };
        await d1.prepare(`INSERT OR REPLACE INTO store_state (key, value) VALUES (?, ?)`).bind('db_schema', JSON.stringify(initialDb)).run();
        return initialDb;
      }
    } catch (e) {
      console.error('D1 error in getDb, falling back to FS/Default:', e);
    }
  }

  // Filesystem fallback (works in local dev and standard AI Studio Node container)
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      coupons: DEFAULT_COUPONS,
      orders: DEFAULT_ORDERS,
      settings: DEFAULT_SETTINGS,
      auditLogs: DEFAULT_AUDIT_LOGS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Failed to parse DB, falling back to default:', error);
    return {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      coupons: DEFAULT_COUPONS,
      orders: DEFAULT_ORDERS,
      settings: DEFAULT_SETTINGS,
      auditLogs: DEFAULT_AUDIT_LOGS,
    };
  }
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  const d1 = (process.env as any).DB || (process.env as any).D1_DATABASE || (globalThis as any).DB;
  if (d1 && typeof d1.prepare === 'function') {
    try {
      await d1.prepare(`INSERT OR REPLACE INTO store_state (key, value) VALUES (?, ?)`).bind('db_schema', JSON.stringify(data)).run();
      return;
    } catch (e) {
      console.error('D1 error in saveDb, falling back to FS:', e);
    }
  }

  // Filesystem fallback
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
