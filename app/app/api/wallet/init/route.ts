import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

const circleUserSdk = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
});

function isCircle409Error(err: unknown): boolean {
  const response = (err as { response?: { status?: unknown } }).response;
  return Boolean(
    typeof err === "object" &&
      err !== null &&
      response &&
      typeof response === "object" &&
      "status" in response &&
      response.status === 409
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const userId = email;

    // 1. Create user (idempotent)
    try {
      await circleUserSdk.createUser({ userId });
    } catch (err: unknown) {
      console.error("Error in createUser", err);
      // If user already exists, Circle returns 409, which is fine
      if (!isCircle409Error(err)) {
        throw err;
      }
    }

    // 2. Create user token
    let userTokenRes;
    try {
      userTokenRes = await circleUserSdk.createUserToken({ userId });
    } catch (err) {
      console.error("Error in createUserToken", err);
      throw err;
    }
    const userToken = userTokenRes?.data?.userToken;
    const encryptionKey = userTokenRes?.data?.encryptionKey;
    if (!userToken) {
      return NextResponse.json(
        { error: "Failed to get userToken from Circle" },
        { status: 500 }
      );
    }

    // 3. Initialize user and wallet (EOA, SOL-DEVNET)
    let pinRes;
    try {
      pinRes = await circleUserSdk.createUserPinWithWallets({
        userToken,
        accountType: "EOA",
        blockchains: ["SOL-DEVNET"],
      });
    } catch (err: unknown) {
      // If already initialized, treat as success
      const errorWithResponse = err as {
        response?: {
          status?: number;
          data?: { code?: number };
        };
      };

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof errorWithResponse.response === "object" &&
        errorWithResponse.response?.status === 409 &&
        errorWithResponse.response?.data?.code === 155106
      ) {
        console.warn("User already initialized, proceeding to list wallets.");
        // User already has wallet, skip challengeId requirement
        pinRes = { data: { challengeId: null, isExistingUser: true } };
      } else {
        console.error("Error in createUserPinWithWallets", err);
        throw err;
      }
    }
    const challengeId = pinRes?.data?.challengeId;
    const isExistingUser = (pinRes?.data as { isExistingUser?: boolean })
      ?.isExistingUser;
    // Only require challengeId for new wallet creation
    if (!challengeId && !isExistingUser) {
      return NextResponse.json(
        { error: "Failed to get challengeId from Circle" },
        { status: 500 }
      );
    }

    // 4. List wallets to get the SOL-DEVNET wallet address (poll until available)
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

    return NextResponse.json({
      userToken,
      encryptionKey,
      challengeId,
      walletAddress,
      isExistingUser: Boolean(isExistingUser),
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
    console.error("/api/wallet/init error:", error);
    return NextResponse.json(
      { error: message || "Circle wallet setup failed" },
      { status: 500 }
    );
  }
}
