export const SECTION_KEYS = [
  "club/regular",
  "club/vip",
  "lounge/kitchen",
  "lounge/madiba-sky",
  "lounge/regular",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type PublicRouteSectionKey =
  | "club/regular"
  | "club/vip"
  | "lounge/kitchen"
  | "lounge/madiba"
  | "lounge/sky"
  | "lounge/regular";

export function normalizeSectionKey(input: string): SectionKey | null {
  if (input === "lounge/madiba" || input === "lounge/sky") {
    return "lounge/madiba-sky";
  }
  if ((SECTION_KEYS as readonly string[]).includes(input)) {
    return input as SectionKey;
  }
  return null;
}

export function resolveSectionFromRoute(group: string, slug: string): SectionKey | null {
  return normalizeSectionKey(`${group}/${slug}`);
}

export function sectionToRouteKey(sectionKey: SectionKey): PublicRouteSectionKey {
  if (sectionKey === "lounge/madiba-sky") {
    return "lounge/madiba";
  }
  return sectionKey;
}

export const SECTION_TITLES: Record<SectionKey, string> = {
  "club/regular": "Regular Club Menu",
  "club/vip": "VIP Club Menu",
  "lounge/kitchen": "Kitchen Menu",
  "lounge/madiba-sky": "Madiba + Sky Menu",
  "lounge/regular": "Regular Lounge Menu",
};
