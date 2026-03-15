"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";
import { SECTION_KEYS, SECTION_TITLES } from "@/lib/menus/sections";

function CategoriesManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-zinc-800/80" />
      </div>

      {SECTION_KEYS.map((key) => (
        <section key={key} className="space-y-3 rounded-lg p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-zinc-800" />
            <div className="flex gap-2">
              <div className="h-9 min-w-[220px] animate-pulse rounded-md bg-zinc-800" />
              <div className="h-9 w-14 animate-pulse rounded-md bg-zinc-800" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md bg-zinc-900/60 p-3"
              >
                <div className="h-4 w-48 animate-pulse rounded bg-zinc-700" />
                <div className="flex gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-md bg-zinc-700" />
                  <div className="h-9 w-9 animate-pulse rounded-md bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type CategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  sectionId: string;
};

type SectionGroup = {
  key: string;
  title: string;
  categories: CategoryRow[];
};

async function fetchCategories(sectionKey: string): Promise<CategoryRow[]> {
  const response = await fetch(`/api/admin/menus/categories?sectionKey=${encodeURIComponent(sectionKey)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Failed to load categories");
  }
  return response.json();
}

async function mutateJson(url: string, method: string, payload?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  return response.json();
}

async function invalidateForSection(queryClient: ReturnType<typeof useQueryClient>, sectionKey: string) {
  const [group, slug] = sectionKey.split("/");
  await queryClient.invalidateQueries({ queryKey: ["admin-section", group, slug] });
  await queryClient.invalidateQueries({ queryKey: ["section-menu", `/api/menus/${group}/${slug}`] });

  if (sectionKey === "lounge/madiba-sky") {
    await queryClient.invalidateQueries({ queryKey: ["section-menu", "/api/menus/lounge/madiba"] });
    await queryClient.invalidateQueries({ queryKey: ["section-menu", "/api/menus/lounge/sky"] });
  }
}

export function CategoriesManager() {
  const queryClient = useQueryClient();
  const [newCategoryBySection, setNewCategoryBySection] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    pending?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const sectionsQuery = useQuery({
    queryKey: ["admin-categories-all-sections"],
    queryFn: async (): Promise<SectionGroup[]> => {
      const results = await Promise.all(
        SECTION_KEYS.map(async (key) => {
          const categories = await fetchCategories(key);
          return { key, title: SECTION_TITLES[key], categories };
        })
      );
      return results;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ sectionKey, name }: { sectionKey: string; name: string }) =>
      mutateJson("/api/admin/menus/categories", "POST", { sectionKey, name }),
    onSuccess: async (_data, variables) => {
      toast.success("Category created");
      setNewCategoryBySection((prev) => ({ ...prev, [variables.sectionKey]: "" }));
      await queryClient.invalidateQueries({ queryKey: ["admin-categories-all-sections"] });
      await invalidateForSection(queryClient, variables.sectionKey);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      mutateJson(`/api/admin/menus/categories/${id}`, "PATCH", { name }),
    onSuccess: async () => {
      toast.success("Category updated");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-categories-all-sections"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-section"] });
      await queryClient.invalidateQueries({ queryKey: ["section-menu"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => mutateJson(`/api/admin/menus/categories/${id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Category deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin-categories-all-sections"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-section"] });
      await queryClient.invalidateQueries({ queryKey: ["section-menu"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    },
  });

  const flattened = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);

  const runConfirmAction = async () => {
    if (!confirm) return;
    setConfirmPending(true);
    try {
      await confirm.onConfirm();
      setConfirm(null);
    } finally {
      setConfirmPending(false);
    }
  };

  if (sectionsQuery.isLoading) {
    return <CategoriesManagerSkeleton />;
  }

  if (sectionsQuery.isError) {
    return <p className="text-red-300">{(sectionsQuery.error as Error).message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Categories</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage categories across all menu sections.</p>
      </div>

      {flattened.map((section) => (
        <section key={section.key} className="space-y-3 rounded-lg p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-medium text-white">{section.title}</h2>
            <div className="flex gap-2">
              <input
                value={newCategoryBySection[section.key] ?? ""}
                onChange={(event) =>
                  setNewCategoryBySection((prev) => ({ ...prev, [section.key]: event.target.value }))
                }
                placeholder="New category name"
                className="h-9 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
              />
              <Button
                type="button"
                size="sm"
                disabled={!newCategoryBySection[section.key]?.trim() || createMutation.isPending}
                onClick={() =>
                  setConfirm({
                    title: "Create category?",
                    description: `Create "${newCategoryBySection[section.key]?.trim()}" in ${section.title}.`,
                    confirmLabel: "Create",
                    onConfirm: async () =>
                      createMutation.mutateAsync({
                        sectionKey: section.key,
                        name: (newCategoryBySection[section.key] ?? "").trim(),
                      }),
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          {section.categories.length === 0 ? (
            <p className="text-sm text-zinc-400">No categories yet.</p>
          ) : (
            <div className="space-y-2">
              {section.categories.map((category) => {
                const isEditing = editing?.id === category.id;
                const draft = isEditing ? editing.value : category.name;

                return (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-md bg-zinc-900/60 p-3">
                    {isEditing ? (
                      <input
                        value={draft}
                        onChange={(event) => setEditing({ id: category.id, value: event.target.value })}
                        className="h-9 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                      />
                    ) : (
                      <span className="text-sm text-zinc-100">{category.name}</span>
                    )}

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            disabled={!draft.trim() || updateMutation.isPending}
                            onClick={() =>
                              setConfirm({
                                title: "Update category?",
                                description: `Save "${draft.trim()}"?`,
                                confirmLabel: "Update",
                                onConfirm: async () =>
                                  updateMutation.mutateAsync({ id: category.id, name: draft.trim() }),
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="outline" onClick={() => setEditing(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setEditing({ id: category.id, value: category.name })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          setConfirm({
                            title: "Delete category?",
                            description: `Delete "${category.name}" from ${section.title}?`,
                            confirmLabel: "Delete",
                            onConfirm: async () => deleteMutation.mutateAsync({ id: category.id }),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        pending={confirmPending}
        onCancel={() => !confirmPending && setConfirm(null)}
        onConfirm={runConfirmAction}
      />
    </div>
  );
}
