/**
 * Miro Integration Debug Utilities
 * Copy and paste these functions into your browser console to debug Miro integration
 */

// Test 1: Check if Miro SDK is accessible
function testMiroSDKAccess() {
  console.log("=== Testing Miro SDK Access ===");
  console.log("window.miro:", typeof window.miro);
  console.log("window.miroBoardsPicker:", typeof window.miroBoardsPicker);

  if (window.miro) {
    console.log("✅ window.miro is available");
  }
  if (window.miroBoardsPicker) {
    console.log("✅ window.miroBoardsPicker is available");
  }
  if (!window.miro && !window.miroBoardsPicker) {
    console.log("❌ Neither Miro SDK is loaded");
  }
}

// Test 2: Manually load Miro SDK
function loadMiroSDK() {
  console.log("=== Loading Miro SDK Manually ===");

  const script = document.createElement("script");
  script.src = "https://miro.com/app/static/sdk/v2/miro.js";
  script.async = true;

  script.onload = () => {
    console.log("✅ Primary SDK loaded successfully");
    console.log("window.miro available:", !!window.miro);
  };

  script.onerror = () => {
    console.warn("⚠️ Primary SDK failed, trying alternative...");
    script.src = "https://miro.com/app/static/boardsPicker.js";
    script.onerror = () => {
      console.error("❌ Both Miro SDK URLs failed to load");
    };
    document.head.appendChild(script);
    return;
  };

  document.head.appendChild(script);
}

// Test 3: Test token endpoint
async function testTokenEndpoint() {
  console.log("=== Testing Token Endpoint ===");
  try {
    const response = await fetch("/api/miro-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    console.log("Status:", response.status);
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Token endpoint works!");
      console.log("Token length:", data.token.length);
      console.log("Expires in:", data.expiresIn, "seconds");
      return data.token;
    } else {
      console.error("❌ Token endpoint error:", data);
    }
  } catch (error) {
    console.error("❌ Failed to fetch token:", error);
  }
}

// Test 4: Check environment variables
function checkEnvVars() {
  console.log("=== Checking Environment Variables ===");

  // Note: This will be undefined in browser console, but will work in component
  console.log(
    "NEXT_PUBLIC_MIRO_CLIENT_ID:",
    process.env.NEXT_PUBLIC_MIRO_CLIENT_ID
  );

  // Instead, we can check if it's available via the component
  console.log(
    "💡 Tip: Run testMiroIntegration() in the video call page for full testing"
  );
}

// Test 5: Complete integration test
async function testMiroIntegration() {
  console.log("=== Complete Miro Integration Test ===");

  // Step 1: Check SDK
  console.log("\n1️⃣ Checking SDK...");
  testMiroSDKAccess();

  // Step 2: Test token
  console.log("\n2️⃣ Testing token endpoint...");
  const token = await testTokenEndpoint();

  if (!token) {
    console.error("❌ Cannot proceed: Token endpoint failed");
    return;
  }

  // Step 3: Load SDK if needed
  if (!window.miroBoardsPicker) {
    console.log("\n3️⃣ Loading Miro SDK...");
    loadMiroSDK();

    // Wait for SDK to load
    console.log("⏳ Waiting for SDK to load...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Step 4: Check again
  console.log("\n4️⃣ Checking SDK again...");
  if (window.miroBoardsPicker) {
    console.log("✅ Miro SDK is ready to use!");
  } else {
    console.error("❌ Miro SDK still not available after 3 seconds");
  }
}

// Test 6: Open Miro BoardsPicker
async function openMiroTest() {
  console.log("=== Opening Miro BoardsPicker ===");

  if (!window.miroBoardsPicker) {
    console.error("❌ Miro SDK not loaded. Run testMiroIntegration() first");
    return;
  }

  try {
    const tokenResponse = await fetch("/api/miro-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const { token } = await tokenResponse.json();

    window.miroBoardsPicker.open({
      clientId: process.env.NEXT_PUBLIC_MIRO_CLIENT_ID,
      action: "access-link",
      allowCreateAnonymousBoards: true,
      getToken: () => Promise.resolve(token),
      success: (data) => {
        console.log("✅ Board selected:", data);
      },
      error: (error) => {
        console.error("❌ Miro error:", error);
      },
      cancel: () => {
        console.log("⏹️ Picker cancelled");
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Test 7: Check CORS
function testCORS() {
  console.log("=== Testing CORS ===");

  fetch("https://miro.com/app/static/boardsPicker.js", {
    method: "HEAD",
  })
    .then((r) => {
      console.log("✅ CORS check passed");
      console.log("Status:", r.status);
      console.log("Headers:");
      r.headers.forEach((value, name) => {
        if (name.includes("access-control")) {
          console.log(`  ${name}: ${value}`);
        }
      });
    })
    .catch((e) => {
      console.error("❌ CORS check failed:", e);
    });
}

// Export for use
console.log(`
╔══════════════════════════════════════════════════════════════╗
║            Miro Integration Debug Utilities                  ║
╚══════════════════════════════════════════════════════════════╝

Available functions:
  testMiroSDKAccess()      - Check if Miro SDKs are loaded
  loadMiroSDK()            - Manually load Miro SDK
  testTokenEndpoint()      - Test JWT token generation
  checkEnvVars()           - Check environment variables
  testMiroIntegration()    - Run complete integration test
  openMiroTest()           - Try to open Miro BoardsPicker
  testCORS()               - Check CORS headers

Quick start:
  1. testMiroIntegration() - Runs diagnostic test
  2. openMiroTest()        - If #1 passes, try opening picker

If SDK fails to load, check:
  - https://developers.miro.com/docs/web-sdk-boards-picker
  - https://status.miro.com/
`);
