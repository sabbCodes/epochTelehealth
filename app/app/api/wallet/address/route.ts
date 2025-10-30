import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

const circleUserSdk = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const userId = email;

    // Create user token
    let userTokenRes;
    try {
      userTokenRes = await circleUserSdk.createUserToken({ userId });
    } catch (err) {
      console.error("Error in createUserToken", err);
      throw err;
    }
    const userToken = userTokenRes?.data?.userToken;
    if (!userToken) {
      return NextResponse.json(
        { error: "Failed to get userToken from Circle" },
        { status: 500 }
      );
    }

    // List wallets to get the SOL-DEVNET wallet address (poll until available)
    let walletAddress = null;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const walletsRes = await circleUserSdk.listWallets({ userToken });
        const wallets = walletsRes?.data?.wallets || [];
        const solWallet = wallets.find(
          (w: { blockchain?: string; address?: string }) =>
            w.blockchain === "SOL-DEVNET" && w.address
        );
        if (solWallet?.address) {
          walletAddress = solWallet.address;
          break;
        }
      } catch (err) {
        console.error("Error in listWallets (attempt " + attempt + ")", err);
      }
      // Wait 1 second before next attempt
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Failed to retrieve wallet address" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      walletAddress,
    });
  } catch (error: unknown) {
    let message = "";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = JSON.stringify(error);
    }
    console.error("/api/wallet/address error:", error);
    return NextResponse.json(
      { error: message || "Failed to get wallet address" },
      { status: 500 }
    );
  }
}
