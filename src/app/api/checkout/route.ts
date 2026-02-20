import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { getUnitPrice, type PriceTier } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

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

    // ═══ Create Stripe Checkout Session ═══
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build Stripe line items
    const lineItems: Array<{
      price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
      quantity: number;
    }> = [];

    for (const item of verifiedItems) {
      const product = productMap.get(item.productId);
      const isDecimal = item.quantity !== Math.floor(item.quantity);

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: product?.name || "Transfert DTF",
            ...(item.sizeLabel ? { description: `Format: ${item.sizeLabel}` } : {}),
          },
          // For decimal quantities (metre): charge total as 1 unit
          unit_amount: isDecimal
            ? Math.round(item.totalPrice * 100)
            : Math.round(item.unitPrice * 100),
        },
        quantity: isDecimal ? 1 : Math.round(item.quantity),
      });
    }

    // Shipping
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: Math.round(shippingAmount * 100),
        },
        quantity: 1,
      });
    }

    // VAT
    if (vatAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: `TVA (${shopSettings.vatPercent}%)` },
          unit_amount: Math.round(vatAmount * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    // Check if a customer is logged in
    const customer = await getCurrentCustomer();

    // Create order in DB with pending payment status
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
        stripeSessionId: session.id,
        paymentStatus: "pending",
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

    console.log(`Order created: ${order.id} — Stripe session: ${session.id}`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
