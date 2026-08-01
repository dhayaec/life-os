import { z } from 'zod';

export const documentIdSchema = z.object({
  id: z.string().uuid(),
});
