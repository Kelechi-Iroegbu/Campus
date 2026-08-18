// One-off script to expose the local Expo dev server via ngrok's Node SDK
// (native addon, not a standalone ngrok.exe) so Clerk webhooks can reach it.
//
// Usage: NGROK_AUTHTOKEN=xxxx node scripts/tunnel.js [port]

const ngrok = require("@ngrok/ngrok");

const port = process.argv[2] || 8082;

(async function main() {
  const listener = await ngrok.forward({
    addr: port,
    authtoken: process.env.NGROK_AUTHTOKEN,
    domain: "spotter-morally-overbuilt.ngrok-free.dev",
  });

  console.log(`Tunnel is live: ${listener.url()} -> http://localhost:${port}`);
  console.log("Press Ctrl+C to stop.");

  // The native listener runs on its own background thread, invisible to
  // Node's event loop, so nothing else keeps the process alive without this.
  setInterval(() => {}, 1 << 30);
})().catch((err) => {
  console.error("Failed to start tunnel:", err);
  process.exit(1);
});
