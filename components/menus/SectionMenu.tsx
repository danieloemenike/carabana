"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { SectionMenuDto } from "@/lib/menus/types";
import { SectionMenuSkeleton } from "./SectionMenuSkeleton";

type SectionMenuProps = {
  endpoint: string;
  heading: string;
  categoryHeadingClassName: string;
  titleClassName: string;
  emptyLabel: string;
};

async function fetchSectionMenu(endpoint: string): Promise<SectionMenuDto> {
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Failed to load menu");
  }
  return response.json();
}

export function SectionMenu({
  endpoint,
  heading,
  categoryHeadingClassName,
  titleClassName,
  emptyLabel,
}: SectionMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const query = useQuery({
    queryKey: ["section-menu", endpoint],
    queryFn: () => fetchSectionMenu(endpoint),
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    const categories = query.data?.categories ?? [];
    return categories
      .filter((category) => !selectedCategory || category.name === selectedCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedSearch) return true;
          return (
            item.name.toLowerCase().includes(normalizedSearch) ||
            item.price.toLowerCase().includes(normalizedSearch)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [query.data, selectedCategory, normalizedSearch]);

  if (query.isLoading) {
    return <SectionMenuSkeleton />;
  }

  if (query.isError) {
    return (
      <section className="w-full py-12 text-center">
        <p className="text-red-300">{(query.error as Error).message}</p>
      </section>
    );
  }

  return (
    <section className="mt-4 flex h-full w-full py-10">
      <div className="h-full w-full">
        <div className="flex h-full w-full items-center justify-center px-2 text-[1rem] md:text-[3rem]">
          <h2 className={titleClassName}>{heading}</h2>
        </div>
        <div className="h-full w-full">
          <div className="m-4 flex flex-col justify-center gap-2 p-4 md:flex-row md:gap-4">
            <select
              title="categories"
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="mt-4 rounded-md bg-black p-2"
            >
              <option value="">All</option>
              {(query.data?.categories ?? []).map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="mt-4 w-[100%] rounded-md bg-black p-2 lg:w-[40%]"
            />
          </div>

          {filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="flex justify-center">
                <h3 className={categoryHeadingClassName}>{category.name}</h3>
              </div>
              <div className="mx-2 grid grid-cols-2 gap-2 backdrop-blur-lg md:mx-3 md:grid-cols-3 md:gap-6 lg:mx-20 lg:grid-cols-4">
                {category.items.map((item) => (
                  <div key={item.id} className="h-80 w-50 rounded-md p-2 shadow backdrop-blur-lg">
                    <div className="mb-2 flex h-60 w-full items-center justify-center overflow-hidden rounded-t-lg bg-white object-contain">
                      <Image
                        src={item.imageUrl || "/undraw.svg"}
                        alt={item.name}
                        width={290}
                        height={150}
                        className="rounded-xl object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="mb-4 flex h-[17%] w-full items-center justify-center rounded-xl border border-black px-3 py-8 drop-shadow-2xl">
                      <h2 className="text-base text-white">
                        <span>{item.name} - </span>
                        <span className="rounded-md bg-white p-1 text-sm font-semibold text-black">
                          {item.price}
                        </span>
                      </h2>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="my-36 col-span-5 flex h-60 w-full flex-col items-center justify-center gap-4 text-center text-2xl font-semibold">
              <Image src="/undraw.svg" alt="missing" width={250} height={250} />
              <h2>{emptyLabel}</h2>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
