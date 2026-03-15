import { NextResponse } from "next/server";
import { getSectionMenuByRoute } from "@/lib/menus/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ group: string; slug: string }> }
) {
  const { group, slug } = await context.params;
  const section = await getSectionMenuByRoute(group, slug);

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json(section);
}
