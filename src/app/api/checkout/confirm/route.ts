import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// GET /api/checkout/confirm?session_id=cs_xxx
// Called by the success page to verify payment and mark order as paid
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ paid: false, error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Mark order as paid in DB
      await prisma.order.updateMany({
        where: { stripeSessionId: sessionId },
        data: { paymentStatus: "paid" },
      });

      console.log(`Payment confirmed for session: ${sessionId}`);
      return NextResponse.json({ paid: true });
    }

    return NextResponse.json({ paid: false, status: session.payment_status });
  } catch (error) {
    console.error("Confirm checkout error:", error);
    return NextResponse.json({ paid: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
