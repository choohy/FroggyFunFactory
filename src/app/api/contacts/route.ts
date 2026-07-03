import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    include: { venue: true, vendor: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      name: body.name.trim(),
      role: body.role || null,
      email: body.email || null,
      phone: body.phone || null,
      notes: body.notes || null,
      venueId: body.venueId || null,
      vendorId: body.vendorId || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
