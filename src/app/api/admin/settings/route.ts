import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const DEFAULT_ID = "default";

/** Ensure a settings row exists, return it */
async function getOrCreateSettings() {
  let settings = await prisma.shopSettings.findUnique({ where: { id: DEFAULT_ID } });
  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: { id: DEFAULT_ID, shippingPrice: 8.9, freeShippingThreshold: 150, vatPercent: 20 },
    });
  }
  return settings;
}

// GET — public, returns current shop settings
export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

// PUT — admin only, update settings
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { shippingPrice, freeShippingThreshold, vatPercent } = body as {
    shippingPrice?: number;
    freeShippingThreshold?: number;
    vatPercent?: number;
  };

  // Validate inputs
  if (shippingPrice !== undefined && (typeof shippingPrice !== "number" || shippingPrice < 0)) {
    return NextResponse.json({ error: "Prix de livraison invalide" }, { status: 400 });
  }
  if (freeShippingThreshold !== undefined && (typeof freeShippingThreshold !== "number" || freeShippingThreshold < 0)) {
    return NextResponse.json({ error: "Seuil de livraison gratuite invalide" }, { status: 400 });
  }
  if (vatPercent !== undefined && (typeof vatPercent !== "number" || vatPercent < 0 || vatPercent > 100)) {
    return NextResponse.json({ error: "Pourcentage de TVA invalide" }, { status: 400 });
  }

  await getOrCreateSettings(); // ensure row exists

  const updated = await prisma.shopSettings.update({
    where: { id: DEFAULT_ID },
    data: {
      ...(shippingPrice !== undefined && { shippingPrice }),
      ...(freeShippingThreshold !== undefined && { freeShippingThreshold }),
      ...(vatPercent !== undefined && { vatPercent }),
    },
  });

  return NextResponse.json(updated);
}
