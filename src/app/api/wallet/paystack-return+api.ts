/**
 * GET /api/wallet/paystack-return?reference=...&trxref=...
 *
 * Paystack redirects the hosted-checkout browser tab here when payment
 * finishes. Custom URL schemes can't be a Paystack `callback_url` directly,
 * so this tiny page bounces the tab to the app's deep link, which
 * `WebBrowser.openAuthSessionAsync` intercepts to close the tab. The wallet
 * is credited by the webhook, not here — this is just navigation.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const reference =
    url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "";
  const deepLink = `campus://wallet/topup?reference=${encodeURIComponent(
    reference,
  )}`;

  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Returning to CampUs…</title>
<script>window.location.replace(${JSON.stringify(deepLink)});</script>
</head><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F4EEE7;color:#151515;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<p>Payment received — returning to CampUs…<br>
<a href="${deepLink}" style="color:#F0531E">Tap here if it doesn't open.</a></p>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
