import { aj } from "@/config/Arcjet";
import { NextResponse } from "next/server";
import { isSpoofedBot } from "@arcjet/next";

export async function GET(request) {
  // Protect this endpoint using Arcjet (rate limit + bot detection)
  const userId = "user123";
  const decision = await aj.protect(request, { userId, requested: 5 }); // consume 5 tokens
  console.log("Arcjet decision:", decision);

  // Handle denials (rate limit or bot)
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too Many Requests", reason: decision.reason },
        { status: 429 }
      );
    } else if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: "No bots allowed", reason: decision.reason },
        { status: 403 }
      );
    } else {
      return NextResponse.json(
        { error: "Forbidden", reason: decision.reason },
        { status: 403 }
      );
    }
  }

  // Block hosting IPs (like proxies or cloud VMs)
 

  // ✅ Passed all checks
  return NextResponse.json({ message: "Hello world" });
}
