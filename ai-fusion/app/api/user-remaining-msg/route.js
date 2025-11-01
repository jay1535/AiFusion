import { aj } from "@/config/Arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  const user = await currentUser();
  const { token } = await req.json();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.primaryEmailAddress?.emailAddress || user.id;

  try {
    // 🔹 Deduct token if request includes token
    if (token) {
      const decision = await aj.protect(req, { userId, requested: token });

      if (decision.isDenied()) {
        console.log("🟥 Arcjet Denied:", decision.reason);
        return NextResponse.json(
          { error: "Insufficient tokens", remainingToken: 0 },
          { status: 403 }
        );
      }

      console.log("🟩 Token used. Remaining:", decision.reason.remaining);
      return NextResponse.json({
        allowed: true,
        remainingToken: decision.reason.remaining,
      });
    }

    // 🔹 Only check remaining tokens
    const decision = await aj.protect(req, { userId, requested: 0 });
    const remainingToken = decision.reason.remaining || 0;
    console.log("ℹ️ Remaining tokens:", remainingToken);

    return NextResponse.json({ remainingToken });
  } catch (err) {
    console.error("🔥 API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
