import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
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

    const totalAmount = items.reduce(
      (sum: number, item: CheckoutItem) => sum + item.totalPrice,
      0
    );

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
        totalAmount,
        items: {
          create: items.map((item: CheckoutItem) => ({
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
