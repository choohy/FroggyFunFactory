import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeFeatures } from "@/lib/venueFeatures";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { contacts: true },
  });

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json(venue);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const venue = await prisma.venue.update({
    where: { id },
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

  return NextResponse.json(venue);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body.isFavorite !== "boolean") {
    return NextResponse.json({ error: "isFavorite must be a boolean" }, { status: 400 });
  }

  const venue = await prisma.venue.update({
    where: { id },
    data: { isFavorite: body.isFavorite },
  });

  return NextResponse.json(venue);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.venue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
