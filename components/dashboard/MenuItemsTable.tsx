"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export type ItemDraft = {
  name: string;
  price: string;
  imageKey: string | null;
};

export type MenuItemRow = {
  id: string;
  name: string;
  price: string;
  imageKey: string | null;
  imageUrl: string;
};

export function MenuItemsTable({
  items,
  onEditItem,
  onDeleteItem,
  disabled,
}: Readonly<{
  items: MenuItemRow[];
  onEditItem: (item: MenuItemRow) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  disabled?: boolean;
}>) {
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    itemId: string;
    itemName: string;
  } | null>(null);
  const [confirmPending, setConfirmPending] = React.useState(false);

  const columns: ColumnDef<MenuItemRow>[] = [
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => {
        const original = row.original;
        return (
          <div className="flex min-w-[120px] items-center gap-3">
            {original.imageUrl ? (
              <Image
                src={original.imageUrl}
                alt={original.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-md border border-zinc-700 bg-white object-contain"
              />
            ) : (
              <span className="text-xs text-zinc-500">No image</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <p className="min-w-[220px] text-sm text-zinc-100">{row.original.name}</p>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <p className="min-w-[150px] text-sm text-zinc-300">{row.original.price}</p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const original = row.original;
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={disabled}
              onClick={() => onEditItem(original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              disabled={disabled}
              onClick={() =>
                setDeleteConfirm({ itemId: original.id, itemName: original.name })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const runDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setConfirmPending(true);
    try {
      await onDeleteItem(deleteConfirm.itemId);
      setDeleteConfirm(null);
    } finally {
      setConfirmPending(false);
    }
  };

  return (
    <>
      <div className="overflow-auto rounded-md">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-zinc-900/60 text-zinc-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-zinc-800 px-3 py-2 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                  No items found for the current filter.
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-900/70 align-top">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="Delete item?"
        description={
          deleteConfirm
            ? `Remove "${deleteConfirm.itemName}" from this category?`
            : ""
        }
        confirmLabel="Delete item"
        pending={confirmPending}
        onCancel={() => !confirmPending && setDeleteConfirm(null)}
        onConfirm={runDeleteConfirm}
      />
    </>
  );
}
