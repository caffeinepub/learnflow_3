import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

const CERTS_KEY = "eduloom_earned_certs";

export interface CertData {
  studentName: string;
  courseName: string;
  courseId: string;
  earnedAt: string;
}

export function saveCertificate(data: Omit<CertData, "earnedAt">) {
  const existing = getEarnedCertificates();
  const alreadyEarned = existing.some(
    (c) => c.courseId === data.courseId && c.studentName === data.studentName,
  );
  if (alreadyEarned) return false;
  const cert: CertData = {
    ...data,
    earnedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
  localStorage.setItem(CERTS_KEY, JSON.stringify([...existing, cert]));
  return true;
}

export function getEarnedCertificates(): CertData[] {
  try {
    const s = localStorage.getItem(CERTS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function CertificateModal({
  cert,
  onClose,
}: {
  cert: CertData | null;
  onClose: () => void;
}) {
  if (!cert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(20, 10, 40, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      data-ocid="certificate.modal"
    >
      <div
        className="relative w-full max-w-xl rounded-3xl overflow-hidden"
        style={{
          background: "oklch(0.99 0.003 60)",
          boxShadow:
            "0 32px 80px oklch(0.3 0.1 290 / 0.35), 0 0 0 1px oklch(0.88 0.06 80)",
        }}
      >
        {/* Rainbow ribbon top */}
        <div
          className="w-full h-4"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.78 0.18 350) 0%, oklch(0.78 0.18 290) 20%, oklch(0.78 0.16 220) 40%, oklch(0.78 0.16 160) 60%, oklch(0.8 0.16 80) 80%, oklch(0.78 0.18 350) 100%)",
          }}
        />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: "oklch(0.93 0.02 290)",
            color: "oklch(0.4 0.06 290)",
          }}
          data-ocid="certificate.close_button"
          aria-label="Close certificate"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Parchment body */}
        <div
          className="certificate-printable px-8 pt-6 pb-4"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.97 0.04 80 / 0.4) 0%, transparent 70%)",
          }}
        >
          {/* Brand header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span
                className="font-display text-2xl font-bold tracking-wide"
                style={{ color: "oklch(0.3 0.12 290)" }}
              >
                Edu<span style={{ color: "oklch(0.62 0.18 290)" }}>Loom</span>
              </span>
            </div>
            <p
              className="text-xs font-ui mt-0.5 tracking-widest uppercase"
              style={{ color: "oklch(0.58 0.06 290)" }}
            >
              weaving learning together
            </p>
          </div>

          {/* Dotted border card — the actual certificate */}
          <div
            className="rounded-2xl p-6 text-center relative"
            style={{
              background: "oklch(0.99 0.012 80)",
              border: "2px solid oklch(0.88 0.06 80)",
              backgroundImage:
                "radial-gradient(oklch(0.88 0.04 80) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Inner white overlay so dots fade at edges */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, oklch(0.99 0.01 60 / 0.92) 30%, oklch(0.99 0.01 60 / 0.6) 100%)",
              }}
            />
            <div className="relative z-10 space-y-3">
              {/* Ornamental heading */}
              <div className="space-y-1">
                <p
                  className="font-ui text-xs uppercase tracking-[0.25em] font-semibold"
                  style={{ color: "oklch(0.65 0.1 80)" }}
                >
                  ✦ Certificate of Completion ✦
                </p>
                <div
                  className="w-20 h-px mx-auto"
                  style={{ background: "oklch(0.8 0.1 80)" }}
                />
              </div>

              <p
                className="font-ui text-sm"
                style={{ color: "oklch(0.5 0.04 290)" }}
              >
                This is to certify that
              </p>

              {/* Student name — the hero moment */}
              <div className="py-3">
                <p
                  className="font-display leading-tight"
                  style={{
                    fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                    fontWeight: 800,
                    color: "oklch(0.28 0.16 290)",
                    letterSpacing: "-0.02em",
                    textShadow: "0 2px 12px oklch(0.62 0.16 290 / 0.18)",
                  }}
                >
                  {cert.studentName}
                </p>
                <div
                  className="h-1 w-16 rounded-full mx-auto mt-2"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.72 0.18 290), oklch(0.75 0.16 220))",
                  }}
                />
              </div>

              <p
                className="font-ui text-sm"
                style={{ color: "oklch(0.5 0.04 290)" }}
              >
                has successfully completed
              </p>

              {/* Course name */}
              <div
                className="py-2 px-5 rounded-xl inline-block"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.93 0.07 160), oklch(0.93 0.06 220))",
                  border: "1px solid oklch(0.82 0.1 160)",
                }}
              >
                <p
                  className="font-display text-lg font-bold"
                  style={{ color: "oklch(0.28 0.14 160)" }}
                >
                  {cert.courseName}
                </p>
              </div>

              {/* CSS Seal */}
              <div className="flex justify-center pt-1">
                <div
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
                  style={{
                    background:
                      "conic-gradient(from 0deg, oklch(0.82 0.18 80), oklch(0.88 0.16 60), oklch(0.82 0.18 80), oklch(0.88 0.16 100), oklch(0.82 0.18 80))",
                    boxShadow:
                      "0 0 0 3px oklch(0.75 0.16 80), 0 4px 16px oklch(0.65 0.14 80 / 0.4)",
                  }}
                >
                  <span className="text-2xl">🏆</span>
                  <span
                    className="text-xs font-ui font-bold"
                    style={{ color: "oklch(0.3 0.1 60)" }}
                  >
                    DONE!
                  </span>
                </div>
              </div>

              <p
                className="font-ui text-xs"
                style={{ color: "oklch(0.58 0.04 290)" }}
              >
                Completed on {cert.earnedAt}
              </p>

              <p
                className="font-ui font-semibold text-base"
                style={{ color: "oklch(0.48 0.14 52)" }}
              >
                🎉 Congratulations — you&apos;re a star learner!
              </p>
            </div>
          </div>

          {/* Celebration image */}
          <div className="flex justify-center mt-3 mb-1">
            <img
              src="/assets/generated/certificate-celebration.dim_500x400.png"
              alt="Celebration"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* Rainbow ribbon bottom */}
        <div
          className="w-full h-4"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.78 0.18 350) 0%, oklch(0.78 0.18 290) 20%, oklch(0.78 0.16 220) 40%, oklch(0.78 0.16 160) 60%, oklch(0.8 0.16 80) 80%, oklch(0.78 0.18 350) 100%)",
          }}
        />

        {/* Actions */}
        <div
          className="px-8 py-4 flex gap-3 justify-center"
          style={{ background: "oklch(0.98 0.01 290)" }}
        >
          <Button
            onClick={() => window.print()}
            className="gap-2 font-ui font-semibold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.16 290), oklch(0.65 0.14 260))",
              color: "white",
              boxShadow: "0 4px 14px oklch(0.62 0.16 290 / 0.35)",
            }}
            data-ocid="certificate.print_button"
          >
            <Printer className="h-4 w-4" /> Print Certificate
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="font-ui"
            data-ocid="certificate.cancel_button"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
