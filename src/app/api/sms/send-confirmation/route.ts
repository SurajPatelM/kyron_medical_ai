import { NextRequest, NextResponse } from "next/server";
import type { Appointment } from "@/types";
import { sendAppointmentSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointment = body?.appointment as Appointment | undefined;
    if (!appointment?.patient?.phone) {
      return NextResponse.json(
        { error: "appointment with patient phone required" },
        { status: 400 }
      );
    }

    const ok = await sendAppointmentSms(appointment);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "SMS could not be sent" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("sms send-confirmation:", e);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
