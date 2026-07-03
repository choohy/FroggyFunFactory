import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    include: { contacts: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(vendors);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const vendor = await prisma.vendor.create({
    data: {
      name: body.name.trim(),
      serviceType: body.serviceType || null,
      pricingNotes: body.pricingNotes || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(vendor, { status: 201 });
}
