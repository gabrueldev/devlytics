export const scrollDepths = [25, 50, 75, 100] as const;

export type ScrollDepth = (typeof scrollDepths)[number];
