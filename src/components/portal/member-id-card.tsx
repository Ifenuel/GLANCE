"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import emblem from "@/assets/glance-emblem.png";
import { GlanceLogo } from "@/components/glance-logo";

export type IdCardMember = {
  fullName: string;
  memberCode: string;
  institution: string;
  chapterName: string;
  chapterCode: string;
  department: string | null;
  levelLabel: string | null;
  position: string | null;
  categoryLabel: string;
  avatarUrl: string | null;
  registeredLabel: string;
  matricNo?: string | null;
  gender?: string | null;
  origin: string;
};

export function MemberIdCard({ member }: { member: IdCardMember }) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"idle" | "png" | "print">("idle");

  const verifyUrl = `${member.origin}/verify/${encodeURIComponent(member.memberCode)}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 400,
      color: { dark: "#06142e", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [verifyUrl]);

  async function downloadPng(which: "front" | "back") {
    const node = which === "front" ? frontRef.current : backRef.current;
    if (!node) return;
    setBusy("png");
    try {
      const dataUrl = await toPng(node, { pixelRatio: 3, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `glance-id-${member.memberCode}-${which}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      window.print();
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards Container */}
      <div className="flex flex-wrap items-center justify-center gap-8 print:block">
        {/* Front of Card */}
        <div className="space-y-3">
          <span className="block text-center text-xs font-bold uppercase tracking-wider text-ink-400 print:hidden">
            Front View
          </span>
          <div
            ref={frontRef}
            className="relative flex h-[480px] w-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-navy-100 bg-white p-6 shadow-xl"
          >
            {/* Top Bar with Logo */}
            <div>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <GlanceLogo variant="dark" className="h-7" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                  Member ID
                </span>
              </div>

              {/* Photo Area */}
              <div className="mt-5 flex justify-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-gold-400 shadow-sm bg-navy-50">
                  {member.avatarUrl ? (
                    <Image src={member.avatarUrl} alt={member.fullName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-navy-900 text-2xl font-bold text-white">
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Member Details */}
              <div className="mt-4 text-center">
                <h3 className="text-base font-extrabold text-navy-950 leading-tight">
                  {member.fullName}
                </h3>
                <span className="inline-block mt-1 font-mono text-xs font-bold text-gold-600">
                  {member.memberCode}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-line/60 pt-3 text-[11px] text-ink-600">
                <div className="flex justify-between">
                  <span className="text-ink-400">Department:</span>
                  <span className="font-semibold text-navy-900">{member.department || "General Member"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Level:</span>
                  <span className="font-semibold text-navy-900">{member.levelLabel || "Standard"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Institution:</span>
                  <span className="font-semibold text-navy-900 truncate max-w-[170px]">{member.institution}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Band */}
            <div className="mt-4 rounded-xl bg-navy-950 py-2 px-3 text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
                {member.chapterName} • {member.chapterCode}
              </p>
            </div>
          </div>

          <div className="text-center print:hidden">
            <button
              onClick={() => downloadPng("front")}
              disabled={busy !== "idle"}
              className="rounded-lg border border-line bg-white px-4 py-1.5 text-xs font-bold text-navy-900 shadow-sm hover:bg-navy-50"
            >
              Download Front PNG
            </button>
          </div>
        </div>

        {/* Back of Card */}
        <div className="space-y-3">
          <span className="block text-center text-xs font-bold uppercase tracking-wider text-ink-400 print:hidden">
            Back View
          </span>
          <div
            ref={backRef}
            className="relative flex h-[480px] w-[300px] flex-col justify-between overflow-hidden rounded-2xl bg-[#06142e] p-6 text-white shadow-xl"
          >
            {/* Top Motto */}
            <div className="text-center border-b border-white/10 pb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gold-400">
                GLANCE Civic Network
              </p>
              <h4 className="mt-1 text-xs font-bold text-white/90">
                Empowering Young Leaders, Building A Better Future.
              </h4>
            </div>

            {/* Scannable QR Code */}
            <div className="my-auto flex flex-col items-center justify-center text-center">
              <div className="rounded-xl bg-white p-2.5 shadow-md">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verify Member QR" className="h-32 w-32" />
                ) : (
                  <div className="h-32 w-32 bg-gray-100" />
                )}
              </div>
              <p className="mt-3 font-mono text-[11px] font-bold text-gold-400">
                {member.memberCode}
              </p>
            </div>

            {/* Official Verification Statement */}
            <div className="border-t border-white/10 pt-3 text-center text-[10px] text-white/60 space-y-1">
              <p>
                This ID card is the official property of GLANCE. For verification, scan the QR Code or visit:
              </p>
              <p className="font-semibold text-white/80">glance.org.ng/verify</p>
              <p className="text-[9px] text-white/40 pt-1">Contact: info@glance.org.ng</p>
            </div>
          </div>

          <div className="text-center print:hidden">
            <button
              onClick={() => downloadPng("back")}
              disabled={busy !== "idle"}
              className="rounded-lg border border-line bg-white px-4 py-1.5 text-xs font-bold text-navy-900 shadow-sm hover:bg-navy-50"
            >
              Download Back PNG
            </button>
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex justify-center gap-4 border-t border-line pt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-navy-950 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-navy-900"
        >
          Print ID Card (PDF / Print-Ready)
        </button>
      </div>
    </div>
  );
}
