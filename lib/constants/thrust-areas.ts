export const THRUST_AREAS = [
  "Revenue Growth",
  "Operational Excellence",
  "People & Culture",
] as const;

export type ThrustArea = (typeof THRUST_AREAS)[number];
