import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeFeatures } from "@/lib/venueFeatures";

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: { contacts: true },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
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
      cost: body.cost !== undefined && body.cost !== "" ? Number(body.cost) : null,
      costNotes: body.costNotes || null,
      pitch: body.pitch || null,
      features: serializeFeatures(body.features || []),
      notes: body.notes || null,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
