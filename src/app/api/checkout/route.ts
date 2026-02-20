import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { getUnitPrice, type PriceTier } from "@/lib/pricing";
// import { stripe } from "@/lib/stripe"; // ← Stripe temporairement désactivé

interface CheckoutItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeLabel: string;
  fileName: string;
  filePath: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerEmail, customerName, customerFirstName, customerLastName,
      customerPhone, customerCompany, customerAddress, customerPostalCode,
      customerCity, items,
    } = body as {
      customerEmail: string;
      customerName: string;
      customerFirstName: string;
      customerLastName: string;
      customerPhone: string;
      customerCompany: string;
      customerAddress: string;
      customerPostalCode: string;
      customerCity: string;
      items: CheckoutItem[];
    };

    if (!customerEmail || !customerFirstName || !customerLastName || !customerPhone || !customerAddress || !customerPostalCode || !customerCity || !items?.length) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    // ── Server-side price verification ──
    // Fetch all referenced products with their tiers in one query
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { tiers: { orderBy: { minQty: "asc" } } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const verifiedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Produit introuvable: ${item.productId}`);
      }

      // Filter tiers by sizeLabel if it exists
      let relevantTiers: PriceTier[] = product.tiers;
      if (item.sizeLabel) {
        const labelTiers = product.tiers.filter((t) => t.label === item.sizeLabel);
        if (labelTiers.length > 0) relevantTiers = labelTiers;
      }

      const serverUnitPrice = getUnitPrice(relevantTiers, item.quantity);
      const serverTotalPrice = parseFloat((serverUnitPrice * item.quantity).toFixed(2));

      return {
        ...item,
        unitPrice: serverUnitPrice,
        totalPrice: serverTotalPrice,
      };
    });

    const totalAmount = verifiedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // ── Fetch shop settings for shipping + VAT ──
    let shopSettings = await prisma.shopSettings.findUnique({ where: { id: "default" } });
    if (!shopSettings) {
      shopSettings = await prisma.shopSettings.create({
        data: { id: "default", shippingPrice: 8.9, freeShippingThreshold: 150, vatPercent: 20 },
      });
    }

    const shippingAmount = (shopSettings.freeShippingThreshold > 0 && totalAmount >= shopSettings.freeShippingThreshold)
      ? 0
      : shopSettings.shippingPrice;
    const totalHT = totalAmount + shippingAmount;
    const vatAmount = parseFloat((totalHT * shopSettings.vatPercent / 100).toFixed(2));
    const totalTTC = parseFloat((totalHT + vatAmount).toFixed(2));

    // ═══ MODE TEST : pas de Stripe, commande directement validée ═══
    const testSessionId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Check if a customer is logged in
    const customer = await getCurrentCustomer();

    // Create order in DB as "paid" directly
    const order = await prisma.order.create({
      data: {
        customerEmail,
        customerName: `${customerFirstName} ${customerLastName}`,
        customerFirstName,
        customerLastName,
        customerPhone,
        customerCompany: customerCompany || "",
        customerAddress,
        customerPostalCode,
        customerCity,
        customerId: customer?.id ?? null,
        stripeSessionId: testSessionId,
        paymentStatus: "paid",
        orderStatus: "received",
        totalAmount: totalTTC,
        shippingAmount,
        vatAmount,
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            sizeLabel: item.sizeLabel,
            fileName: item.fileName,
            filePath: item.filePath,
          })),
        },
      },
    });

    console.log(`[TEST MODE] Order created: ${order.id} — ${testSessionId}`);

    // Return success URL directly instead of Stripe checkout URL
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id=${testSessionId}`;
    return NextResponse.json({ url: successUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
