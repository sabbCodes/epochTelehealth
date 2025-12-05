import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * POST /api/miro-token
 *
 * Generates a JWT token for Miro BoardsPicker authentication.
 * This endpoint should be called from the frontend to get a token
 * that allows users to access Miro boards for collaboration.
 */
export async function POST(request: NextRequest) {
  try {
    // Get Miro credentials from environment variables
    const miroClientId = process.env.NEXT_PUBLIC_MIRO_CLIENT_ID;
    const miroClientSecret = process.env.MIRO_CLIENT_SECRET;

    if (!miroClientId || !miroClientSecret) {
      return NextResponse.json(
        {
          error: "Missing Miro configuration",
          message:
            "MIRO_CLIENT_ID or MIRO_CLIENT_SECRET environment variables are not set",
        },
        { status: 500 }
      );
    }

    // Generate JWT token for Miro BoardsPicker
    // The token should contain standard JWT claims
    const payload = {
      iss: miroClientId, // Issuer (Client ID)
      sub: "user-session", // Subject
      aud: "https://miro.com", // Audience
      exp: Math.floor(Date.now() / 1000) + 3600, // Expiration (1 hour)
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    // Sign the token with the client secret
    const token = jwt.sign(payload, miroClientSecret, {
      algorithm: "HS256",
    });

    // Return the token
    return NextResponse.json(
      {
        token,
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error generating Miro token:", error);

    return NextResponse.json(
      {
        error: "Failed to generate Miro token",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
