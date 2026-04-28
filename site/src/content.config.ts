import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().optional(),
    order: z.number(),
    group: z.enum(['reference', 'compare']),
    sources: z.array(z.string().url()).optional(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { docs };
