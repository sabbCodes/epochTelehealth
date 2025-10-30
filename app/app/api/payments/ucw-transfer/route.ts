/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";

const circleUserSdk = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
});

// Helper to find SOL(DEVNET) wallet and return its id and address
async function getSolWallet(userToken: string): Promise<{ walletId: string; address: string } | null> {
  const walletsRes = await circleUserSdk.listWallets({ userToken });
  const wallets = walletsRes?.data?.wallets || [];
  const solWallet = wallets.find((w: any) => (w.blockchain === "SOL-DEVNET" || w.blockchain === "SOLANA-DEVNET") && w.id && w.address);
  if (!solWallet) return null;
  return { walletId: solWallet.id as string, address: solWallet.address as string };
}

// Helper to find USDC tokenId in user's SOL wallet by inspecting balances
async function getUsdcTokenId(userToken: string, walletId: string): Promise<string | null> {
  try {
    // Circle docs: Step 4 suggests checking wallet balance to acquire tokenId
    // Some SDKs expose listTokenBalances; use generic method name here
    const balancesRes: any = await circleUserSdk.getWalletTokenBalance?.({ userToken, walletId });
    const balances = balancesRes?.data?.tokenBalances || balancesRes?.data?.balances || [];
    // Try to find USDC by symbol or by known mint (devnet/mainnet differ). Prefer symbol for demo.
    const usdc = balances.find((b: any) => (b?.token?.symbol === "USDC") || (b?.symbol === "USDC"));
    if (usdc?.tokenId) return usdc.tokenId as string;
    if (usdc?.token?.id) return usdc.token.id as string;
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { amount, destinationAddress, email, feeLevel } = await request.json();
    if (!amount || !destinationAddress || !email) {
      return NextResponse.json({ error: "Missing amount, destinationAddress or email" }, { status: 400 });
    }

    const userId = email as string;

    // Create user token (session)
    const userTokenRes = await circleUserSdk.createUserToken({ userId });
    const userToken = userTokenRes?.data?.userToken as string | undefined;
    const encryptionKey = userTokenRes?.data?.encryptionKey as string | undefined;
    if (!userToken) {
      return NextResponse.json({ error: "Failed to create user session with Circle" }, { status: 500 });
    }

    // Find user's SOL wallet and walletId
    const solWallet = await getSolWallet(userToken);
    if (!solWallet) {
      return NextResponse.json({ error: "User SOL wallet not found" }, { status: 400 });
    }

    // Find USDC tokenId in that wallet
    const tokenId = await getUsdcTokenId(userToken, solWallet.walletId);
    if (!tokenId) {
      return NextResponse.json({ error: "USDC tokenId not found in user's wallet" }, { status: 400 });
    }

    // Initiate transfer
    const createTxRes: any = await circleUserSdk.createTransaction({
      userToken,
      walletId: solWallet.walletId,
      tokenId,
      destinationAddress,
      amounts: [String(amount)],
      fee: {
        type: "level",
        config: { feeLevel: (feeLevel || "MEDIUM").toUpperCase() },
      },
    });

    const challengeId = createTxRes?.data?.challengeId as string | undefined;
    if (!challengeId) {
      return NextResponse.json({ error: "Failed to initiate transfer (no challengeId)" }, { status: 500 });
    }

    return NextResponse.json({ challengeId, userToken, encryptionKey });
  } catch (error: any) {
    console.error("/api/payments/ucw-transfer error:", error?.response?.data || error);
    const msg = error?.response?.data?.message || error?.message || "Transfer initiation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
