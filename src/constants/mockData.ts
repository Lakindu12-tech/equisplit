import { User, Group, Expense } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    uid: 'user-me',
    displayName: 'You (Alex R.)',
    email: 'alex@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user-sarah',
    displayName: 'Sarah Jenkins',
    email: 'sarah@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user-mike',
    displayName: 'Mike Chen',
    email: 'mike@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user-elena',
    displayName: 'Elena Rostova',
    email: 'elena@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'user-david',
    displayName: 'David K.',
    email: 'david@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_GROUPS: Group[] = [
  {
    id: 'group-sri-lanka',
    name: 'Ella & Mirissa Roadtrip 🌴🇱🇰',
    members: ['user-me', 'user-sarah', 'user-mike', 'user-elena'],
    currency: 'LKR',
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'group-colombo',
    name: 'Colombo Apartment 🏙️',
    members: ['user-me', 'user-mike', 'user-david'],
    currency: 'LKR',
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    id: 'group-euro-trip',
    name: 'Kyoto & Tokyo Trip 🌸',
    members: ['user-me', 'user-sarah', 'user-mike', 'user-elena'],
    currency: 'USD',
    createdAt: Date.now() - 7 * 86400000,
  },
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-sl-1',
    groupId: 'group-sri-lanka',
    title: 'Seafood Dinner at Mirissa Beach',
    amount: 1850000, // Rs. 18,500.00
    payerId: 'user-me',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    category: 'food',
    splitType: 'EQUAL',
    splits: {
      'user-me': 462500,
      'user-sarah': 462500,
      'user-mike': 462500,
      'user-elena': 462500,
    },
    notes: 'Jumbo prawns and grilled red snapper',
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'exp-sl-2',
    groupId: 'group-sri-lanka',
    title: 'Scenic Train Ride Kandy to Ella',
    amount: 1200000, // Rs. 12,000.00
    payerId: 'user-sarah',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'transport',
    splitType: 'EQUAL',
    splits: {
      'user-me': 300000,
      'user-sarah': 300000,
      'user-mike': 300000,
      'user-elena': 300000,
    },
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'exp-sl-3',
    groupId: 'group-sri-lanka',
    title: 'Nine Arch Luxury Eco Villa',
    amount: 6400000, // Rs. 64,000.00
    payerId: 'user-mike',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    category: 'lodging',
    splitType: 'EXACT',
    splits: {
      'user-me': 1600000,
      'user-sarah': 1600000,
      'user-mike': 1600000,
      'user-elena': 1600000,
    },
    notes: 'Private mountain pool & breakfast included',
    createdAt: Date.now() - 1 * 86400000,
  },
  {
    id: 'exp-sl-4',
    groupId: 'group-sri-lanka',
    title: 'Udawalawe Elephant Safari Jeep',
    amount: 2400000, // Rs. 24,000.00
    payerId: 'user-elena',
    date: new Date().toISOString().split('T')[0],
    category: 'entertainment',
    splitType: 'PERCENTAGE',
    splits: {
      'user-me': 600000,
      'user-sarah': 600000,
      'user-mike': 600000,
      'user-elena': 600000,
    },
    createdAt: Date.now(),
  },
];
