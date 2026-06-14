import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be at most 5000 characters'),
});

export const startSessionSchema = z.record(z.string(), z.string());

export const playgroundSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be at most 5000 characters'),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    }),
  ).optional().default([]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type PlaygroundInput = z.infer<typeof playgroundSchema>;
