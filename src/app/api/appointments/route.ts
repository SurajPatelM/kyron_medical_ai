import { NextResponse } from "next/server";
import { getAppointments } from "@/data/store";

export async function GET() {
  try {
    const list = getAppointments();
    return NextResponse.json({ appointments: list });
  } catch (e) {
    console.error("GET /api/appointments:", e);
    return NextResponse.json(
      { error: "Could not load appointments" },
      { status: 500 }
    );
  }
}
