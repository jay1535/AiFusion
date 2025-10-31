import { aj } from "@/config/Arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ remainingToken: 0 }, { status: 401 });
    }

    const { token } = await req.json();

    // Arcjet request
    const decision = await aj.protect(req, {
      userId: user.primaryEmailAddress.emailAddress,
      requested: token || 0,
    });

    if (token && decision.isDenied()) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 403 });
    }

    const remainingToken = decision.reason.remaining || 0;
    return NextResponse.json({ remainingToken });
  } catch (err) {
    console.error("🔥 /api/user-remaining-msg error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
