import { z } from 'zod'

export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>
