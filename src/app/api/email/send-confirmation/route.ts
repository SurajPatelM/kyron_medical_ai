import { NextRequest, NextResponse } from "next/server";
import type { Appointment } from "@/types";
import { sendAppointmentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointment = body?.appointment as Appointment | undefined;
    if (!appointment?.patient?.email) {
      return NextResponse.json(
        { error: "appointment with patient email required" },
        { status: 400 }
      );
    }

    const ok = await sendAppointmentEmail(appointment);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Email could not be sent" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send-confirmation:", e);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
