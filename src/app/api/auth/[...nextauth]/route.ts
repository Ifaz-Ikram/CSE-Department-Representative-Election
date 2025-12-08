import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const handler = NextAuth(authOptions);

// Rate-limited wrapper for POST (sign-in attempts)
async function rateLimitedPOST(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
    const rateLimitResponse = await rateLimit(req, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    return handler(req, context);
}

export { handler as GET };
export { rateLimitedPOST as POST };
