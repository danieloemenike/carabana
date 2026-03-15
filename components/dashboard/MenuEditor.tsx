"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightCircleIcon, Check, Pencil, Plus, Search, Trash2, TrashIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { ALLOWED_IMAGE_MIME_TYPES, validateImageFile } from "@/lib/validations/image-upload";
import type { SectionMenuDto } from "@/lib/menus/types";
import { MenuItemsTable, type ItemDraft, type MenuItemRow } from "@/components/dashboard/MenuItemsTable";

type MenuEditorProps = {
  group: string;
  slug: string;
  title: string;
  sectionKey: string;
};

async function fetchSection(endpoint: string): Promise<SectionMenuDto> {
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Failed to load section");
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

async function invalidateSectionQueries(
  queryClient: QueryClient,
  group: string,
  slug: string
) {
  await queryClient.invalidateQueries({ queryKey: ["admin-section", group, slug] });
  await queryClient.invalidateQueries({ queryKey: ["section-menu", `/api/menus/${group}/${slug}`] });

  // Madiba and Sky share the same dataset, so invalidate both routes.
  if (group === "lounge" && (slug === "madiba" || slug === "sky" || slug === "madiba-sky")) {
    await queryClient.invalidateQueries({ queryKey: ["section-menu", "/api/menus/lounge/madiba"] });
    await queryClient.invalidateQueries({ queryKey: ["section-menu", "/api/menus/lounge/sky"] });
  }
}

/** Ensures price includes Naira (N or ₦) before submission. */
function normalizePriceWithNaira(price: string): string {
  const trimmed = price.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("N") || trimmed.startsWith("₦")) return trimmed;
  return `₦ ${trimmed}`;
}

export function MenuEditor({ group, slug, title, sectionKey }: Readonly<MenuEditorProps>) {
  const sectionEndpoint = `/api/admin/menus/sections/${group}/${slug}`;
  const queryClient = useQueryClient();
  const [sectionForm, setSectionForm] = useState({
    title: "",
    heroImageKey: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const sectionQuery = useQuery({
    queryKey: ["admin-section", group, slug],
    queryFn: () => fetchSection(sectionEndpoint),
  });
  const sectionData = sectionQuery.data;

  useEffect(() => {
    if (!sectionData) return;
    setSectionForm({
      title: sectionData.title ?? "",
      heroImageKey: sectionData.heroImageKey ?? "",
    });
  }, [sectionData]);

  const updateSectionMutation = useMutation({
    mutationFn: () =>
      mutateJson(sectionEndpoint, "PATCH", {
        title: sectionForm.title,
        heroImageKey: sectionForm.heroImageKey || null,
      }),
    onSuccess: async () => {
      toast.success("Section updated");
      await invalidateSectionQueries(queryClient, group, slug);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update section");
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (payload: {
      categoryId: string;
      name: string;
      price: string;
      imageKey: string | null;
    }) =>
      mutateJson("/api/admin/menus/items", "POST", {
        categoryId: payload.categoryId,
        name: payload.name,
        price: normalizePriceWithNaira(payload.price),
        imageKey: payload.imageKey || null,
      }),
    onSuccess: async () => {
      toast.success("Item created");
      await invalidateSectionQueries(queryClient, group, slug);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create item");
    },
  });

  const sortedCategories = useMemo(() => {
    const categories = sectionData?.categories ?? [];
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sectionData]);

  const filteredCategories = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return sortedCategories
      .filter((category) => categoryFilter === "all" || category.id === categoryFilter)
      .map((category) => {
        const categoryNameMatch = category.name.toLowerCase().includes(search);
        const items = search
          ? category.items.filter((item) => {
              const text = `${item.name} ${item.price}`.toLowerCase();
              return text.includes(search);
            })
          : category.items;

        return {
          ...category,
          items,
          visible: !search || categoryNameMatch || items.length > 0,
        };
      })
      .filter((category) => category.visible);
  }, [categoryFilter, searchQuery, sortedCategories]);

  const sectionPreviewUrl =
    resolveImageUrl(sectionForm.heroImageKey) || sectionData?.heroImageUrl || "";

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

  if (sectionQuery.isLoading) {
    return <MenuEditorSkeleton />;
  }

  if (sectionQuery.isError) {
    return <p className="text-red-300">{(sectionQuery.error as Error).message}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>

      {/* <section className="space-y-3 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white">Section image editor</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={sectionForm.title}
            onChange={(event) => setSectionForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Section title"
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
          />
          <ImageUploadField
            sectionKey={sectionKey}
            value={sectionForm.heroImageKey || null}
            onChange={(heroImageKey) => setSectionForm((prev) => ({ ...prev, heroImageKey: heroImageKey ?? "" }))}
          />
        </div>
        {sectionPreviewUrl ? (
          <Image
            src={sectionPreviewUrl}
            alt="Section hero preview"
            width={240}
            height={140}
            className="h-32 w-60 rounded-md border border-zinc-700 bg-white object-cover"
          />
        ) : null}
        <Button
          type="button"
          disabled={updateSectionMutation.isPending || !sectionForm.title.trim()}
          onClick={() =>
            setConfirm({
              title: "Update section details?",
              description: "This will update the section title and hero image.",
              confirmLabel: "Update section",
              onConfirm: async () => updateSectionMutation.mutateAsync(),
            })
          }
        >
          Save section
        </Button>
      </section> */}

      <section className="space-y-3 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white">Create new menu 🍲🍷</h2>
        <p className="text-sm text-zinc-400">Add a new menu item for this category.</p>
        <AddMenuItemDialog
          sectionKey={sectionKey}
          categories={sortedCategories}
          pending={createItemMutation.isPending}
          onCreate={async (payload) => {
            await createItemMutation.mutateAsync(payload);
          }}
        />
      </section>

      <section className="space-y-3 rounded-lg p-4">
        <h2 className="text-lg font-medium text-white">Manage all categories</h2>
        <p className="text-sm text-zinc-400">Create, edit, and delete categories from one dedicated page.</p>
        <Button type="button" asChild>
          <Link href="/dashboard/categories">
            <ArrowRightCircleIcon className="h-4 w-4" />
            Open categories page
          </Link>
        </Button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-medium text-white">Current menu</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search item or price..."
                className="h-10 w-64 rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
            >
              <option value="all">All categories</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredCategories.length === 0 ? (
          <p className="text-sm text-zinc-400">No categories or items match your search.</p>
        ) : null}
        {filteredCategories.map((category) => (
          <CategoryBlock
            key={category.id}
            sectionKey={sectionKey}
            category={category}
            visibleItems={category.items}
            onChanged={() => invalidateSectionQueries(queryClient, group, slug)}
          />
        ))}
      </section>

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

function CategoryBlock({
  sectionKey,
  category,
  visibleItems,
  onChanged,
}: Readonly<{
  sectionKey: string;
  category: SectionMenuDto["categories"][number];
  visibleItems: SectionMenuDto["categories"][number]["items"];
  onChanged: () => Promise<void>;
}>) {
  const [name, setName] = useState(category.name);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [updatePending, setUpdatePending] = useState(false);

  const updateCategoryMutation = useMutation({
    mutationFn: () =>
      mutateJson(`/api/admin/menus/categories/${category.id}`, "PATCH", {
        name,
      }),
    onSuccess: async () => {
      toast.success("Category updated");
      setEditing(false);
      await onChanged();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: () => mutateJson(`/api/admin/menus/categories/${category.id}`, "DELETE"),
    onSuccess: async () => {
      toast.success("Category deleted");
      await onChanged();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    },
  });

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

  return (
    <article className="space-y-4 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {editing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
          />
        ) : (
          <h3 className="text-lg font-medium text-white">{category.name}</h3>
        )}
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                size="icon"
                disabled={!name.trim() || updateCategoryMutation.isPending}
                onClick={() =>
                  setConfirm({
                    title: "Update category?",
                    description: `Save changes to "${name.trim()}".`,
                    confirmLabel: "Update category",
                    onConfirm: async () => {
                      await updateCategoryMutation.mutateAsync();
                      setEditing(false);
                    },
                  })
                }
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={updateCategoryMutation.isPending}
                onClick={() => {
                  setName(category.name);
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button type="button" size="icon" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            disabled={deleteCategoryMutation.isPending}
            onClick={() =>
              setConfirm({
                title: "Delete category?",
                description: `This will delete "${category.name}" and all items inside it.`,
                confirmLabel: "Delete category",
                onConfirm: async () => deleteCategoryMutation.mutateAsync(),
              })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <MenuItemsTable
          items={visibleItems}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={async (itemId) => {
            await mutateJson(`/api/admin/menus/items/${itemId}`, "DELETE");
            toast.success("Item deleted");
            await onChanged();
          }}
          disabled={updateCategoryMutation.isPending || deleteCategoryMutation.isPending}
        />
      </div>

      {editingItem ? (
        <EditMenuItemDialog
          item={editingItem}
          categoryName={category.name}
          sectionKey={sectionKey}
          pending={updatePending}
          onSave={async (payload) => {
            setUpdatePending(true);
            try {
              await mutateJson(`/api/admin/menus/items/${editingItem.id}`, "PATCH", {
                name: payload.name,
                price: payload.price,
                imageKey: payload.imageKey,
              });
              toast.success("Item updated");
              await onChanged();
              setEditingItem(null);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to update item");
              throw error;
            } finally {
              setUpdatePending(false);
            }
          }}
          onClose={() => setEditingItem(null)}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        pending={confirmPending}
        onCancel={() => !confirmPending && setConfirm(null)}
        onConfirm={runConfirmAction}
      />
    </article>
  );
}

function MenuEditorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 rounded-md bg-zinc-900" />
      <div className="rounded-lg p-4 space-y-3">
        <div className="h-5 w-52 rounded bg-zinc-900" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-10 rounded bg-zinc-900" />
          <div className="h-10 rounded bg-zinc-900" />
        </div>
        <div className="h-32 w-60 rounded bg-zinc-900" />
      </div>
      <div className="rounded-lg p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-zinc-900" />
        <div className="h-10 w-full rounded bg-zinc-900" />
      </div>
      <div className="rounded-lg p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-zinc-900" />
        <div className="h-56 rounded bg-zinc-900" />
      </div>
    </div>
  );
}

const addMenuItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required."),
  name: z.string().trim().min(1, "Item name is required."),
  price: z.string().trim().min(1, "Price is required."),
  imageKey: z.string().min(1, "Item image is required."),
});

const editMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  price: z.string().trim().min(1, "Price is required."),
  imageKey: z.string().min(1, "Item image is required."),
});

function AddMenuItemDialog({
  sectionKey,
  categories,
  pending,
  onCreate,
}: Readonly<{
  sectionKey: string;
  categories: SectionMenuDto["categories"];
  pending: boolean;
  onCreate: (payload: { categoryId: string; name: string; price: string; imageKey: string | null }) => Promise<void>;
}>) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    price: "",
    imageKey: null as string | null,
  });

  const validation = addMenuItemSchema.safeParse({
    categoryId: form.categoryId,
    name: form.name,
    price: form.price,
    imageKey: form.imageKey ?? "",
  });
  const canSubmit = validation.success && !pending;
  const validationMessage = attemptedSubmit && !validation.success ? validation.error.issues[0]?.message : null;

  function resetFormState() {
    setConfirmOpen(false);
    setAttemptedSubmit(false);
    setForm({ categoryId: "", name: "", price: "", imageKey: null });
  }

  async function confirmCreate() {
    const parsed = addMenuItemSchema.safeParse({
      categoryId: form.categoryId,
      name: form.name,
      price: form.price,
      imageKey: form.imageKey ?? "",
    });
    if (!parsed.success) {
      setAttemptedSubmit(true);
      return;
    }

    await onCreate({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      price: normalizePriceWithNaira(parsed.data.price),
      imageKey: parsed.data.imageKey,
    });
    setOpen(false);
    resetFormState();
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          resetFormState();
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        Add menu item
      </Button>

      <FormDialog
        open={open}
        title={confirmOpen ? "Confirm menu item creation" : "Add menu item"}
        onClose={() => {
          setOpen(false);
          resetFormState();
        }}
      >
        {confirmOpen ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Add {form.name.trim()} to the category?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => confirmCreate()}
              >
                {pending ? "Creating…" : "Create item"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="new-item-category" className="text-sm text-zinc-300">
                  Category
                </label>
                <select
                  id="new-item-category"
                  value={form.categoryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-item-name" className="text-sm text-zinc-300">
                  Item name
                </label>
                <input
                  id="new-item-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Jollof Rice"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="new-item-price" className="text-sm text-zinc-300">
                  Price
                </label>
                <input
                  id="new-item-price"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="e.g. N12,000 or 12,000"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                />
              </div>

              <div className="md:col-span-2">
                <AddMenuItemImageField
                  sectionKey={sectionKey}
                  value={form.imageKey}
                  onChange={(imageKey) => setForm((prev) => ({ ...prev, imageKey }))}
                  disabled={pending}
                />
              </div>
            </div>

            {validationMessage ? <p className="text-sm text-red-300">{validationMessage}</p> : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetFormState();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  setAttemptedSubmit(true);
                  if (validation.success) {
                    setConfirmOpen(true);
                  }
                }}
              >
                Create item
              </Button>
            </div>
          </div>
        )}
      </FormDialog>
    </>
  );
}

function EditMenuItemDialog({
  item,
  categoryName,
  sectionKey,
  pending,
  onSave,
  onClose,
}: Readonly<{
  item: MenuItemRow;
  categoryName: string;
  sectionKey: string;
  pending: boolean;
  onSave: (payload: ItemDraft) => Promise<void>;
  onClose: () => void;
}>) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    price: item.price,
    imageKey: item.imageKey,
  });

  // Sync form when item changes (e.g. dialog opened for a different item)
  useEffect(() => {
    setForm({ name: item.name, price: item.price, imageKey: item.imageKey });
    setConfirmOpen(false);
    setAttemptedSubmit(false);
  }, [item.id, item.name, item.price, item.imageKey]);

  const validation = editMenuItemSchema.safeParse({
    name: form.name,
    price: form.price,
    imageKey: form.imageKey ?? "",
  });
  const canSubmit = validation.success && !pending;
  const validationMessage = attemptedSubmit && !validation.success ? validation.error.issues[0]?.message : null;

  async function confirmUpdate() {
    const parsed = editMenuItemSchema.safeParse({
      name: form.name,
      price: form.price,
      imageKey: form.imageKey ?? "",
    });
    if (!parsed.success) {
      setAttemptedSubmit(true);
      return;
    }
    await onSave({
      name: parsed.data.name,
      price: normalizePriceWithNaira(parsed.data.price),
      imageKey: parsed.data.imageKey,
    });
    onClose();
  }

  return (
    <FormDialog open title={confirmOpen ? "Update menu item?" : "Edit menu item"} onClose={onClose}>
      {confirmOpen ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Update &quot;{form.name.trim()}&quot; in {categoryName}?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              Back
            </Button>
            <Button type="button" disabled={pending} onClick={() => confirmUpdate()}>
              {pending ? "Saving…" : "Update item"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm text-zinc-300">Category</p>
              <p className="h-10 rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">
                {categoryName}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-item-name" className="text-sm text-zinc-300">
                Item name
              </label>
              <input
                id="edit-item-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Jollof Rice"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="edit-item-price" className="text-sm text-zinc-300">
                Price
              </label>
              <input
                id="edit-item-price"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="e.g. N12,000 or 12,000"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
              />
            </div>

            <div className="md:col-span-2">
              <AddMenuItemImageField
                sectionKey={sectionKey}
                value={form.imageKey}
                onChange={(imageKey) => setForm((prev) => ({ ...prev, imageKey }))}
                disabled={pending}
                existingImageUrl={item.imageUrl}
              />
            </div>
          </div>

          {validationMessage ? <p className="text-sm text-red-300">{validationMessage}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                setAttemptedSubmit(true);
                if (validation.success) setConfirmOpen(true);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </FormDialog>
  );
}

function AddMenuItemImageField({
  sectionKey,
  value,
  onChange,
  disabled,
  existingImageUrl,
}: Readonly<{
  sectionKey: string;
  value: string | null;
  onChange: (imageKey: string | null) => void;
  disabled?: boolean;
  /** When editing, pass the current item's image URL so it shows before any new upload */
  existingImageUrl?: string | null;
}>) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear preview when form value is cleared (e.g. dialog closed or image removed)
  useEffect(() => {
    if (!value) setPreviewUrl(null);
  }, [value]);
  const inputId = "new-item-image-upload";

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadMeta = await fetch("/api/admin/menus/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey,
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadMeta.ok) {
        const payload = await uploadMeta.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, imageKey, publicUrl } = await uploadMeta.json();
      const putResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putResult.ok) {
        throw new Error("Upload failed");
      }

      setPreviewUrl(publicUrl ?? null);
      onChange(imageKey);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const imageUrl = value
    ? previewUrl || existingImageUrl || resolveImageUrl(value)
    : "";
  let uploadLabel = "Upload image";
  if (value) uploadLabel = "Replace image";
  if (uploading) uploadLabel = "Uploading...";

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm text-zinc-300">
        Item image
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploadLabel}
        </Button>
      </div>

      {imageUrl ? (
        <div className="relative h-28 w-44 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
          <Image src={imageUrl} alt="New item preview" fill className="object-cover" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => {
              setPreviewUrl(null);
              onChange(null);
            }}
            disabled={disabled || uploading}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Upload to preview the image.</p>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        disabled={disabled || uploading}
        onChange={handleFileSelect}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function resolveImageUrl(imageKey: string | null): string {
  if (!imageKey) return "";
  if (imageKey.startsWith("/")) return imageKey;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

function FormDialog({
  open,
  title,
  onClose,
  children,
}: Readonly<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
