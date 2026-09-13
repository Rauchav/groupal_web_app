// Fixed list a continent-scoped deal's reach (Deal.reach, lib/types/deal.ts)
// must pick from — unlike city/country, which are free text, continents are
// a small, known set so this is a checkbox list, not a text input.
export const CONTINENTS = [
  "North America",
  "Central America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
] as const

export type Continent = (typeof CONTINENTS)[number]
