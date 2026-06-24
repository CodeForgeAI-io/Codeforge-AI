import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { Subscription, User } from "@/models";
import { APP_NAME } from "@/lib/constants";

const INK = "#171717";
const MUTED = "#8f8f8f";
const BLUE = "#006bff";
const BORDER = "#e6e9ef";

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Printable HTML invoice for one paid subscription (download → print to PDF). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  await connectDB();
  const sub = await Subscription.findOne({
    _id: new Types.ObjectId(id),
    user: new Types.ObjectId(session.user.id),
    status: "paid",
  }).lean();
  if (!sub) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const user = await User.findById(session.user.id).select("name email").lean();

  const num = `CF-${String(sub._id).slice(-8).toUpperCase()}`;
  const date = new Date(sub.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const period =
    sub.periodStart && sub.periodEnd
      ? `${new Date(sub.periodStart).toLocaleDateString()} – ${new Date(sub.periodEnd).toLocaleDateString()}`
      : "—";
  const planName = sub.plan === "plus" ? "Plus" : "Go";
  const total = money(sub.amount, sub.currency || "USD");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${num}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Geist',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};background:#f4f6f9;padding:40px}
.sheet{max-width:720px;margin:0 auto;background:#fff;border:1px solid ${BORDER};border-radius:16px;padding:48px;box-shadow:0 2px 2px rgba(0,0,0,.04)}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
.brand{font-size:22px;font-weight:700;letter-spacing:-0.5px}
.brand span{color:${BLUE}}
.tag{font-size:13px;color:${MUTED};margin-top:4px}
.inv{text-align:right}
.inv h1{font-size:26px;font-weight:600;letter-spacing:-0.8px}
.inv .meta{font-size:13px;color:${MUTED};margin-top:6px;line-height:1.7}
.cols{display:flex;gap:48px;margin-bottom:36px}
.col .lbl{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${MUTED};margin-bottom:8px}
.col .v{font-size:15px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:28px}
th{text-align:left;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${MUTED};padding:0 0 12px;border-bottom:1px solid ${BORDER}}
td{padding:16px 0;border-bottom:1px solid ${BORDER};font-size:15px}
td.r,th.r{text-align:right}
.total{display:flex;justify-content:flex-end;gap:48px;font-size:18px;font-weight:600}
.paid{display:inline-block;margin-top:24px;background:#ecfdec;color:#107d32;border:1px solid #b9f5bc;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;border-radius:9999px}
.foot{margin-top:40px;font-size:12px;color:${MUTED};text-align:center}
@media print{body{background:#fff;padding:0}.sheet{border:none;box-shadow:none}}
</style></head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">CodeForge<span>AI</span></div>
        <div class="tag">codeforgeai.io</div>
      </div>
      <div class="inv">
        <h1>Invoice</h1>
        <div class="meta">${num}<br/>${date}</div>
      </div>
    </div>

    <div class="cols">
      <div class="col">
        <div class="lbl">Billed to</div>
        <div class="v">${user?.name ?? "Customer"}<br/>${user?.email ?? ""}</div>
      </div>
      <div class="col">
        <div class="lbl">From</div>
        <div class="v">${APP_NAME}<br/>codeforgeai.io</div>
      </div>
      <div class="col">
        <div class="lbl">Period</div>
        <div class="v">${period}</div>
      </div>
    </div>

    <table>
      <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
      <tbody>
        <tr><td>${planName} Plan — ${sub.billingCycle} subscription</td><td class="r">${total}</td></tr>
      </tbody>
    </table>

    <div class="total"><span>Total</span><span>${total}</span></div>
    <div class="paid">Paid</div>
    ${sub.razorpayPaymentId ? `<div class="foot">Payment reference: ${sub.razorpayPaymentId}</div>` : ""}
    <div class="foot">Thank you for your business. Questions? Reply to any CodeForge AI email.</div>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${num}.html"`,
    },
  });
}
