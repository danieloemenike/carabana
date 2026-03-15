export type MenuItemDto = {
  id: string;
  name: string;
  price: string;
  imageKey: string | null;
  imageUrl: string;
  sortOrder: number;
};

export type MenuCategoryDto = {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemDto[];
};

export type SectionMenuDto = {
  id: string;
  key: string;
  title: string;
  heroImageKey: string | null;
  heroImageUrl: string;
  categories: MenuCategoryDto[];
};
