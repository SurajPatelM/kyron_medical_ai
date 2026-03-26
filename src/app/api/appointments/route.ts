import { NextResponse } from "next/server";
import { getAppointments } from "@/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const list = getAppointments();
    return NextResponse.json(
      { appointments: list },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (e) {
    console.error("GET /api/appointments:", e);
    return NextResponse.json(
      { error: "Could not load appointments" },
      { status: 500 }
    );
  }
}
