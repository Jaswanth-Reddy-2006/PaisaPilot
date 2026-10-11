import { z } from 'zod';

export const TransactionCategorySchema = z.enum([
  'food',
  'transport',
  'entertainment',
  'shopping',
  'utilities',
  'rent',
  'health',
  'education',
  'savings',
  'income',
  'subscription',
  'emergency',
  'other',
]);

export const TransactionTypeSchema = z.enum([
  'income',
  'expense',
  'transfer',
  'savings',
]);

export const TransactionInputSchema = z.object({
  type: TransactionTypeSchema,
  category: TransactionCategorySchema,
  amount: z.number().int().positive({ message: 'Amount must be greater than zero' }),
  description: z
    .string()
    .min(1, { message: 'Description cannot be empty' })
    .max(100, { message: 'Description too long' }),
  day: z.number().int().min(1).max(30),
});

export const DecisionInputSchema = z.object({
  type: z.enum(['purchase', 'subscription', 'emergency', 'income', 'savings', 'bill']),
  description: z.string().min(1).max(100),
  amount: z.number().int().positive(),
  category: TransactionCategorySchema,
  isRecurring: z.boolean().optional(),
});

export const CommitmentInputSchema = z.object({
  name: z.string().min(1).max(80),
  category: TransactionCategorySchema,
  amount: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(30),
});

export const SavingsGoalInputSchema = z.object({
  name: z.string().min(1).max(80),
  targetAmount: z.number().int().positive(),
  currentAmount: z.number().int().min(0).default(0),
  targetDay: z.number().int().min(1).max(30),
  description: z.string().max(150).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#22c55e'),
});
