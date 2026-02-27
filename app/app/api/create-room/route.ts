import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { endDate: providedEndDate } = await request.json();

  // Check if WHEREBY_API_KEY is set
  if (!process.env.WHEREBY_API_KEY) {
    console.error("WHEREBY_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error: WHEREBY_API_KEY missing" },
      { status: 500 }
    );
  }

  try {
    // Use provided endDate (ISO string) when available, otherwise fallback to now+2h
    let endDate: Date;
    if (providedEndDate) {
      endDate = new Date(providedEndDate);
      if (isNaN(endDate.getTime())) {
        // invalid provided date, fallback
        endDate = new Date();
        endDate.setHours(endDate.getHours() + 2);
      }
    } else {
      endDate = new Date();
      endDate.setHours(endDate.getHours() + 2);
    }

    const response = await fetch("https://api.whereby.dev/v1/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endDate: endDate.toISOString(),
        roomMode: "normal",
        roomNamePrefix: "epoch",
        isLocked: false,
        fields: ["roomUrl"],
      }),
    });

  const responseText = await response.text();
  console.log("Whereby API response status:", response.status);

    if (!response.ok) {
      throw new Error(
        `Whereby API error: ${response.status} - ${responseText}`
      );
    }

    const roomData = JSON.parse(responseText);

    // Return host URL for doctors, viewer URL for patients
    const roomUrl = roomData.roomUrl;
    const meetingId = roomData.meetingId;

    return NextResponse.json({
      roomUrl: roomUrl,
      meetingId: meetingId,
    });
  } catch (error) {
    console.error("Error creating Whereby room:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create video room: ${message}` },
      { status: 500 }
    );
  }
}
