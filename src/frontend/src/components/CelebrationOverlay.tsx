import { useCallback, useEffect, useRef, useState } from "react";

// ─── Messages ────────────────────────────────────────────────────────────────
export const CORRECT_MESSAGES = [
  "Amazing work! You're unstoppable! 🌟",
  "Brilliant! Keep it up! 🚀",
  "You nailed it! One step closer to mastery! ⭐",
  "Fantastic! You're on fire! 🔥",
  "Outstanding! You're a star! 🌟",
  "Superb! Your brain is growing! 🧠",
  "Incredible! You make learning look easy! 💫",
];

export const WRONG_MESSAGES = [
  "Don't give up — every mistake teaches you something! 💪",
  "So close! Give it another shot! 🎯",
  "You've got this! Try again! 💡",
  "Keep going — great minds don't quit! 🧠",
  "Almost there! Believe in yourself! 🌈",
  "Mistakes are proof you're trying! Keep going! ✨",
  "Every expert was once a beginner! 🌱",
];

export const COMPLETE_MESSAGES = [
  "Activity complete! You're crushing it! 🎉",
  "Well done! You finished like a champion! 🏆",
  "Lesson mastered! You're on your way to the top! 🚀",
  "You did it! Keep building those skills! 💪",
  "Completed! Every step counts — keep going! ⭐",
];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCelebration() {
  const [state, setState] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCelebration = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ visible: true, message });
    timerRef.current = setTimeout(() => {
      setState({ visible: false, message: "" });
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { celebration: state, triggerCelebration };
}

// ─── Particle types ───────────────────────────────────────────────────────────
const COLORS = [
  "#FF6B6B",
  "#FFE66D",
  "#4ECDC4",
  "#45B7D1",
  "#FF8E53",
  "#A8E6CF",
  "#FF8B94",
  "#B4F8C8",
  "#FBE7C6",
  "#A0C4FF",
  "#BDB2FF",
  "#FFADAD",
];

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  drot: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "star";
  opacity: number;
}

function createParticles(w: number, h: number): Particle[] {
  return Array.from({ length: 160 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.6 - h * 0.1,
    dx: (Math.random() - 0.5) * 6,
    dy: Math.random() * -8 - 2,
    rot: Math.random() * 360,
    drot: (Math.random() - 0.5) * 8,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
    opacity: 1,
  }));
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI / 2.5) * i - Math.PI / 2;
    const innerAngle = angle + Math.PI / 5;
    ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    ctx.lineTo(
      x + (r / 2) * Math.cos(innerAngle),
      y + (r / 2) * Math.sin(innerAngle),
    );
  }
  ctx.closePath();
  ctx.fill();
}

// ─── CelebrationOverlay ───────────────────────────────────────────────────────
export function CelebrationOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = createParticles(canvas.width, canvas.height);
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - (startTimeRef.current ?? now);
      if (elapsed > 3000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(
        (p) => p.y < canvas.height + 20,
      );

      for (const p of particlesRef.current) {
        p.dy += 0.18; // gravity
        p.x += p.dx;
        p.y += p.dy;
        p.rot += p.drot;
        p.opacity = Math.max(0, 1 - elapsed / 3000);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [visible]);

  if (!visible) return null;

  const balloons = ["🎈", "🎉", "🎊", "🎈", "🎊", "🎉", "🎈"];

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Canvas confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating balloons */}
      {balloons.map((b, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list
          key={i}
          className="absolute text-5xl balloon-float"
          style={{
            left: `${8 + i * 13}%`,
            bottom: "-60px",
            animationDelay: `${i * 0.18}s`,
            animationDuration: `${2.2 + i * 0.15}s`,
          }}
        >
          {b}
        </span>
      ))}

      {/* Firework bursts */}
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list
          key={i}
          className="absolute firework-burst"
          style={{
            left: `${10 + i * 16}%`,
            top: `${15 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.22}s`,
          }}
        />
      ))}

      {/* Central message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="celebration-message px-8 py-5 rounded-3xl text-center max-w-md mx-4"
          style={{
            background: "rgba(255,255,255,0.92)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.18), 0 0 0 4px rgba(255,200,0,0.4)",
          }}
        >
          <p
            className="text-2xl font-bold leading-snug"
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: "#1a1a2e",
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
