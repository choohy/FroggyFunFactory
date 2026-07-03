import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: { contacts: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(venues);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const venue = await prisma.venue.create({
    data: {
      name: body.name.trim(),
      address: body.address || null,
      capacity: body.capacity ? Number(body.capacity) : null,
      costNotes: body.costNotes || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
