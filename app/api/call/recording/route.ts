import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Twilio 通話録音完了時のコールバック。
 * conversations.recording_url を更新し、同意取得コールの場合は users.consent_audio_url を更新する。
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  const consentFlow = searchParams.get("consentFlow") === "1";

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const recordingStatus = String(fd.get("RecordingStatus") ?? "");
  const recordingUrl = String(fd.get("RecordingUrl") ?? "");
  const callSid = String(fd.get("CallSid") ?? "");

  console.log(
    `[recording] CallSid=${callSid} status=${recordingStatus} consentFlow=${consentFlow} url=${recordingUrl ? "yes" : "no"}`,
  );

  if (!callSid || !recordingUrl || recordingStatus !== "completed") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createSupabaseAdmin();

  for (let j = 0; j < 15; j++) {
    const { data: updated, error: convErr } = await supabase
      .from("conversations")
      .update({ recording_url: recordingUrl })
      .eq("call_sid", callSid)
      .select("id");

    if (convErr) {
      console.error("[recording] conversations update error:", convErr);
      break;
    }
    if (updated && updated.length > 0) {
      break;
    }
    await sleep(2000);
  }

  if (consentFlow && userId) {
    for (let i = 0; i < 12; i++) {
      const { data: u, error: selErr } = await supabase
        .from("users")
        .select("consent_service, status")
        .eq("id", userId)
        .single();

      if (selErr) {
        console.error("[recording] user select error:", selErr);
        break;
      }

      if (u?.status === "inactive") {
        console.log("[recording] user inactive — skip consent_audio_url");
        break;
      }

      if (u?.consent_service === true) {
        const { error: upErr } = await supabase
          .from("users")
          .update({ consent_audio_url: recordingUrl })
          .eq("id", userId);

        if (upErr) {
          console.error("[recording] consent_audio_url update error:", upErr);
        } else {
          console.log("[recording] consent_audio_url set for user", userId);
        }
        break;
      }

      await sleep(2000);
    }
  }

  return NextResponse.json({ ok: true });
}
