import { z } from "zod";
import { scrollDepths } from "./scroll-depths";

const maxAttentionMs = 30 * 60 * 1000;
const label = z.string().trim().min(1).max(120);

const pageviewEventSchema = z.object({
  type: z.literal("pageview"),
});

const attentionEventSchema = z.object({
  type: z.literal("attention"),
  kind: z.enum(["project", "section"]),
  target: label,
  ms: z.number().int().min(0).max(maxAttentionMs),
});

const scrollEventSchema = z.object({
  type: z.literal("scroll"),
  depth: z.literal(scrollDepths),
});

const clickEventSchema = z.object({
  type: z.literal("click"),
  action: label,
  project: label.optional(),
});

export const trackedEventSchema = z.discriminatedUnion("type", [
  pageviewEventSchema,
  attentionEventSchema,
  scrollEventSchema,
  clickEventSchema,
]);

export const collectPayloadSchema = z.object({
  url: z.url({ protocol: /^https?$/ }).max(2048),
  referrer: z.string().trim().min(1).max(253).optional(),
  ref: z.string().trim().min(1).max(64).optional(),
  events: z.array(trackedEventSchema).min(1).max(100),
});

export type TrackedEvent = z.infer<typeof trackedEventSchema>;
export type AttentionEvent = z.infer<typeof attentionEventSchema>;
export type ScrollEvent = z.infer<typeof scrollEventSchema>;
export type ClickEvent = z.infer<typeof clickEventSchema>;
export type CollectPayload = z.infer<typeof collectPayloadSchema>;

export function parseCollectPayload(body: string): CollectPayload | null {
  try {
    const result = collectPayloadSchema.safeParse(JSON.parse(body));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
