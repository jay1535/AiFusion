import { aj } from "@/config/Arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // ✅ Get current logged-in user from Clerk
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // ✅ Call Arcjet protection for this user
    const decision = await aj.protect(req, {
      userId: user.primaryEmailAddress.emailAddress,
      requested: 0, // You can change this if you want to check quota for N requests
    });

    // 🪵 Log full decision object to inspect structure
    console.log("Full Arcjet decision object:", JSON.stringify(decision, null, 2));

    // 🧠 Try to get remaining tokens safely
    const remainingToken =
      decision?.reason?.remaining ??
      decision?.remaining ??
      decision?.limits?.remaining ??
      0;

    console.log("Remaining tokens:", remainingToken);

    // ✅ Return the value to frontend
    return NextResponse.json({ remainingToken });
  } catch (error) {
    console.error("Error in /api/user-remaining-msg:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
