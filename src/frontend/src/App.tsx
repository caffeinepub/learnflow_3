import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  CourseWithStats,
  DiscussionPost,
  LeaderboardEntry,
  Lesson,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionForStudent,
  StudentProgress,
} from "./backend.d";
import {
  COMPLETE_MESSAGES,
  CORRECT_MESSAGES,
  CelebrationOverlay,
  WRONG_MESSAGES,
  pickRandom,
  useCelebration,
} from "./components/CelebrationOverlay";
import {
  CertificateModal,
  getEarnedCertificates,
  saveCertificate,
} from "./components/CertificateModal";
import { useActor } from "./hooks/useActor";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Edit3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  User,
  Users,
} from "lucide-react";

const STUDENT_NAME_KEY = "eduloom_student_name";
const PROFILE_KEY = "eduloom_student_profile";
const ROSTER_KEY = "eduloom_student_roster";
const TEACHER_EMAIL_KEY = "eduloom_teacher_email";

const DEFAULT_STUDENTS = [
  { id: "1", registerNo: "128139017", name: "VINAYA K V", email: "" },
  { id: "2", registerNo: "128139015", name: "THEERTHA PRAJITH", email: "" },
  { id: "3", registerNo: "128139014", name: "SRIHARINI G", email: "" },
  { id: "4", registerNo: "128139013", name: "SHIVANI G N", email: "" },
  { id: "5", registerNo: "128139012", name: "SHAKTHI G", email: "" },
  { id: "6", registerNo: "128139011", name: "SWETHA S", email: "" },
  { id: "7", registerNo: "128139010", name: "RUTHRA MEENA S", email: "" },
  { id: "8", registerNo: "128139009", name: "RAJALAKSHMI A P", email: "" },
  { id: "9", registerNo: "128139008", name: "MAHALAXMI M", email: "" },
  { id: "10", registerNo: "128139006", name: "DHIVYADHARSHINI M", email: "" },
  { id: "11", registerNo: "128139005", name: "KOWSALYA K", email: "" },
  { id: "12", registerNo: "128139004", name: "KIRUSHTHIKA K", email: "" },
  { id: "13", registerNo: "128139003", name: "MITHILA K R", email: "" },
  { id: "14", registerNo: "128139002", name: "JESMINA BANU J", email: "" },
  { id: "15", registerNo: "128139001", name: "GEETHA R", email: "" },
  { id: "16", registerNo: "127139011", name: "KURAL OLY T", email: "" },
];

interface RosterStudent {
  id: string;
  registerNo: string;
  name: string;
  email: string;
}

function getRoster(): RosterStudent[] {
  try {
    const s = localStorage.getItem(ROSTER_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT_STUDENTS;
}

function saveRoster(roster: RosterStudent[]): void {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

interface StudentProfile {
  name: string;
  email: string;
  registerNumber: string;
  year: string;
  semester: string;
  subjectDomain: string;
  programme: string;
  weeklyGoal: string;
  avatarColor: string;
  avatarInitials: string;
}

const AVATAR_COLORS = [
  "oklch(0.55 0.18 240)",
  "oklch(0.55 0.18 160)",
  "oklch(0.55 0.18 52)",
  "oklch(0.55 0.18 300)",
  "oklch(0.55 0.18 10)",
  "oklch(0.55 0.18 200)",
  "oklch(0.55 0.18 120)",
  "oklch(0.55 0.18 330)",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type StudentView =
  | { page: "dashboard" }
  | { page: "explore" }
  | { page: "profile" }
  | { page: "course"; courseId: bigint }
  | { page: "lesson"; lessonId: bigint; courseId: bigint };

type TeacherView =
  | { page: "dashboard" }
  | { page: "materials" }
  | { page: "students" }
  | { page: "course-editor"; courseId: bigint }
  | { page: "lesson-editor"; lessonId: bigint; courseId: bigint }
  | { page: "create-course" };

type ConsoleMode = "entry" | "student" | "teacher";

export default function App() {
  const { actor } = useActor();
  const [mode, setMode] = useState<ConsoleMode>("entry");
  const [studentName, setStudentName] = useState<string>("");

  function enterAsStudent(name: string) {
    localStorage.setItem(STUDENT_NAME_KEY, name);
    setStudentName(name);
    setMode("student");
  }

  function enterAsTeacher() {
    setMode("teacher");
  }

  function exitToEntry() {
    setMode("entry");
  }

  return (
    <>
      <Toaster />
      {mode === "entry" && (
        <EntryScreen
          onEnterStudent={enterAsStudent}
          onEnterTeacher={enterAsTeacher}
        />
      )}
      {mode === "student" && (
        <StudentConsole
          actor={actor}
          studentName={studentName}
          onExit={exitToEntry}
        />
      )}
      {mode === "teacher" && (
        <TeacherConsole actor={actor} onLogout={exitToEntry} />
      )}
    </>
  );
}

// ─── Entry Screen ─────────────────────────────────────────────────────────────
function EntryScreen({
  onEnterStudent,
  onEnterTeacher,
}: {
  onEnterStudent: (name: string) => void;
  onEnterTeacher: () => void;
}) {
  const [step, setStep] = useState<"pick" | "name" | "teacher-login">("pick");
  const [name, setName] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherError, setTeacherError] = useState(false);

  function handleStudentContinue() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    onEnterStudent(name.trim());
  }

  function handleTeacherLogin() {
    if (teacherPassword === "teacher123") {
      onEnterTeacher();
    } else {
      setTeacherError(true);
      toast.error("Incorrect password");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center page-gradient-entry px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: "oklch(0.62 0.14 52 / 0.07)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-fade-up">
        {/* Hero image — large and proud */}
        <div className="flex justify-center mb-6">
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "oklch(0.96 0.04 290)",
              padding: "6px",
              boxShadow:
                "0 20px 60px oklch(0.55 0.14 290 / 0.25), 0 0 0 1px oklch(0.85 0.08 290)",
            }}
          >
            <img
              src="/assets/generated/classroom-hero.dim_800x500.png"
              alt="EduLoom classroom"
              className="w-full max-w-md h-auto object-contain rounded-2xl block"
            />
            {/* Floating badge */}
            <div
              className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-ui font-semibold flex items-center gap-1.5 shadow-md"
              style={{
                background: "oklch(0.99 0.01 290)",
                color: "oklch(0.38 0.14 290)",
                border: "1px solid oklch(0.85 0.08 290)",
              }}
            >
              <Sparkles className="h-3 w-3" /> Self-paced · Interactive · Fun
            </div>
          </div>
        </div>

        {/* Brand heading */}
        <div className="text-center mb-8">
          <h1
            className="font-display font-bold tracking-tight leading-none mb-2"
            style={{ fontSize: "clamp(2.8rem, 8vw, 4.5rem)" }}
          >
            <span style={{ color: "oklch(0.3 0.14 290)" }}>Edu</span>
            <span
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.18 290), oklch(0.65 0.16 220))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Loom
            </span>
          </h1>
          <p
            className="font-ui text-base"
            style={{ color: "oklch(0.5 0.06 290)" }}
          >
            weaving learning together — a self-paced learning companion
          </p>
        </div>

        {step === "pick" ? (
          <div className="space-y-3">
            <p
              className="text-center text-xs font-ui font-semibold uppercase tracking-widest mb-4"
              style={{ color: "oklch(0.58 0.08 290)" }}
            >
              How would you like to continue?
            </p>

            {/* Student card */}
            <button
              type="button"
              onClick={() => setStep("name")}
              className="w-full group text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.96 0.06 290) 0%, oklch(0.95 0.05 260) 100%)",
                borderColor: "oklch(0.83 0.1 290)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 12px 32px oklch(0.62 0.16 290 / 0.28)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.62 0.16 290)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.83 0.1 290)";
              }}
              data-ocid="entry.student.button"
            >
              <div className="flex items-center gap-5 p-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-3xl shadow-inner"
                  style={{ background: "oklch(0.92 0.1 290)" }}
                >
                  🎒
                </div>
                <div className="flex-1">
                  <div
                    className="font-display font-bold text-xl"
                    style={{ color: "oklch(0.28 0.14 290)" }}
                  >
                    I&apos;m a Student
                  </div>
                  <div
                    className="text-sm font-ui mt-0.5"
                    style={{ color: "oklch(0.5 0.06 290)" }}
                  >
                    Explore courses · Take quizzes · Earn certificates
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "oklch(0.62 0.16 290)", color: "white" }}
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </div>
              </div>
            </button>

            {/* Teacher card */}
            <button
              type="button"
              onClick={() => setStep("teacher-login")}
              className="w-full group text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.96 0.06 52) 0%, oklch(0.95 0.05 30) 100%)",
                borderColor: "oklch(0.83 0.09 52)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 12px 32px oklch(0.65 0.14 52 / 0.28)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.62 0.14 52)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.83 0.09 52)";
              }}
              data-ocid="entry.teacher.button"
            >
              <div className="flex items-center gap-5 p-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-3xl shadow-inner"
                  style={{ background: "oklch(0.92 0.09 52)" }}
                >
                  📚
                </div>
                <div className="flex-1">
                  <div
                    className="font-display font-bold text-xl"
                    style={{ color: "oklch(0.28 0.1 52)" }}
                  >
                    I&apos;m a Teacher
                  </div>
                  <div
                    className="text-sm font-ui mt-0.5"
                    style={{ color: "oklch(0.5 0.06 52)" }}
                  >
                    Create courses · Upload materials · Track progress
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "oklch(0.62 0.14 52)", color: "white" }}
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </div>
              </div>
            </button>
          </div>
        ) : step === "name" ? (
          <div className="bg-card rounded-2xl border-2 border-border p-6 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="entry.back.button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-display text-xl font-bold">
                Welcome, student!
              </h2>
            </div>
            <div>
              <Label htmlFor="student-name" className="font-ui">
                What should we call you?
              </Label>
              <Input
                id="student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-1.5"
                data-ocid="entry.student.name.input"
                onKeyDown={(e) => e.key === "Enter" && handleStudentContinue()}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleStudentContinue}
              disabled={!name.trim()}
              data-ocid="entry.student.name.submit_button"
            >
              Enter Student Console
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border-2 border-border p-6 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => {
                  setStep("pick");
                  setTeacherPassword("");
                  setTeacherError(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="entry.teacher.back.button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-display text-xl font-bold">Teacher Login</h2>
            </div>
            <div>
              <Label htmlFor="teacher-password" className="font-ui">
                Enter your password
              </Label>
              <Input
                id="teacher-password"
                type="password"
                value={teacherPassword}
                onChange={(e) => {
                  setTeacherPassword(e.target.value);
                  setTeacherError(false);
                }}
                placeholder="Password"
                className={`mt-1.5 ${teacherError ? "border-destructive" : ""}`}
                data-ocid="entry.teacher.password.input"
                onKeyDown={(e) => e.key === "Enter" && handleTeacherLogin()}
                autoFocus
              />
              {teacherError && (
                <p className="text-xs text-destructive mt-1 font-ui">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleTeacherLogin}
              disabled={!teacherPassword.trim()}
              data-ocid="entry.teacher.login.submit_button"
              style={{
                background: "oklch(0.62 0.14 52)",
                color: "oklch(0.98 0 0)",
              }}
            >
              Enter Teacher Console
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT CONSOLE
// ════════════════════════════════════════════════════════════════════════════

function StudentConsole({
  actor,
  studentName,
  onExit: _onExit,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  studentName: string;
  onExit: () => void;
}) {
  const [view, setView] = useState<StudentView>({ page: "dashboard" });
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [certModal, setCertModal] = useState<{
    studentName: string;
    courseName: string;
    courseId: string;
    earnedAt: string;
  } | null>(null);

  const avatarColor = profile?.avatarColor ?? AVATAR_COLORS[0];
  const avatarInitials =
    profile?.avatarInitials ?? getInitials(studentName || "S");

  return (
    <div className="min-h-screen page-gradient-student flex flex-col">
      {/* Student Navbar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl shadow-sm"
        style={{
          background: "oklch(0.98 0.01 290 / 0.92)",
          borderColor: "oklch(0.88 0.04 290)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView({ page: "dashboard" })}
            className="flex items-center gap-2 font-display font-bold text-xl text-foreground"
            data-ocid="student.nav.logo.link"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span>
              Edu<span className="text-primary">Loom</span>
            </span>
          </button>

          <nav className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setView({ page: "dashboard" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors ${
                view.page === "dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid="student.nav.dashboard.link"
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> My Dashboard
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView({ page: "explore" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors ${
                view.page === "explore"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid="student.nav.explore.link"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> Explore
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView({ page: "profile" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors ${
                view.page === "profile"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid="student.nav.profile.link"
            >
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> Profile
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView({ page: "certificates" as any })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors ${
                (view as any).page === "certificates"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid="student.nav.certificates.link"
            >
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Certificates
              </span>
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView({ page: "profile" })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-ui font-medium hover:bg-primary/15 transition-colors"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: avatarColor }}
              >
                {avatarInitials}
              </span>
              {studentName}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {view.page === "dashboard" && (
          <StudentDashboard
            actor={actor}
            setView={setView}
            studentName={studentName}
          />
        )}
        {view.page === "explore" && (
          <ExplorePage actor={actor} setView={setView} />
        )}
        {view.page === "profile" && (
          <StudentProfilePage
            studentName={studentName}
            profile={profile}
            onSave={(p) => setProfile(p)}
          />
        )}
        {view.page === "course" && (
          <CoursePage
            actor={actor}
            courseId={view.courseId}
            setView={setView}
            isTeacher={false}
            onBack={() => setView({ page: "dashboard" })}
          />
        )}
        {(view as any).page === "certificates" && (
          <StudentCertificatesPage studentName={studentName} />
        )}
        {view.page === "lesson" && (
          <LessonPage
            actor={actor}
            lessonId={view.lessonId}
            courseId={view.courseId}
            setView={setView}
            isTeacher={false}
            studentName={studentName}
            onCertificateEarned={(courseId, courseName) => {
              saveCertificate({
                studentName,
                courseName,
                courseId: String(courseId),
              });
              setCertModal({
                studentName,
                courseName,
                courseId: String(courseId),
                earnedAt: new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              });
            }}
          />
        )}
      </main>

      <CertificateModal cert={certModal} onClose={() => setCertModal(null)} />

      <footer className="border-t py-4 text-center text-xs text-muted-foreground font-ui">
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ─── Student Profile Page ─────────────────────────────────────────────────────
function StudentProfilePage({
  studentName,
  profile,
  onSave,
}: {
  studentName: string;
  profile: StudentProfile | null;
  onSave: (p: StudentProfile) => void;
}) {
  const [name, setName] = useState(profile?.name ?? studentName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [registerNumber, setRegisterNumber] = useState(
    profile?.registerNumber ?? "",
  );
  const [year, setYear] = useState(profile?.year ?? "");
  const [semester, setSemester] = useState(profile?.semester ?? "");
  const [subjectDomain, setSubjectDomain] = useState(
    profile?.subjectDomain ?? "",
  );
  const [programme, setProgramme] = useState(profile?.programme ?? "");
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weeklyGoal ?? "");
  const [avatarColor, setAvatarColor] = useState(
    profile?.avatarColor ?? AVATAR_COLORS[0],
  );

  const initials = getInitials(name || "S");

  function handleSave() {
    const p: StudentProfile = {
      name,
      email,
      registerNumber,
      year,
      semester,
      subjectDomain,
      programme,
      weeklyGoal,
      avatarColor,
      avatarInitials: initials,
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    onSave(p);
    toast.success("Profile saved!");
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1
          className="font-display text-3xl font-bold"
          style={{ color: "oklch(0.35 0.14 290)" }}
        >
          My Profile
        </h1>
        <p className="text-muted-foreground font-ui mt-1">
          Manage your personal details and learning goals
        </p>
      </div>

      {/* Avatar section */}
      <Card className="shadow-card">
        <CardContent className="p-6 flex flex-col items-center gap-5">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-ui text-muted-foreground text-center mb-3">
              Choose your avatar color
            </p>
            <div className="flex gap-2 justify-center">
              {AVATAR_COLORS.map((color, i) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    background: color,
                    boxShadow:
                      avatarColor === color
                        ? `0 0 0 3px white, 0 0 0 5px ${color}`
                        : "none",
                    transform:
                      avatarColor === color ? "scale(1.15)" : "scale(1)",
                  }}
                  data-ocid={`student.profile.avatar_color.button.${i + 1}`}
                  aria-label={`Avatar color ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="font-ui">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="mt-1.5 font-ui"
                data-ocid="student.profile.name.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-ui">Official Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@institution.edu"
                className="mt-1.5 font-ui"
                data-ocid="student.profile.email.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-ui">Register Number</Label>
              <Input
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="e.g. 22BCE001"
                className="mt-1.5 font-ui"
                data-ocid="student.profile.register_number.input"
              />
            </div>
            <div>
              <Label className="font-ui">Year</Label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-ui focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="student.profile.year.select"
              >
                <option value="">Select year</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
            <div>
              <Label className="font-ui">Semester</Label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-ui focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="student.profile.semester.select"
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n}>Semester {n}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="font-ui">Programme</Label>
              <Input
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                placeholder="e.g. B.Ed, M.A. English"
                className="mt-1.5 font-ui"
                data-ocid="student.profile.programme.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-ui">Subject Domain</Label>
              <Input
                value={subjectDomain}
                onChange={(e) => setSubjectDomain(e.target.value)}
                placeholder="e.g. English Language Teaching"
                className="mt-1.5 font-ui"
                data-ocid="student.profile.domain.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-ui">Weekly Learning Goal</Label>
              <select
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-ui focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="student.profile.weekly_goal.select"
              >
                <option value="">Select goal</option>
                <option>30 mins</option>
                <option>1 hour</option>
                <option>2 hours</option>
                <option>3+ hours</option>
              </select>
            </div>
          </div>

          <Button
            className="w-full mt-2"
            onClick={handleSave}
            data-ocid="student.profile.save.submit_button"
          >
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEACHER CONSOLE
// ════════════════════════════════════════════════════════════════════════════

function TeacherConsole({
  actor,
  onLogout,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  onLogout: () => void;
}) {
  const [view, setView] = useState<TeacherView>({ page: "dashboard" });
  const [teacherEmail, setTeacherEmail] = useState<string>(() => {
    return localStorage.getItem(TEACHER_EMAIL_KEY) ?? "";
  });

  function handleTeacherEmailBlur() {
    localStorage.setItem(TEACHER_EMAIL_KEY, teacherEmail);
    if (teacherEmail) toast.success("Email saved!");
  }

  return (
    <div className="min-h-screen page-gradient-teacher flex flex-col">
      {/* Teacher Navbar — warm dark surface */}
      <header
        className="sticky top-0 z-40 shadow-sm"
        style={{
          background: "oklch(0.97 0.03 52)",
          borderBottom: "1px solid oklch(0.87 0.05 52)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView({ page: "dashboard" })}
            className="flex items-center gap-2 font-display font-bold text-xl"
            style={{ color: "oklch(0.22 0.05 52)" }}
            data-ocid="teacher.nav.logo.link"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.62 0.14 52)" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span>
              Edu<span style={{ color: "oklch(0.65 0.14 52)" }}>Loom</span>
            </span>
          </button>

          <nav className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setView({ page: "dashboard" })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors"
              style={{
                background:
                  view.page === "dashboard"
                    ? "oklch(0.62 0.14 52 / 0.2)"
                    : "transparent",
                color:
                  view.page === "dashboard"
                    ? "oklch(0.35 0.12 52)"
                    : "oklch(0.5 0.06 52)",
              }}
              data-ocid="teacher.nav.dashboard.link"
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView({ page: "materials" })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors"
              style={{
                background:
                  view.page === "materials"
                    ? "oklch(0.62 0.14 52 / 0.2)"
                    : "transparent",
                color:
                  view.page === "materials"
                    ? "oklch(0.35 0.12 52)"
                    : "oklch(0.5 0.06 52)",
              }}
              data-ocid="teacher.nav.materials.link"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Materials
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView({ page: "students" })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium font-ui transition-colors"
              style={{
                background:
                  view.page === "students"
                    ? "oklch(0.62 0.14 52 / 0.2)"
                    : "transparent",
                color:
                  view.page === "students"
                    ? "oklch(0.35 0.12 52)"
                    : "oklch(0.5 0.06 52)",
              }}
              data-ocid="teacher.nav.students.link"
            >
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Students
              </span>
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <label
                htmlFor="teacher-email-input"
                className="text-xs font-ui"
                style={{ color: "oklch(0.5 0.06 52)" }}
              >
                Your Email:
              </label>
              <Input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                onBlur={handleTeacherEmailBlur}
                placeholder="official@institution.edu"
                className="h-7 text-xs w-48 font-ui"
                style={{
                  borderColor: "oklch(0.87 0.05 52)",
                  background: "oklch(0.97 0.03 52)",
                }}
                id="teacher-email-input"
                data-ocid="teacher.email.input"
              />
            </div>
            <Badge
              variant="outline"
              className="border font-ui text-xs font-semibold"
              style={{
                borderColor: "oklch(0.62 0.14 52 / 0.6)",
                color: "oklch(0.75 0.14 52)",
                background: "oklch(0.62 0.14 52 / 0.12)",
              }}
            >
              Teacher
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-sm font-ui"
              style={{ color: "oklch(0.5 0.06 52)" }}
              data-ocid="teacher.nav.sign_out.button"
            >
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {view.page === "dashboard" && (
          <TeacherDashboard actor={actor} setView={setView} />
        )}
        {view.page === "course-editor" && (
          <CourseEditor
            actor={actor}
            courseId={view.courseId}
            setView={setView}
          />
        )}
        {view.page === "lesson-editor" && (
          <LessonEditor
            actor={actor}
            lessonId={view.lessonId}
            courseId={view.courseId}
            setView={setView}
          />
        )}
        {view.page === "materials" && (
          <MaterialsPage actor={actor} setView={setView} />
        )}
        {view.page === "students" && <StudentRosterPage />}
        {view.page === "create-course" && (
          <CreateCoursePage actor={actor} setView={setView} />
        )}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground font-ui">
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ─── Materials Page ────────────────────────────────────────────────────────────
interface Material {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
  activitiesGenerated: boolean;
}

const MATERIALS_KEY = "eduloom_materials";

const LOCAL_COURSES_KEY = "eduloom_local_courses";

interface LocalCourse {
  id: number;
  title: string;
  description: string;
  section: string;
  subject: string;
  room: string;
  bannerColor: string;
  isPublished: boolean;
  createdAt: number;
}

function getLocalCourses(): LocalCourse[] {
  try {
    const stored = localStorage.getItem(LOCAL_COURSES_KEY);
    if (stored) return JSON.parse(stored) as LocalCourse[];
  } catch {}
  return [];
}

function updateLocalCourse(id: number, updates: Partial<LocalCourse>): void {
  const courses = getLocalCourses().map((c) =>
    c.id === id ? { ...c, ...updates } : c,
  );
  localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
}

function deleteLocalCourse(id: number): void {
  const courses = getLocalCourses().filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
}

// ─── Local Lessons Storage ────────────────────────────────────────────────────
const LOCAL_LESSONS_KEY = "eduloom_local_lessons";

interface LocalLesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  orderIndex: number;
  type?: "Activity" | "Worksheet" | "LSRW" | "Game" | "Exercise" | "Lesson";
}

function getLocalLessons(): LocalLesson[] {
  try {
    const stored = localStorage.getItem(LOCAL_LESSONS_KEY);
    if (stored) return JSON.parse(stored) as LocalLesson[];
  } catch {}
  return [];
}

// ─── Local Lesson Completion Storage ─────────────────────────────────────────
const LOCAL_COMPLETED_KEY = "eduloom_completed_lessons";

function getCompletedLocalLessons(): Set<number> {
  try {
    const s = localStorage.getItem(LOCAL_COMPLETED_KEY);
    return new Set(s ? JSON.parse(s) : []);
  } catch {
    return new Set();
  }
}

function markLocalLessonComplete(id: number) {
  const set = getCompletedLocalLessons();
  set.add(id);
  localStorage.setItem(LOCAL_COMPLETED_KEY, JSON.stringify([...set]));
}

function detectTypeFromTitle(title: string): LocalLesson["type"] {
  if (title.startsWith("Activity")) return "Activity";
  if (title.startsWith("Worksheet")) return "Worksheet";
  if (title.startsWith("LSRW")) return "LSRW";
  if (title.startsWith("Game")) return "Game";
  if (title.startsWith("Exercise")) return "Exercise";
  return "Lesson";
}

// ─── Local Enrollments Storage ────────────────────────────────────────────────
const LOCAL_ENROLLMENTS_KEY = "eduloom_local_enrollments";

interface LocalEnrollment {
  courseId: number;
  enrolledAt: number;
}

function getLocalEnrollments(): LocalEnrollment[] {
  try {
    const stored = localStorage.getItem(LOCAL_ENROLLMENTS_KEY);
    if (stored) return JSON.parse(stored) as LocalEnrollment[];
  } catch {}
  return [];
}

function saveLocalEnrollment(courseId: number): void {
  const enrollments = getLocalEnrollments();
  if (!enrollments.find((e) => e.courseId === courseId)) {
    enrollments.push({ courseId, enrolledAt: Date.now() });
    localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(enrollments));
  }
}

const DEFAULT_MATERIALS: Material[] = [
  {
    id: "edu326",
    name: "EDU326 - English Language Pedagogy II.pdf",
    size: 0,
    uploadedAt: "Pre-loaded",
    dataUrl: "/assets/uploads/EDU326-1.pdf",
    activitiesGenerated: false,
  },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return "Pre-loaded";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MaterialsPage({
  actor,
  setView: _setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: TeacherView) => void;
}) {
  const queryClient = useQueryClient();
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const stored = localStorage.getItem(MATERIALS_KEY);
      if (stored) return JSON.parse(stored) as Material[];
    } catch {}
    return DEFAULT_MATERIALS;
  });
  const [dragging, setDragging] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null,
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const { data: backendCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCourses();
    },
    enabled: !!actor,
  });

  const { data: localCoursesDataMat = [] } = useQuery({
    queryKey: ["local-courses"],
    queryFn: () => getLocalCourses(),
    staleTime: 0,
  });

  const courses = [
    ...backendCourses,
    ...localCoursesDataMat.map(
      (c) =>
        ({
          course: {
            id: BigInt(c.id),
            title: c.title,
            description: c.description,
            teacherId: { toString: () => "local" } as any,
            createdAt: BigInt(c.createdAt),
            isPublished: c.isPublished,
          },
          enrollmentCount: BigInt(0),
          lessonCount: BigInt(0),
        }) as any,
    ),
  ];

  function saveMaterials(updated: Material[]) {
    setMaterials(updated);
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newMaterial: Material = {
        id: `mat_${Date.now()}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleDateString(),
        dataUrl,
        activitiesGenerated: false,
      };
      saveMaterials([...materials, newMaterial]);
      toast.success(`"${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  }

  function deleteMaterial(id: string) {
    saveMaterials(materials.filter((m) => m.id !== id));
  }

  function openGenerateDialog(materialId: string) {
    setSelectedMaterialId(materialId);
    setSelectedCourseId("");
    setGenerateDialogOpen(true);
  }

  async function handleGenerate() {
    if (!selectedMaterialId || !selectedCourseId) return;
    const material = materials.find((m) => m.id === selectedMaterialId);
    if (!material) return;
    const course = (courses as CourseWithStats[]).find(
      (c) => c.course.id.toString() === selectedCourseId,
    );
    if (!course) return;

    setGenerating(true);
    const m = material.name.replace(/\.pdf$/i, "");
    let idx = 0;

    // ── 10 Activities ─────────────────────────────────────────────────────────
    const activities = [
      {
        title: `Activity 1 – Concept Mapping: ${m}`,
        content: `Create a concept map for the key ideas in ${m}.\n\n**Steps:**\n1. Identify 6–8 central concepts from the material\n2. Draw connections between related concepts, labelling each link\n3. Add 2 real-world examples to your map\n4. Compare your map with a classmate and discuss differences\n\n**Outcome:** Students will organise knowledge visually and identify relationships between ideas.`,
      },
      {
        title: `Activity 2 – Think-Pair-Share: ${m}`,
        content: `Engage in a structured discussion on the central themes of ${m}.\n\n**Steps:**\n1. Think independently: write 3 key takeaways (3 mins)\n2. Pair: share your points with a partner and agree on the top 2\n3. Share with the class; teacher records common themes on board\n\n**Outcome:** Students will articulate understanding and refine ideas through peer exchange.`,
      },
      {
        title: `Activity 3 – Socratic Seminar: ${m}`,
        content: `Conduct a student-led discussion on a guiding question from ${m}.\n\n**Steps:**\n1. Teacher posts a debatable question from the material\n2. Students take turns responding, building on or challenging peers\n3. No hand-raising — use active listening cues\n4. Debrief: what conclusion did the group reach?\n\n**Outcome:** Students will develop critical thinking and academic dialogue skills.`,
      },
      {
        title: `Activity 4 – Gallery Walk: ${m}`,
        content: `Explore key topics from ${m} displayed around the room.\n\n**Steps:**\n1. Teacher posts 6 topic stations around the classroom\n2. Groups rotate every 4 minutes, adding notes on sticky pads\n3. After all stations, groups share the most interesting insight they found\n\n**Outcome:** Students will survey multiple perspectives and synthesise information collaboratively.`,
      },
      {
        title: `Activity 5 – Case Study Analysis: ${m}`,
        content: `Analyse a case study related to the themes in ${m}.\n\n**Steps:**\n1. Read the provided case study (10 mins)\n2. Identify: problem, stakeholders, proposed solutions\n3. Evaluate each solution using concepts from ${m}\n4. Write a 1-paragraph recommendation\n\n**Outcome:** Students will apply theoretical knowledge to a real-world scenario.`,
      },
      {
        title: `Activity 6 – Role Play: ${m}`,
        content: `Simulate a real-world scenario based on content from ${m}.\n\n**Steps:**\n1. Assign roles to groups (e.g., expert, questioner, observer)\n2. Groups act out a scenario related to the topic\n3. Observers take notes and give structured feedback\n4. Swap roles and repeat\n\n**Outcome:** Students will practise applying knowledge in a contextualised, active setting.`,
      },
      {
        title: `Activity 7 – Jigsaw Learning: ${m}`,
        content: `Each student becomes an expert on one section of ${m}.\n\n**Steps:**\n1. Divide material into 4 sections; assign one per group member\n2. Each person reads and prepares a 2-minute summary of their section\n3. Regroup and teach each other your sections\n4. Complete a short group quiz to check shared understanding\n\n**Outcome:** Students will develop both individual expertise and collaborative teaching skills.`,
      },
      {
        title: `Activity 8 – Debate: ${m}`,
        content: `Run a structured debate on a controversial topic from ${m}.\n\n**Steps:**\n1. Divide class into two sides: for and against a key claim\n2. Each side prepares 3 arguments (5 mins)\n3. Opening statements (1 min each), rebuttals (1 min each), closing (30 secs each)\n4. Class votes on the most convincing argument\n\n**Outcome:** Students will build persuasive reasoning and critical argumentation skills.`,
      },
      {
        title: `Activity 9 – Exit Ticket: ${m}`,
        content: `Consolidate learning from ${m} with a structured exit reflection.\n\n**Steps:**\n1. At the end of the lesson, students answer on a card:\n   – One thing I learned today\n   – One question I still have\n   – One connection to something I already knew\n2. Teacher reviews cards to plan the next lesson\n\n**Outcome:** Students will reflect on their learning and identify gaps for further study.`,
      },
      {
        title: `Activity 10 – Peer Teaching: ${m}`,
        content: `Students consolidate understanding by teaching a topic from ${m} to peers.\n\n**Steps:**\n1. Each student selects one concept to teach (5 mins prep)\n2. Teach in pairs using any format: explanation, diagram, example\n3. Listener asks one clarifying question\n4. Swap roles\n\n**Outcome:** Students will deepen understanding by articulating and explaining content to others.`,
      },
    ];

    // ── 10 Worksheets ─────────────────────────────────────────────────────────
    const worksheets = [
      {
        title: `Worksheet 1 – Vocabulary Builder: ${m}`,
        content: `Build subject vocabulary from ${m}.\n\n**Part A – Match the term:**\nMatch each term in column A with its definition in column B (10 terms provided by teacher).\n\n**Part B – Fill in the blank:**\nComplete the sentences using key vocabulary from the material.\n\n**Part C – Use in context:**\nWrite one original sentence for each of 5 key terms.\n\n**Outcome:** Students will accurately use subject-specific vocabulary in writing.`,
      },
      {
        title: `Worksheet 2 – Key Concepts Summary: ${m}`,
        content: `Summarise the main ideas from ${m}.\n\n**Instructions:**\n1. List 5 key concepts from the material\n2. For each concept, write: a definition, an example, and why it matters\n3. Rank them in order of importance and justify your ranking\n\n**Outcome:** Students will extract and prioritise core content from the material.`,
      },
      {
        title: `Worksheet 3 – Comparison Chart: ${m}`,
        content: `Compare two or more concepts or theories from ${m}.\n\n**Instructions:**\n1. Choose two related concepts from the material\n2. Complete the T-chart: similarities | differences\n3. Write a 3-sentence conclusion explaining which concept is more applicable and why\n\n**Outcome:** Students will analyse and distinguish between related concepts.`,
      },
      {
        title: `Worksheet 4 – True / False / Not Given: ${m}`,
        content: `Test comprehension of ${m} with a fact-check exercise.\n\n**Instructions:**\nRead each statement and decide: True, False, or Not Given (based strictly on the material).\n(10 statements provided by teacher.)\n\nFor each False answer, write the correct information.\n\n**Outcome:** Students will demonstrate accurate reading comprehension and identify factual errors.`,
      },
      {
        title: `Worksheet 5 – Cause & Effect Diagram: ${m}`,
        content: `Map cause-and-effect relationships from ${m}.\n\n**Instructions:**\n1. Identify 3 major causes described in the material\n2. For each cause, describe its direct effect and one long-term consequence\n3. Draw arrows connecting causes → effects → consequences\n\n**Outcome:** Students will trace logical and causal chains within academic content.`,
      },
      {
        title: `Worksheet 6 – Question Generation: ${m}`,
        content: `Develop higher-order thinking questions about ${m}.\n\n**Instructions:**\n1. Write 2 knowledge-level questions (Who/What/When)\n2. Write 2 comprehension questions (Explain/Describe)\n3. Write 2 application questions (How would you use…)\n4. Write 1 evaluation question (Do you agree that…)\nSwap with a partner and answer each other's questions.\n\n**Outcome:** Students will practise Bloom's Taxonomy questioning across cognitive levels.`,
      },
      {
        title: `Worksheet 7 – Sequencing Activity: ${m}`,
        content: `Arrange key processes or events from ${m} in the correct order.\n\n**Instructions:**\n1. Cut out the 10 event cards (provided by teacher)\n2. Arrange them in logical or chronological sequence\n3. Write a one-sentence explanation for each step\n4. Identify one step that could be removed without affecting the outcome\n\n**Outcome:** Students will understand procedural knowledge and sequence in context.`,
      },
      {
        title: `Worksheet 8 – Annotated Reading: ${m}`,
        content: `Practise annotation strategies on an extract from ${m}.\n\n**Instructions:**\nAs you read the provided excerpt:\n– Underline key arguments\n– Circle unfamiliar vocabulary\n– Put a star ★ next to ideas you agree with\n– Put a question mark ? next to ideas you are unsure about\n– Write 2-sentence margin notes on 3 sections\n\n**Outcome:** Students will engage actively with texts and develop critical reading habits.`,
      },
      {
        title: `Worksheet 9 – Mind Map: ${m}`,
        content: `Create a detailed mind map for a central topic in ${m}.\n\n**Instructions:**\n1. Write the main topic in the centre\n2. Add 5 main branches (sub-topics)\n3. Add 3 leaves (supporting details) on each branch\n4. Use colour coding to group related ideas\n\n**Outcome:** Students will represent knowledge holistically and identify thematic connections.`,
      },
      {
        title: `Worksheet 10 – Reflective Journal: ${m}`,
        content: `Write a structured reflection on your learning from ${m}.\n\n**Prompts:**\n1. What was the most challenging concept in this material? Why?\n2. What prior knowledge did you connect to this material?\n3. How will you apply what you learned in a future context?\n4. What would you like to explore further?\n\n**Outcome:** Students will practise metacognitive reflection and connect learning to personal experience.`,
      },
    ];

    // ── 10 LSRW Training Tasks ────────────────────────────────────────────────
    const lsrw = [
      {
        title: `LSRW 1 – Listening: Lecture Note-Taking (${m})`,
        content: `Develop academic listening and note-taking skills using content from ${m}.\n\n**Task:** Listen to a 10-minute lecture excerpt on the topic.\n1. Use the Cornell Note-Taking format: main notes | key words | summary\n2. Identify: 3 main points, 2 examples, 1 conclusion\n3. Write a 50-word summary from your notes only (no re-listening)\n\n**LSRW Skill:** Listening — identifying key information in academic speech.`,
      },
      {
        title: `LSRW 2 – Speaking: Structured Presentation (${m})`,
        content: `Practise academic speaking with a structured short presentation from ${m}.\n\n**Task:** Prepare and deliver a 3-minute presentation.\n1. Introduction: state your topic and main argument\n2. Body: present 2 key points with evidence\n3. Conclusion: summarise and give a personal evaluation\nUse the PEEL structure (Point, Evidence, Explanation, Link).\n\n**LSRW Skill:** Speaking — structuring academic oral communication.`,
      },
      {
        title: `LSRW 3 – Reading: Skimming & Scanning (${m})`,
        content: `Develop efficient reading strategies for ${m}.\n\n**Task A – Skimming (2 mins):**\nRead the headings, first sentences, and visuals. Answer: What is the main topic?\n\n**Task B – Scanning (3 mins):**\nFind specific information: 3 dates/numbers, 2 names, 1 definition.\n\n**Task C – Close reading (10 mins):**\nRead one section in full. Identify the main argument and 2 supporting details.\n\n**LSRW Skill:** Reading — flexible reading strategies for different purposes.`,
      },
      {
        title: `LSRW 4 – Writing: Paragraph Writing (${m})`,
        content: `Write a well-structured academic paragraph about a concept from ${m}.\n\n**Task:**\n1. Choose one key concept from the material\n2. Write a 150-word paragraph using PEEL structure:\n   – Point: state the concept\n   – Evidence: quote or paraphrase from the material\n   – Explanation: explain the evidence\n   – Link: connect back to the overall topic\n\n**LSRW Skill:** Writing — academic paragraph structure and evidence use.`,
      },
      {
        title: `LSRW 5 – Listening: Identifying Speaker Purpose (${m})`,
        content: `Practise critical listening skills using audio content related to ${m}.\n\n**Task:**\n1. Listen to a short audio clip (3–5 mins)\n2. Identify: Is the speaker informing, persuading, or explaining?\n3. List 3 words or phrases that signal the speaker's purpose\n4. Write 2 sentences describing how the speaker signals transitions\n\n**LSRW Skill:** Listening — critical analysis of spoken discourse and speaker intent.`,
      },
      {
        title: `LSRW 6 – Speaking: Group Discussion (${m})`,
        content: `Practise academic group discussion skills on content from ${m}.\n\n**Task:**\n1. In groups of 4, discuss: "What is the most significant idea in this material?"\n2. Each person contributes one point (no interrupting)\n3. Group agrees on a consensus position\n4. One spokesperson presents the group's view to the class (1 min)\n\n**LSRW Skill:** Speaking — turn-taking, listening to peers, and building on ideas.`,
      },
      {
        title: `LSRW 7 – Reading: Inference & Implicit Meaning (${m})`,
        content: `Practise reading between the lines in ${m}.\n\n**Task:**\n1. Read the assigned passage\n2. Answer: What is implied but not directly stated?\n3. Find 2 sentences where the author assumes background knowledge\n4. Rewrite one sentence to make the implicit meaning explicit\n\n**LSRW Skill:** Reading — inferencing and understanding implicit academic language.`,
      },
      {
        title: `LSRW 8 – Writing: Summary Writing (${m})`,
        content: `Practise academic summary writing from ${m}.\n\n**Task:**\n1. Read the assigned section (2 pages)\n2. Identify: main claim, 3 supporting ideas, conclusion\n3. Write a 100-word summary in your own words (no copying)\n4. Check: Did you include only the most important ideas? No personal opinion?\n\n**LSRW Skill:** Writing — paraphrasing, summarising, and academic register.`,
      },
      {
        title: `LSRW 9 – Listening: Dictation & Reconstruction (${m})`,
        content: `Develop listening accuracy using content from ${m}.\n\n**Task:**\n1. Listen to 5 key sentences from the material read aloud\n2. Write each sentence from memory after hearing it once\n3. Compare your version to the original — what did you miss or change?\n4. Practise 3 of the sentences with a partner\n\n**LSRW Skill:** Listening — aural accuracy and phonological awareness in academic English.`,
      },
      {
        title: `LSRW 10 – Writing: Argumentative Essay Outline (${m})`,
        content: `Plan a short argumentative essay on a key theme from ${m}.\n\n**Task:**\n1. Choose a debatable statement from the material\n2. Write an essay outline:\n   – Introduction: hook, background, thesis\n   – Body 1: argument + evidence\n   – Body 2: counter-argument + rebuttal\n   – Conclusion: restate thesis + broader implication\n3. Share your outline with a peer for feedback\n\n**LSRW Skill:** Writing — academic argumentation structure and essay planning.`,
      },
    ];

    // ── 10 Games ──────────────────────────────────────────────────────────────
    const games = [
      {
        title: `Game 1 – Vocabulary Bingo: ${m}`,
        content: `Play vocabulary bingo using key terms from ${m}.\n\n**Setup:** Teacher creates bingo cards with 25 key terms. Teacher reads out definitions — students cross off the matching term.\n\n**How to play:**\n1. Fill your 5×5 bingo card with terms from the word bank\n2. Teacher reads definitions; mark the correct term\n3. First to complete a row shouts "Bingo!" and reads back their answers\n\n**Learning Goal:** Reinforce vocabulary recognition and definition matching.`,
      },
      {
        title: `Game 2 – Quiz Bowl: ${m}`,
        content: `Compete in a quiz bowl on content from ${m}.\n\n**Format:** Teams of 4 compete to answer questions.\n\n**Rules:**\n1. Buzz in to answer — only one answer per question\n2. Correct answer = 2 points; incorrect = –1 point for bonus round\n3. Categories: Key Terms | Concepts | Application | True/False\n\n**Learning Goal:** Review and consolidate factual and conceptual knowledge in a competitive format.`,
      },
      {
        title: `Game 3 – Word Association Chain: ${m}`,
        content: `Build vocabulary chains from key concepts in ${m}.\n\n**How to play:**\n1. Teacher says a key term from the material\n2. Next student says a related word and explains the link (10 secs)\n3. Continue around the class — you cannot repeat a word\n4. If you cannot respond in time, sit down\n5. Last student standing wins\n\n**Learning Goal:** Activate vocabulary networks and deepen conceptual understanding.`,
      },
      {
        title: `Game 4 – 20 Questions: ${m}`,
        content: `Guess key concepts from ${m} using yes/no questions.\n\n**How to play:**\n1. One student thinks of a key concept, person, or term from the material\n2. Other students ask up to 20 yes/no questions\n3. The class has 3 guesses at any point\n4. If the class guesses correctly, they get a point; if not, the student wins\n\n**Learning Goal:** Reinforce descriptive language and concept definition skills.`,
      },
      {
        title: `Game 5 – Kahoot-Style Live Quiz: ${m}`,
        content: `Play a fast-paced live quiz on ${m} content.\n\n**Format:** Teacher prepares 15 multiple-choice questions.\n\n**Rules:**\n1. Each question has 4 options — choose the correct one\n2. Faster correct answers earn more points\n3. Leaderboard shown after each question\n4. Top 3 scores earn a classroom reward\n\n**Learning Goal:** Test recall and comprehension of key facts and concepts in an engaging format.`,
      },
      {
        title: `Game 6 – Crossword Puzzle: ${m}`,
        content: `Solve a crossword puzzle built from vocabulary in ${m}.\n\n**Instructions:**\n1. Use the clues to fill in the crossword grid (teacher-prepared)\n2. Across clues focus on definitions; Down clues focus on fill-in-the-blank\n3. First student/pair to complete the grid correctly wins\n\n**Bonus:** Write 3 new sentences using words you found in the crossword.\n\n**Learning Goal:** Consolidate spelling, definition, and vocabulary in context.`,
      },
      {
        title: `Game 7 – Taboo: ${m}`,
        content: `Describe key concepts from ${m} without using forbidden words.\n\n**How to play:**\n1. Each card has a target word and 4 forbidden words\n2. Describer must get their team to say the target word\n3. Cannot use the target word or forbidden words\n4. 60 seconds per round — most correct = wins\n\n**Learning Goal:** Deepen understanding of concepts by exploring synonyms, examples, and descriptions.`,
      },
      {
        title: `Game 8 – Memory Match: ${m}`,
        content: `Match key terms to their definitions from ${m}.\n\n**Setup:** 20 cards total — 10 term cards and 10 definition cards.\n\n**How to play:**\n1. Lay all cards face-down in a 4×5 grid\n2. Players take turns flipping 2 cards\n3. If a term matches its definition, keep the pair\n4. Player with the most pairs at the end wins\n\n**Learning Goal:** Reinforce term-definition pairings through active recall.`,
      },
      {
        title: `Game 9 – Hot Seat: ${m}`,
        content: `Practise explaining concepts from ${m} in the "hot seat".\n\n**How to play:**\n1. One student sits with their back to the board\n2. Teacher writes a key term on the board\n3. Other students give hints (no direct synonyms) until the student guesses\n4. 5 correct guesses in 60 seconds wins a round\n\n**Learning Goal:** Practise defining, paraphrasing, and explaining academic content.`,
      },
      {
        title: `Game 10 – Category Sort Race: ${m}`,
        content: `Sort key terms from ${m} into correct categories as fast as possible.\n\n**Setup:** 30 term cards are spread on desks. 5 category headings are posted.\n\n**How to play:**\n1. On "Go!", students race to place each card under the correct category\n2. First team to correctly sort all cards wins\n3. Review: discuss any terms that were placed incorrectly\n\n**Learning Goal:** Build categorical thinking and organise subject knowledge.`,
      },
    ];

    // ── 10 Exercises ─────────────────────────────────────────────────────────
    const exercises = [
      {
        title: `Exercise 1 – Comprehension Questions: ${m}`,
        content: `Answer comprehension questions based on ${m}.\n\n**Instructions:** Answer each question in 2–3 sentences using evidence from the material.\n1. What is the central argument of this material?\n2. What evidence does the author provide?\n3. What assumptions underlie the main claims?\n4. What limitations does the material acknowledge?\n5. How does this material connect to broader themes in your course?\n\n**Outcome:** Students will demonstrate reading comprehension and analytical response skills.`,
      },
      {
        title: `Exercise 2 – Short Answer Drill: ${m}`,
        content: `Complete a short-answer drill on key facts and concepts from ${m}.\n\n**Instructions:** Answer each question in one or two sentences.\n(10 short-answer questions provided by teacher based on the material.)\n\n**Marking Guide:**\n– 1 mark for correct basic answer\n– 2 marks for answer with accurate supporting detail\n\n**Outcome:** Students will practise concise, accurate academic writing under exam conditions.`,
      },
      {
        title: `Exercise 3 – Gap Fill: ${m}`,
        content: `Complete the gap-fill exercise using vocabulary from ${m}.\n\n**Instructions:**\n1. Read each sentence carefully\n2. Fill in the blank with the correct word or phrase from the word bank\n3. Each word can only be used once\n4. Check: does the sentence make sense in context?\n\n(15 sentences provided by teacher.)\n\n**Outcome:** Students will apply vocabulary accurately in context.`,
      },
      {
        title: `Exercise 4 – Sentence Transformation: ${m}`,
        content: `Practise sentence transformation using language structures from ${m}.\n\n**Instructions:** Rewrite each sentence as instructed without changing the meaning.\n1. Change active to passive (or vice versa)\n2. Combine two short sentences into one complex sentence\n3. Rewrite using a different modal verb\n4. Change from direct to reported speech\n\n(10 sentences per transformation type, provided by teacher.)\n\n**Outcome:** Students will develop grammatical flexibility in academic writing.`,
      },
      {
        title: `Exercise 5 – Paraphrasing Practice: ${m}`,
        content: `Practise paraphrasing key sentences from ${m}.\n\n**Instructions:**\n1. Read each original sentence from the material\n2. Rewrite it in your own words without losing the meaning\n3. Do not use more than 2 words from the original sentence\n4. Check: Is the meaning preserved? Is the grammar correct?\n\n(8 sentences to paraphrase, provided by teacher.)\n\n**Outcome:** Students will develop paraphrasing skills essential for academic writing and avoiding plagiarism.`,
      },
      {
        title: `Exercise 6 – Multiple Choice Questions: ${m}`,
        content: `Answer multiple-choice questions on content from ${m}.\n\n**Instructions:**\n1. Read each question carefully before looking at the options\n2. Eliminate clearly wrong options first\n3. Choose the best answer — some questions test inference, not just recall\n4. Review your answers: for each one, identify the part of the material that supports it\n\n(20 questions, prepared by teacher.)\n\n**Outcome:** Students will practise reading comprehension and test-taking strategies.`,
      },
      {
        title: `Exercise 7 – Error Correction: ${m}`,
        content: `Identify and correct errors in student-style answers about ${m}.\n\n**Instructions:**\n1. Read each "student answer" below\n2. Identify: Is it factually wrong? Is the language unclear? Is the argument weak?\n3. Rewrite each answer to correct the errors\n\n(6 flawed answers provided by teacher.)\n\n**Outcome:** Students will sharpen critical reading and develop accurate written expression.`,
      },
      {
        title: `Exercise 8 – Extended Writing Task: ${m}`,
        content: `Write a 300-word extended response on a key theme from ${m}.\n\n**Prompt:** Choose one of the following:\n– "Critically evaluate the main argument presented in ${m}."\n– "To what extent do you agree with the central claim in ${m}? Justify your answer."\n\n**Structure:** Introduction → 2 body paragraphs → Conclusion\n**Include:** 2 references to specific content from the material\n\n**Outcome:** Students will practise sustained academic writing with argument, evidence, and evaluation.`,
      },
      {
        title: `Exercise 9 – Timed Reading Comprehension: ${m}`,
        content: `Complete a timed comprehension exercise on a passage from ${m}.\n\n**Instructions:**\n1. You have 15 minutes to read the passage and answer 10 questions\n2. Do not re-read — practise answering from first read\n3. After the timer: check your answers and note which question types you found hardest\n\n**Question types:** True/False, Short Answer, Vocabulary in Context, Inference\n\n**Outcome:** Students will improve reading speed, accuracy, and exam technique.`,
      },
      {
        title: `Exercise 10 – Self-Assessment Checklist: ${m}`,
        content: `Review your own understanding of ${m} using a self-assessment checklist.\n\n**Instructions:** Rate yourself for each learning objective: ✓ Confident | ~ Partially | ✗ Need to Review\n\n1. I can define the 10 key terms from this material\n2. I can explain the central argument in my own words\n3. I can give 3 real-world examples related to this content\n4. I can identify strengths and weaknesses in the argument\n5. I can apply this content to a new scenario\n\n**Next step:** For every ✗, revisit the relevant section and redo one exercise.\n\n**Outcome:** Students will develop metacognitive awareness and take ownership of their learning.`,
      },
    ];

    const allItems = [
      ...activities.map((a) => ({ ...a, orderIndex: BigInt(idx++) })),
      ...worksheets.map((a) => ({ ...a, orderIndex: BigInt(idx++) })),
      ...lsrw.map((a) => ({ ...a, orderIndex: BigInt(idx++) })),
      ...games.map((a) => ({ ...a, orderIndex: BigInt(idx++) })),
      ...exercises.map((a) => ({ ...a, orderIndex: BigInt(idx++) })),
    ];

    try {
      const courseNumId = Number(course.course.id);
      const isBackendCourse = !getLocalCourses().some(
        (c) => c.id === courseNumId,
      );
      if (actor) {
        let backendCourseId = course.course.id;
        // If it's a local course, sync it to backend first
        if (!isBackendCourse) {
          const lc = getLocalCourses().find((c) => c.id === courseNumId);
          if (lc) {
            try {
              const syncResult = await actor.createCourse(
                lc.title,
                lc.description || "",
              );
              if ("ok" in syncResult) {
                await actor.publishCourse(syncResult.ok.id, true);
                backendCourseId = syncResult.ok.id;
                deleteLocalCourse(courseNumId);
                queryClient.invalidateQueries({ queryKey: ["all-courses"] });
              }
            } catch (_eSync) {
              toast.error(
                "Please sync the course first, then generate activities.",
              );
              return;
            }
          }
        }
        try {
          await actor.batchCreateLessons(
            backendCourseId,
            allItems.map((item) => ({
              title: item.title,
              content: item.content,
              orderIndex: item.orderIndex,
            })),
          );
        } catch (_eBatch) {
          toast.error(
            "Failed to save lessons to backend. Please check connection and try again.",
          );
          return;
        }
      } else {
        toast.error("Not connected. Please refresh and try again.");
        return;
      }
      saveMaterials(
        materials.map((mat) =>
          mat.id === selectedMaterialId
            ? { ...mat, activitiesGenerated: true }
            : mat,
        ),
      );
      queryClient.invalidateQueries({
        queryKey: ["local-lessons", selectedCourseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(
        `50 learning items created in "${course.course.title}"! (10 each: Activities, Worksheets, LSRW Tasks, Games, Exercises)`,
      );
      setGenerateDialogOpen(false);
    } catch (_err) {
      toast.error("Failed to generate learning items. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="font-display text-3xl font-bold"
          style={{ color: "oklch(0.22 0.05 52)" }}
        >
          Learning Materials
        </h1>
        <p
          className="mt-1 font-ui text-sm"
          style={{ color: "oklch(0.5 0.06 52)" }}
        >
          Upload your syllabus and teaching materials to generate LSRW learning
          activities for students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: upload + materials list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop zone */}
          <div
            data-ocid="teacher.materials.dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 px-6 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragging
                ? "oklch(0.62 0.14 52)"
                : "oklch(0.28 0.04 52)",
              background: dragging
                ? "oklch(0.62 0.14 52 / 0.08)"
                : "oklch(0.18 0.025 52)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.62 0.14 52 / 0.15)" }}
            >
              <FileText
                className="h-7 w-7"
                style={{ color: "oklch(0.75 0.14 52)" }}
              />
            </div>
            <div>
              <p
                className="font-ui font-semibold text-sm"
                style={{ color: "oklch(0.85 0.05 52)" }}
              >
                Drag & drop a PDF here
              </p>
              <p
                className="font-ui text-xs mt-0.5"
                style={{ color: "oklch(0.55 0.03 52)" }}
              >
                Syllabus, notes, textbook chapters — PDF only
              </p>
            </div>
            <label
              className="cursor-pointer px-4 py-2 rounded-lg text-sm font-ui font-semibold transition-colors"
              style={{
                background: "oklch(0.62 0.14 52)",
                color: "oklch(0.22 0.05 52)",
              }}
            >
              Browse File
              <input
                type="file"
                accept=".pdf"
                className="sr-only"
                data-ocid="teacher.materials.upload_button"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>

          {/* Materials list */}
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div
                className="rounded-xl py-10 text-center font-ui text-sm"
                style={{
                  color: "oklch(0.55 0.03 52)",
                  background: "oklch(0.18 0.025 52)",
                }}
                data-ocid="teacher.materials.empty_state"
              >
                No materials uploaded yet. Upload a PDF to get started.
              </div>
            ) : (
              materials.map((mat, idx) => (
                <div
                  key={mat.id}
                  data-ocid={`teacher.materials.item.${idx + 1}`}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    background: "oklch(0.18 0.025 52)",
                    border: "1px solid oklch(0.87 0.05 52)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(0.62 0.14 52 / 0.15)" }}
                  >
                    <FileText
                      className="h-5 w-5"
                      style={{ color: "oklch(0.75 0.14 52)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-ui font-medium text-sm truncate"
                      style={{ color: "oklch(0.9 0.01 52)" }}
                    >
                      {mat.name}
                    </p>
                    <p
                      className="font-ui text-xs mt-0.5"
                      style={{ color: "oklch(0.55 0.03 52)" }}
                    >
                      {formatSize(mat.size)} · Uploaded {mat.uploadedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {mat.activitiesGenerated ? (
                      <span
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-semibold"
                        style={{
                          background: "oklch(0.45 0.14 160 / 0.2)",
                          color: "oklch(0.65 0.14 160)",
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Activities
                        Generated ✓
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openGenerateDialog(mat.id)}
                        className="text-xs font-ui font-semibold"
                        style={{
                          background: "oklch(0.62 0.14 52)",
                          color: "oklch(0.22 0.05 52)",
                        }}
                        data-ocid={`teacher.materials.generate.open_modal_button.${idx + 1}`}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate
                        Activities
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMaterial(mat.id)}
                      className="h-8 w-8"
                      style={{ color: "oklch(0.55 0.1 15)" }}
                      data-ocid={`teacher.materials.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: instructions card */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl p-6 space-y-4 sticky top-24"
            style={{
              background: "oklch(0.18 0.025 52)",
              border: "1px solid oklch(0.87 0.05 52)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(0.62 0.14 52 / 0.2)" }}
              >
                <Sparkles
                  className="h-4 w-4"
                  style={{ color: "oklch(0.75 0.14 52)" }}
                />
              </div>
              <h3
                className="font-display font-semibold text-base"
                style={{ color: "oklch(0.9 0.01 52)" }}
              >
                How it works
              </h3>
            </div>
            <p
              className="font-ui text-sm leading-relaxed"
              style={{ color: "oklch(0.5 0.06 52)" }}
            >
              Upload any PDF (syllabus, notes, textbook chapters). Click{" "}
              <span style={{ color: "oklch(0.75 0.14 52)" }}>
                "Generate Learning Items"
              </span>{" "}
              to instantly create{" "}
              <strong style={{ color: "oklch(0.85 0.05 52)" }}>
                50 learning items
              </strong>{" "}
              — 10 each of Activities, Worksheets, LSRW Training Tasks, Games,
              and Exercises. All appear as lessons in the course you choose,
              ready for students.
            </p>
            <Separator style={{ borderColor: "oklch(0.87 0.05 52)" }} />
            <div className="space-y-3">
              {[
                {
                  icon: "🎧",
                  skill: "Listening",
                  desc: "Audio comprehension & note-taking",
                },
                {
                  icon: "🗣️",
                  skill: "Speaking",
                  desc: "Presentation & peer discussion",
                },
                {
                  icon: "📖",
                  skill: "Reading",
                  desc: "Close reading & critical analysis",
                },
                {
                  icon: "✍️",
                  skill: "Writing",
                  desc: "Reflective summary & peer review",
                },
              ].map((item) => (
                <div key={item.skill} className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">
                    {item.icon}
                  </span>
                  <div>
                    <p
                      className="font-ui font-semibold text-xs"
                      style={{ color: "oklch(0.85 0.05 52)" }}
                    >
                      {item.skill}
                    </p>
                    <p
                      className="font-ui text-xs"
                      style={{ color: "oklch(0.55 0.03 52)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent
          style={{
            background: "oklch(0.97 0.03 52)",
            border: "1px solid oklch(0.87 0.05 52)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display"
              style={{ color: "oklch(0.22 0.05 52)" }}
            >
              Generate LSRW Activities
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p
              className="font-ui text-sm"
              style={{ color: "oklch(0.5 0.06 52)" }}
            >
              Select the course to add 50 learning items to (10 each:
              Activities, Worksheets, LSRW Tasks, Games, Exercises):
            </p>
            {selectedMaterial && (
              <div
                className="rounded-lg px-3 py-2 flex items-center gap-2"
                style={{
                  background: "oklch(0.62 0.14 52 / 0.1)",
                  border: "1px solid oklch(0.62 0.14 52 / 0.25)",
                }}
              >
                <FileText
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "oklch(0.75 0.14 52)" }}
                />
                <span
                  className="font-ui text-sm truncate"
                  style={{ color: "oklch(0.85 0.05 52)" }}
                >
                  {selectedMaterial.name}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                className="font-ui text-sm"
                style={{ color: "oklch(0.75 0.05 52)" }}
              >
                Target Course
              </Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger
                  data-ocid="teacher.materials.course.select"
                  style={{
                    background: "oklch(0.20 0.03 52)",
                    borderColor: "oklch(0.28 0.04 52)",
                    color: "oklch(0.85 0.05 52)",
                  }}
                >
                  <SelectValue placeholder="Choose a course…" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: "oklch(0.20 0.03 52)",
                    borderColor: "oklch(0.28 0.04 52)",
                  }}
                >
                  {(courses as CourseWithStats[]).map((cws) => (
                    <SelectItem
                      key={cws.course.id.toString()}
                      value={cws.course.id.toString()}
                      className="font-ui"
                      style={{ color: "oklch(0.85 0.05 52)" }}
                    >
                      {cws.course.title}
                    </SelectItem>
                  ))}
                  {(courses as CourseWithStats[]).length === 0 && (
                    <div
                      className="px-3 py-2 text-sm font-ui"
                      style={{ color: "oklch(0.55 0.03 52)" }}
                    >
                      No courses found. Create a course first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
              className="font-ui"
              style={{ color: "oklch(0.5 0.06 52)" }}
              data-ocid="teacher.materials.generate.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedCourseId || generating}
              className="font-ui font-semibold"
              style={{
                background: "oklch(0.62 0.14 52)",
                color: "oklch(0.22 0.05 52)",
              }}
              data-ocid="teacher.materials.generate.confirm_button"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate 50 Learning
                  Items
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentCertificatesPage({ studentName }: { studentName: string }) {
  const certs = getEarnedCertificates().filter(
    (c) => c.studentName === studentName,
  );
  const [selectedCert, setSelectedCert] = useState<
    import("./components/CertificateModal").CertData | null
  >(null);
  return (
    <div className="space-y-6 max-w-3xl" data-ocid="certificates.section">
      <div>
        <h1
          className="font-display text-3xl font-bold"
          style={{ color: "oklch(0.35 0.14 290)" }}
        >
          My Certificates
        </h1>
        <p className="text-muted-foreground font-ui mt-1">
          Celebrate your learning achievements!
        </p>
      </div>
      {certs.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border border-dashed card-pastel-lavender"
          data-ocid="certificates.empty_state"
        >
          <div className="text-5xl mb-3">🎓</div>
          <p
            className="font-ui font-semibold text-lg"
            style={{ color: "oklch(0.45 0.1 290)" }}
          >
            No certificates yet!
          </p>
          <p className="text-muted-foreground font-ui mt-1">
            Complete all activities in a course to earn your certificate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certs.map((cert, i) => (
            <button
              type="button"
              key={cert.courseId}
              onClick={() => setSelectedCert(cert)}
              className="rounded-2xl p-5 text-left shadow-sm border-2 hover:shadow-md transition-all"
              style={{
                background: "oklch(0.96 0.04 290)",
                borderColor: "oklch(0.85 0.08 290)",
              }}
              data-ocid={`certificates.item.${i + 1}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏆</span>
                <div>
                  <p
                    className="font-display font-bold text-lg"
                    style={{ color: "oklch(0.35 0.14 290)" }}
                  >
                    {cert.courseName}
                  </p>
                  <p className="text-sm font-ui text-muted-foreground">
                    Earned {cert.earnedAt}
                  </p>
                </div>
              </div>
              <p
                className="text-sm font-ui font-semibold"
                style={{ color: "oklch(0.55 0.14 290)" }}
              >
                View Certificate →
              </p>
            </button>
          ))}
        </div>
      )}
      <CertificateModal
        cert={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}

function StudentDashboard({
  actor,
  setView,
  studentName,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: StudentView) => void;
  studentName?: string;
}) {
  const enrolledQuery = useQuery({
    queryKey: ["enrolled"],
    queryFn: async () => {
      try {
        return await actor!.getMyEnrolledCourses();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
  const localEnrollmentsQuery = useQuery({
    queryKey: ["local-enrollments"],
    queryFn: () => getLocalEnrollments(),
    staleTime: 0,
  });
  const mergedEnrolled = [
    ...(enrolledQuery.data ?? []),
    ...(localEnrollmentsQuery.data ?? []).map((e) => ({
      courseId: BigInt(e.courseId),
      enrolledAt: BigInt(e.enrolledAt),
    })),
  ];

  const backendPublishedQuery = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => actor!.getAllCourses(),
    enabled: !!actor,
  });

  const publishedLocalForDash = getLocalCourses()
    .filter((c) => c.isPublished)
    .map(
      (c) =>
        ({
          course: {
            id: BigInt(c.id),
            title: c.title,
            description: c.description,
            teacherId: { toString: () => "local" } as any,
            createdAt: BigInt(c.createdAt),
            isPublished: true,
          },
          enrollmentCount: BigInt(0),
          lessonCount: BigInt(0),
        }) as any,
    );

  const coursesQuery = {
    isLoading: backendPublishedQuery.isLoading,
    data: [...(backendPublishedQuery.data ?? []), ...publishedLocalForDash],
  };

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => actor!.getLeaderboard(),
    enabled: !!actor,
  });

  const enrolled = mergedEnrolled;
  const courses = coursesQuery.data ?? [];
  const enrolledCourses = enrolled
    .map((e) => {
      const cws = courses.find((c) => c.course.id === e.courseId);
      return cws ? { ...cws, enrolledAt: e.enrolledAt } : null;
    })
    .filter(Boolean) as (CourseWithStats & { enrolledAt: bigint })[];

  return (
    <div className="space-y-6" data-ocid="student.dashboard.section">
      {/* Welcome banner */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 flex items-center gap-6"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.93 0.08 290) 0%, oklch(0.93 0.07 220) 50%, oklch(0.93 0.07 160) 100%)",
          border: "1.5px solid oklch(0.84 0.08 290)",
          boxShadow: "0 4px 24px oklch(0.62 0.16 290 / 0.12)",
        }}
      >
        {/* Text side */}
        <div className="flex-1 min-w-0">
          <p
            className="font-ui text-xs uppercase tracking-widest font-semibold mb-1"
            style={{ color: "oklch(0.55 0.1 290)" }}
          >
            Welcome back 👋
          </p>
          <h1
            className="font-display font-bold leading-tight mb-2"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              color: "oklch(0.26 0.14 290)",
            }}
          >
            {studentName ? `Hello, ${studentName}!` : "My Learning"}
          </h1>
          <p
            className="font-ui text-sm mb-4"
            style={{ color: "oklch(0.45 0.08 290)" }}
          >
            Your courses are ready — keep up the great work!
          </p>
          <Button
            onClick={() => setView({ page: "explore" })}
            data-ocid="student.explore.button"
            className="font-ui font-semibold shadow-sm"
            style={{
              background: "oklch(0.62 0.16 290)",
              color: "white",
              boxShadow: "0 4px 14px oklch(0.62 0.16 290 / 0.35)",
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Explore Courses
          </Button>
        </div>
        {/* Illustration */}
        <div className="shrink-0 hidden sm:block">
          <img
            src="/assets/generated/students-studying.dim_600x400.png"
            alt="Students studying"
            className="h-32 w-auto object-contain drop-shadow-md"
          />
        </div>
        {/* Decorative blobs */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30 pointer-events-none"
          style={{ background: "oklch(0.78 0.16 220)", filter: "blur(32px)" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-25 pointer-events-none"
          style={{ background: "oklch(0.78 0.16 160)", filter: "blur(24px)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-ui font-semibold text-sm text-muted-foreground uppercase tracking-widest">
            Enrolled Courses
          </h2>
          {enrolledQuery.isLoading ? (
            <div
              className="space-y-3"
              data-ocid="student.courses.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div
              className="text-center py-14 rounded-2xl border border-dashed"
              data-ocid="student.courses.empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground font-ui">
                You haven't enrolled in any courses yet.
              </p>
              <Button
                variant="link"
                onClick={() => setView({ page: "explore" })}
                data-ocid="student.courses.explore_link"
              >
                Explore courses →
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((cws, idx) => (
                <EnrolledCourseCard
                  key={String(cws.course.id)}
                  cws={cws}
                  actor={actor}
                  setView={setView}
                  index={idx + 1}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-ui font-semibold text-sm text-muted-foreground uppercase tracking-widest">
            Leaderboard
          </h2>
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              {leaderboardQuery.isLoading ? (
                <div data-ocid="leaderboard.loading_state">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : (leaderboardQuery.data ?? []).length === 0 ? (
                <p
                  className="text-sm text-muted-foreground font-ui text-center py-4"
                  data-ocid="leaderboard.empty_state"
                >
                  No activity yet.
                </p>
              ) : (
                (leaderboardQuery.data ?? []).slice(0, 5).map((entry, i) => (
                  <div
                    key={String(entry.studentId)}
                    className="flex items-center gap-3"
                    data-ocid={`leaderboard.item.${i + 1}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-ui ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-ui truncate">
                      {entry.name}
                    </span>
                    <span className="text-xs font-semibold text-primary font-ui">
                      {Number(entry.totalXp)} XP
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EnrolledCourseCard({
  cws,
  actor,
  setView,
  index,
}: {
  cws: CourseWithStats & { enrolledAt: bigint };
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: StudentView) => void;
  index: number;
}) {
  const progressQuery = useQuery({
    queryKey: ["progress", String(cws.course.id)],
    queryFn: () => actor!.getMyProgress(cws.course.id),
    enabled: !!actor,
  });

  const progress = progressQuery.data;
  const total = progress ? Number(progress.totalLessons) : 0;
  const completed = progress ? Number(progress.completedLessons) : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-card transition-all group"
      onClick={() => setView({ page: "course", courseId: cws.course.id })}
      data-ocid={`student.courses.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold font-ui truncate">
              {cws.course.title}
            </h3>
            <p className="text-sm text-muted-foreground font-ui truncate">
              {cws.course.description}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Progress value={pct} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground whitespace-nowrap font-ui">
                {progress ? `${completed}/${total}` : "…"}
              </span>
              {progress && (
                <span className="text-xs font-semibold text-primary font-ui">
                  {Number(progress.totalXp)} XP
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Explore ──────────────────────────────────────────────────────────────────
function ExplorePage({
  actor,
  setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: StudentView) => void;
}) {
  const qc = useQueryClient();
  const backendPublishedBrowse = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      try {
        return await actor!.getAllCourses();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    retry: 3,
    retryDelay: 1000,
  });

  const publishedLocalBrowse = getLocalCourses()
    .filter((c) => c.isPublished)
    .map(
      (c) =>
        ({
          course: {
            id: BigInt(c.id),
            title: c.title,
            description: c.description,
            teacherId: { toString: () => "local" } as any,
            createdAt: BigInt(c.createdAt),
            isPublished: true,
          },
          enrollmentCount: BigInt(0),
          lessonCount: BigInt(0),
        }) as any,
    );

  const coursesQuery = {
    isLoading: backendPublishedBrowse.isLoading,
    data: [...(backendPublishedBrowse.data ?? []), ...publishedLocalBrowse],
  };

  const enrolledQuery = useQuery({
    queryKey: ["enrolled"],
    queryFn: async () => {
      try {
        return await actor!.getMyEnrolledCourses();
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
  const localEnrollmentsQueryBrowse = useQuery({
    queryKey: ["local-enrollments"],
    queryFn: () => getLocalEnrollments(),
    staleTime: 0,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: bigint) => {
      saveLocalEnrollment(Number(courseId));
      qc.invalidateQueries({ queryKey: ["local-enrollments"] });
      // also try backend (non-blocking)
      try {
        await actor?.enrollInCourse(courseId);
      } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrolled"] });
      toast.success("Enrolled!");
    },
    onError: () => toast.error("Failed to enroll"),
  });

  const mergedEnrolledBrowse = [
    ...(enrolledQuery.data ?? []),
    ...(localEnrollmentsQueryBrowse.data ?? []).map((e) => ({
      courseId: BigInt(e.courseId),
      enrolledAt: BigInt(e.enrolledAt),
    })),
  ];
  const enrolledIds = new Set(
    mergedEnrolledBrowse.map((e) => String(e.courseId)),
  );

  return (
    <div className="space-y-6" data-ocid="explore.section">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView({ page: "dashboard" })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="explore.link"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Explore Courses</h1>
          <p className="text-sm text-muted-foreground font-ui">
            Discover and enroll in published courses
          </p>
        </div>
      </div>
      {coursesQuery.isLoading ? (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="explore.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (coursesQuery.data ?? []).length === 0 ? (
        <div className="text-center py-16" data-ocid="explore.empty_state">
          <p className="text-muted-foreground font-ui mb-4">
            No courses available yet.
          </p>
          <button
            type="button"
            onClick={() => backendPublishedBrowse.refetch()}
            className="text-sm bg-teal-500 text-white px-4 py-2 rounded-lg font-ui hover:bg-teal-600 transition-colors"
            data-ocid="explore.refresh.button"
          >
            Refresh Courses
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(coursesQuery.data ?? []).map((cws, idx) => {
            const isEnrolled = enrolledIds.has(String(cws.course.id));
            return (
              <Card
                key={String(cws.course.id)}
                className="flex flex-col shadow-card"
                data-ocid={`explore.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-ui">
                    {cws.course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 font-ui">
                    {cws.course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-3">
                  <div className="flex gap-3 text-xs text-muted-foreground font-ui">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {Number(cws.lessonCount)}{" "}
                      lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />{" "}
                      {Number(cws.enrollmentCount)} students
                    </span>
                  </div>
                  {isEnrolled ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setView({ page: "course", courseId: cws.course.id })
                      }
                      data-ocid={`explore.secondary_button.${idx + 1}`}
                    >
                      Continue Learning
                    </Button>
                  ) : (
                    <Button
                      onClick={() => enrollMutation.mutate(cws.course.id)}
                      disabled={enrollMutation.isPending}
                      data-ocid={`explore.primary_button.${idx + 1}`}
                    >
                      {enrollMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Enroll
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Course Page ──────────────────────────────────────────────────────────────
function CoursePage({
  actor,
  courseId,
  setView,
  isTeacher,
  onBack,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  courseId: bigint;
  setView: (v: StudentView) => void;
  isTeacher: boolean;
  onBack?: () => void;
}) {
  const coursesQuery = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => actor!.getAllCourses(),
    enabled: !!actor,
  });
  const lessonsQuery = useQuery({
    queryKey: ["lessons", String(courseId)],
    queryFn: async () => {
      try {
        return await actor!.getLessons(courseId);
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
  const localLessonsQuery1 = useQuery({
    queryKey: ["local-lessons", String(courseId)],
    queryFn: () =>
      getLocalLessons().filter((l) => l.courseId === Number(courseId)),
    staleTime: 0,
  });
  const progressQuery = useQuery({
    queryKey: ["progress", String(courseId)],
    queryFn: () => actor!.getMyProgress(courseId),
    enabled: !!actor && !isTeacher,
  });

  const cws = (coursesQuery.data ?? []).find((c) => c.course.id === courseId);
  const localLessonsRaw1 = localLessonsQuery1.data ?? [];
  const lessons = [
    ...(lessonsQuery.data ?? []),
    ...localLessonsRaw1.map((l) => ({
      id: BigInt(l.id),
      courseId: BigInt(l.courseId),
      title: l.title,
      content: l.content,
      orderIndex: BigInt(l.orderIndex),
      createdAt: BigInt(0),
    })),
  ];

  return (
    <div className="space-y-6" data-ocid="course.section">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : setView({ page: "dashboard" }))}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="course.link"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          {cws ? (
            <>
              <h1 className="font-display text-2xl font-bold">
                {cws.course.title}
              </h1>
              <p className="text-muted-foreground text-sm font-ui">
                {cws.course.description}
              </p>
            </>
          ) : (
            <Skeleton className="h-8 w-64" />
          )}
        </div>
        {isTeacher && cws && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
            data-ocid="course.edit_button"
          >
            <Edit3 className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
      </div>

      {!isTeacher && progressQuery.data && (
        <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <Award className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium font-ui">
                {Number(progressQuery.data.completedLessons)}/
                {Number(progressQuery.data.totalLessons)} lessons
              </span>
              <span className="text-sm text-primary font-semibold font-ui">
                {Number(progressQuery.data.totalXp)} XP
              </span>
            </div>
            <Progress
              value={
                Number(progressQuery.data.totalLessons) > 0
                  ? (Number(progressQuery.data.completedLessons) /
                      Number(progressQuery.data.totalLessons)) *
                    100
                  : 0
              }
              className="h-2"
            />
          </div>
        </div>
      )}

      <div className="space-y-2" data-ocid="course.list">
        {lessonsQuery.isLoading ? (
          <div data-ocid="course.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-8" data-ocid="course.empty_state">
            <p className="text-muted-foreground font-ui">No lessons yet.</p>
          </div>
        ) : (
          lessons.map((lesson, idx) => (
            <LessonRow
              key={String(lesson.id)}
              lesson={lesson}
              actor={actor}
              isTeacher={isTeacher}
              index={idx + 1}
              onClick={() =>
                setView({
                  page: "lesson",
                  lessonId: lesson.id,
                  courseId,
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  actor,
  isTeacher,
  index,
  onClick,
}: {
  lesson: Lesson;
  actor: ReturnType<typeof useActor>["actor"];
  isTeacher: boolean;
  index: number;
  onClick: () => void;
}) {
  const completeQuery = useQuery({
    queryKey: ["lesson-complete", String(lesson.id)],
    queryFn: () => actor!.isLessonComplete(lesson.id),
    enabled: !!actor && !isTeacher,
  });

  const isComplete = completeQuery.data ?? false;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-card hover:border-primary/30 transition-all text-left group"
      data-ocid={`course.item.${index}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-ui shrink-0 ${
          isComplete
            ? "bg-green-100 text-green-600"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium font-ui truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground font-ui">Lesson {index}</p>
      </div>
      <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ─── Lesson Page ──────────────────────────────────────────────────────────────
function LessonPage({
  actor,
  lessonId,
  courseId,
  setView,
  isTeacher,
  studentName: _studentName,
  onCertificateEarned,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  lessonId: bigint;
  courseId: bigint;
  setView: (v: StudentView) => void;
  isTeacher: boolean;
  studentName?: string;
  onCertificateEarned?: (courseId: bigint, courseName: string) => void;
}) {
  const qc = useQueryClient();

  const lessonsQuery = useQuery({
    queryKey: ["lessons", String(courseId)],
    queryFn: async () => {
      try {
        return await actor!.getLessons(courseId);
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
  const localLessonsQuery2 = useQuery({
    queryKey: ["local-lessons", String(courseId)],
    queryFn: () =>
      getLocalLessons().filter((l) => l.courseId === Number(courseId)),
    staleTime: 0,
  });

  const { celebration: lessonCelebration, triggerCelebration } =
    useCelebration();

  const isLocalLesson = getLocalLessons().some(
    (l) => l.id === Number(lessonId),
  );

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (isLocalLesson) {
        markLocalLessonComplete(Number(lessonId));
        return;
      }
      return actor!.markLessonComplete(lessonId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-complete", String(lessonId)] });
      qc.invalidateQueries({ queryKey: ["progress", String(courseId)] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      if (!isLocalLesson) toast.success("+10 XP! Lesson marked complete.");
      triggerCelebration(pickRandom(COMPLETE_MESSAGES));
      // Certificate check: if all local lessons for this course are complete, award cert
      if (isLocalLesson && onCertificateEarned) {
        const allLessons = getLocalLessons().filter(
          (l) => l.courseId === Number(courseId),
        );
        const justCompleted = getCompletedLocalLessons();
        justCompleted.add(Number(lessonId));
        const allDone =
          allLessons.length > 0 &&
          allLessons.every((l) => justCompleted.has(l.id));
        if (allDone) {
          const localCourse = getLocalCourses().find(
            (c) => c.id === Number(courseId),
          );
          const courseName = localCourse?.title ?? "this course";
          const certKey = `eduloom_cert_shown_${courseId}`;
          if (!localStorage.getItem(certKey)) {
            localStorage.setItem(certKey, "1");
            onCertificateEarned(courseId, courseName);
          }
        }
      }
    },
  });

  const completeQuery = useQuery({
    queryKey: ["lesson-complete", String(lessonId)],
    queryFn: () => {
      if (isLocalLesson)
        return getCompletedLocalLessons().has(Number(lessonId));
      return actor!.isLessonComplete(lessonId);
    },
    enabled: !isTeacher,
  });

  const localLessonsRaw2 = localLessonsQuery2.data ?? [];
  const allLessons2 = [
    ...(lessonsQuery.data ?? []),
    ...localLessonsRaw2.map((l) => ({
      id: BigInt(l.id),
      courseId: BigInt(l.courseId),
      title: l.title,
      content: l.content,
      orderIndex: BigInt(l.orderIndex),
      createdAt: BigInt(0),
    })),
  ];
  const lesson = allLessons2.find((l) => l.id === lessonId);

  return (
    <div className="space-y-8 max-w-3xl" data-ocid="lesson.section">
      <CelebrationOverlay
        visible={lessonCelebration.visible}
        message={lessonCelebration.message}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView({ page: "course", courseId })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="lesson.link"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          {lesson ? (
            <h1 className="font-display text-2xl font-bold">{lesson.title}</h1>
          ) : (
            <Skeleton className="h-8 w-64" />
          )}
        </div>
      </div>

      {lesson ? (
        <>
          {isLocalLesson ? (
            <InteractiveLessonView
              lesson={lesson as unknown as LocalLesson}
              onComplete={() => completeMutation.mutate()}
              isCompleted={!!completeQuery.data}
              isPending={completeMutation.isPending}
            />
          ) : (
            <div className="prose-sm max-w-none">
              <LessonContent content={lesson.content} />
            </div>
          )}

          {!isTeacher && !isLocalLesson && (
            <div className="pt-4">
              {completeQuery.data ? (
                <div
                  className="flex items-center gap-2 text-green-600 font-medium font-ui"
                  data-ocid="lesson.success_state"
                >
                  <CheckCircle2 className="h-5 w-5" /> Completed!
                </div>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto bg-violet-500 hover:bg-violet-600 text-white font-semibold text-base"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  data-ocid="lesson.complete.button"
                  aria-label="Complete and submit this lesson"
                >
                  {completeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Complete & Submit
                </Button>
              )}
            </div>
          )}

          <Separator />
          <QuizSection actor={actor} lessonId={lessonId} />
          <Separator />
          <DiscussionSection actor={actor} lessonId={lessonId} />
        </>
      ) : null}
    </div>
  );
}

// ─── ELP Vocabulary for games/exercises ───────────────────────────────────────
const ELP_VOCAB = [
  { term: "Phonology", def: "The study of sound systems in language" },
  { term: "Morphology", def: "The study of word structure and formation" },
  { term: "Syntax", def: "Rules governing sentence structure" },
  { term: "Semantics", def: "The study of meaning in language" },
  { term: "Pragmatics", def: "Language use in social context" },
  { term: "Discourse", def: "Language beyond the sentence level" },
  { term: "Scaffolding", def: "Temporary support to aid learning" },
  { term: "CLT", def: "Communicative Language Teaching approach" },
  { term: "Fluency", def: "Smooth, natural language production" },
  { term: "Accuracy", def: "Correct use of language forms" },
];

const MCQ_QUESTIONS = [
  {
    q: "Which approach emphasises meaningful communication over drills?",
    opts: ["Grammar-Translation", "CLT", "Audio-lingual", "Silent Way"],
    ans: 1,
  },
  {
    q: "Krashen's 'affective filter' refers to:",
    opts: [
      "Grammar rules",
      "Emotional barriers to acquisition",
      "Vocabulary size",
      "Reading speed",
    ],
    ans: 1,
  },
  {
    q: "ZPD stands for:",
    opts: [
      "Zone of Personal Development",
      "Zone of Proximal Development",
      "Zero-Point Drill",
      "Zone of Practical Discourse",
    ],
    ans: 1,
  },
  {
    q: "Task-Based Learning (TBL) focuses on:",
    opts: [
      "Memorising grammar tables",
      "Completing real-world tasks",
      "Teacher-centred lectures",
      "Silent reading only",
    ],
    ans: 1,
  },
  {
    q: "Code-switching means:",
    opts: [
      "Writing in code",
      "Switching between languages/dialects",
      "Changing font",
      "Translating word-for-word",
    ],
    ans: 1,
  },
];

// ─── Complete & Submit Button ─────────────────────────────────────────────────
function CompleteButton({
  onComplete,
  isPending,
  isCompleted,
}: {
  onComplete: () => void;
  isPending: boolean;
  isCompleted: boolean;
}) {
  if (isCompleted) {
    return (
      <div
        className="flex items-center gap-2 justify-center py-4 text-green-600 font-semibold font-ui text-lg"
        data-ocid="lesson.success_state"
      >
        <CheckCircle2 className="h-6 w-6" /> Completed! Well done!
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onComplete}
      disabled={isPending}
      data-ocid="lesson.complete.button"
      aria-label="Complete and submit this lesson"
      className="w-full mt-6 py-4 px-8 rounded-xl bg-violet-500 hover:bg-violet-600 active:bg-violet-700 disabled:opacity-60 text-white font-bold text-lg font-ui transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5" /> Complete & Submit
        </span>
      )}
    </button>
  );
}

// ─── Activity View ────────────────────────────────────────────────────────────
function ActivityView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const lines = lesson.content.split("\n");
  const steps = lines.filter((l) => /^\d+\./.test(l.trim()));
  const [checked, setChecked] = useState<boolean[]>(steps.map(() => false));
  const [reflection, setReflection] = useState("");

  const toggleStep = (i: number) => {
    setChecked((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-base font-ui">Activity Steps</h3>
        {steps.length > 0 ? (
          <ol className="space-y-3">
            {steps.map((step, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              <li key={i} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(i)}
                  data-ocid={`activity.checkbox.${i + 1}`}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked[i] ? "bg-violet-500 border-violet-500" : "border-muted-foreground"}`}
                  aria-label={`Mark step ${i + 1} complete`}
                >
                  {checked[i] && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </button>
                <span
                  className={`font-ui text-sm leading-relaxed ${checked[i] ? "line-through text-muted-foreground" : ""}`}
                >
                  {step.replace(/^\d+\.\s*/, "")}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <LessonContent content={lesson.content} />
        )}
      </div>
      <div className="space-y-2">
        <label className="font-ui text-sm font-semibold" htmlFor="reflection">
          Reflection: What did you learn from this activity?
        </label>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write your reflection here..."
          data-ocid="activity.textarea"
          rows={4}
          className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        />
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Worksheet View ───────────────────────────────────────────────────────────
function WorksheetView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const t = lesson.title;
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [tfAnswers, setTfAnswers] = useState<string[]>(Array(5).fill(""));

  const setAnswer = (i: number, v: string) =>
    setAnswers((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
  const setTf = (i: number, v: string) =>
    setTfAnswers((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });

  const tfStatements = [
    "Communicative competence includes both linguistic and sociolinguistic knowledge.",
    "The grammar-translation method is the dominant approach in modern CLT classrooms.",
    "Scaffolding is only useful for beginner learners.",
    "Task-based learning focuses on completing meaningful, real-world tasks.",
    "Code-switching always indicates a lack of language proficiency.",
  ];

  const vocabPairs = ELP_VOCAB.slice(0, 5);

  if (t.includes("True / False") || t.includes("True/False")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">True / False / Not Given</h3>
          <p className="text-sm text-muted-foreground font-ui">
            Read each statement and select: True, False, or Not Given.
          </p>
          {tfStatements.map((stmt, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              className="space-y-2 border-b border-border pb-4 last:border-0"
            >
              <p className="font-ui text-sm font-medium">
                {i + 1}. {stmt}
              </p>
              <div className="flex gap-4">
                {["True", "False", "Not Given"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer font-ui text-sm"
                  >
                    <input
                      type="radio"
                      name={`tf-${i}`}
                      value={opt}
                      checked={tfAnswers[i] === opt}
                      onChange={() => setTf(i, opt)}
                      data-ocid={`worksheet.radio.${i + 1}`}
                      className="accent-teal-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Vocabulary")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">Vocabulary Matching</h3>
          <p className="text-sm text-muted-foreground font-ui">
            Write the correct definition for each term.
          </p>
          {vocabPairs.map((v, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-1">
              <label
                className="font-ui text-sm font-semibold"
                htmlFor={`vocab-${i}`}
              >
                {v.term}
              </label>
              <input
                id={`vocab-${i}`}
                type="text"
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Enter definition..."
                data-ocid={`worksheet.input.${i + 1}`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-ui text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Comprehension") || t.includes("Key Concepts")) {
    const prompts = [
      "What is the central argument of this material?",
      "What evidence supports the main claim?",
      "How does this connect to broader themes in your course?",
    ];
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">Comprehension Questions</h3>
          {prompts.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-2">
              <label
                className="font-ui text-sm font-semibold"
                htmlFor={`comp-${i}`}
              >
                {i + 1}. {p}
              </label>
              <textarea
                id={`comp-${i}`}
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Your answer..."
                data-ocid={`worksheet.textarea.${i + 1}`}
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <LessonContent content={lesson.content} />
        <div className="space-y-2 pt-2">
          <label
            className="font-ui text-sm font-semibold"
            htmlFor="ws-response"
          >
            Your Response
          </label>
          <textarea
            id="ws-response"
            value={answers[0]}
            onChange={(e) => setAnswer(0, e.target.value)}
            placeholder="Write your response here..."
            data-ocid="worksheet.textarea"
            rows={5}
            className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          />
        </div>
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── LSRW View ────────────────────────────────────────────────────────────────
function LSRWView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const [response, setResponse] = useState("");
  const title = lesson.title;
  const label = title.includes("Listening")
    ? "Your notes"
    : title.includes("Speaking")
      ? "Your presentation outline"
      : title.includes("Reading")
        ? "Your reading notes"
        : "Your paragraph";

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <LessonContent content={lesson.content} />
      </div>
      <div className="space-y-2">
        <label
          className="font-ui text-sm font-semibold"
          htmlFor="lsrw-response"
        >
          {label}
        </label>
        <textarea
          id="lsrw-response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder={`Write ${label.toLowerCase()} here...`}
          data-ocid="lsrw.textarea"
          rows={6}
          className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        />
        <p className="text-xs text-muted-foreground font-ui text-right">
          {response.trim() ? response.trim().split(/\s+/).length : 0} words
        </p>
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Exercise View ────────────────────────────────────────────────────────────
function ExerciseView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const t = lesson.title;
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [mcqSelected, setMcqSelected] = useState<Record<number, number>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [selfCheck, setSelfCheck] = useState<string[]>(Array(5).fill(""));

  const setAnswer = (i: number, v: string) =>
    setAnswers((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
  const setSelf = (i: number, v: string) =>
    setSelfCheck((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });

  const gapSentences = [
    "___________ refers to the emotional barriers that can prevent language acquisition.",
    "The ___________ method focuses on communicative competence over grammar rules.",
    "Vygotsky introduced the concept of the ___________ to describe supported learning.",
    "___________ is the study of how context influences meaning in communication.",
    "Teachers use ___________ to bridge the gap between what students know and new content.",
  ];

  const selfItems = [
    "I can define the 10 key terms from this material",
    "I can explain the central argument in my own words",
    "I can give 3 real-world examples related to this content",
    "I can identify strengths and weaknesses in the argument",
    "I can apply this content to a new scenario",
  ];

  const paraphraseSentences = [
    "Communicative competence is essential for effective language use in real-world contexts.",
    "Scaffolding provides temporary support that enables learners to accomplish tasks beyond their current ability.",
    "Task-based learning emphasises the completion of meaningful tasks as the primary vehicle for language acquisition.",
  ];

  const errorSamples = [
    "CLT stands for Critical Language Theory and focuses on memorisation of grammar rules.",
    "Scaffolding means permanently simplifying tasks so students never face challenges.",
    "Code-switching is always a sign that a student has failed to learn the target language properly.",
  ];

  if (t.includes("Multiple Choice") || t.includes("MCQ")) {
    const score = MCQ_QUESTIONS.filter(
      (q, i) => mcqSelected[i] === q.ans,
    ).length;
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">Multiple Choice Quiz</h3>
          {MCQ_QUESTIONS.map((q, qi) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={qi}
              className="space-y-2 border-b border-border pb-4 last:border-0"
            >
              <p className="font-ui text-sm font-semibold">
                {qi + 1}. {q.q}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {q.opts.map((opt, oi) => {
                  const isSelected = mcqSelected[qi] === oi;
                  const isCorrect = oi === q.ans;
                  let cls =
                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer font-ui text-sm transition-colors ";
                  if (mcqSubmitted) {
                    if (isCorrect)
                      cls += "border-green-500 bg-green-50 text-green-800";
                    else if (isSelected)
                      cls += "border-red-400 bg-red-50 text-red-800";
                    else cls += "border-border";
                  } else {
                    cls += isSelected
                      ? "border-teal-500 bg-teal-50"
                      : "border-border hover:border-teal-300";
                  }
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <label key={oi} className={cls}>
                      <input
                        type="radio"
                        name={`mcq-${qi}`}
                        disabled={mcqSubmitted}
                        checked={isSelected}
                        onChange={() =>
                          setMcqSelected((prev) => ({ ...prev, [qi]: oi }))
                        }
                        data-ocid={`exercise.radio.${qi + 1}`}
                        className="accent-teal-600"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {!mcqSubmitted ? (
            <button
              type="button"
              onClick={() => setMcqSubmitted(true)}
              data-ocid="exercise.submit_button"
              className="px-6 py-2 rounded-lg bg-violet-500 text-white font-ui font-semibold text-sm hover:bg-violet-600 transition-colors"
            >
              Check Answers
            </button>
          ) : (
            <div className="font-ui font-semibold text-teal-700 bg-teal-50 rounded-lg p-3">
              Score: {score}/{MCQ_QUESTIONS.length} —{" "}
              {score >= 4
                ? "Excellent!"
                : score >= 3
                  ? "Good job!"
                  : "Keep practising!"}
            </div>
          )}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Gap Fill")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">Gap Fill Exercise</h3>
          <p className="text-sm text-muted-foreground font-ui">
            Fill in the blanks with the correct word or phrase.
          </p>
          {gapSentences.map((s, i) => {
            const parts = s.split("___________");
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                key={i}
                className="flex flex-wrap items-center gap-1 font-ui text-sm"
              >
                <span>{i + 1}.</span>
                <span>{parts[0]}</span>
                <input
                  type="text"
                  value={answers[i]}
                  onChange={(e) => setAnswer(i, e.target.value)}
                  data-ocid={`exercise.input.${i + 1}`}
                  className="inline-block w-36 border-b-2 border-teal-500 bg-transparent px-1 py-0.5 focus-visible:outline-none text-teal-700 font-semibold"
                  placeholder="..."
                />
                <span>{parts[1]}</span>
              </div>
            );
          })}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Self-Assessment")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">Self-Assessment Checklist</h3>
          {selfItems.map((item, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border pb-3 last:border-0"
            >
              <p className="font-ui text-sm flex-1">{item}</p>
              <div className="flex gap-3">
                {["Confident", "Partially", "Need Review"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-1 font-ui text-xs cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`self-${i}`}
                      value={opt}
                      checked={selfCheck[i] === opt}
                      onChange={() => setSelf(i, opt)}
                      data-ocid={`exercise.radio.${i + 1}`}
                      className="accent-teal-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Extended Writing") || t.includes("Writing")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <LessonContent content={lesson.content} />
          <textarea
            value={answers[0]}
            onChange={(e) => setAnswer(0, e.target.value)}
            placeholder="Write your extended response here (aim for 300 words)..."
            data-ocid="exercise.textarea"
            rows={10}
            className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          />
          <p className="text-xs text-muted-foreground font-ui text-right">
            {answers[0].trim() ? answers[0].trim().split(/\s+/).length : 0} /
            300 words
          </p>
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Short Answer")) {
    const prompts = [
      "What is the central argument of this material?",
      "Name two key concepts discussed.",
      "What evidence supports the main claim?",
      "How does this topic connect to language teaching?",
      "What is one real-world application of this material?",
    ];
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">Short Answer Questions</h3>
          {prompts.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-1">
              <label
                className="font-ui text-sm font-semibold"
                htmlFor={`sa-${i}`}
              >
                {i + 1}. {p}
              </label>
              <input
                id={`sa-${i}`}
                type="text"
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Your answer..."
                data-ocid={`exercise.input.${i + 1}`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-ui text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Paraphrasing")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">Paraphrasing Practice</h3>
          <p className="text-sm text-muted-foreground font-ui">
            Rewrite each sentence in your own words without changing the
            meaning.
          </p>
          {paraphraseSentences.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-2">
              <p className="font-ui text-sm italic bg-muted px-3 py-2 rounded-lg">
                {s}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Your paraphrase..."
                data-ocid={`exercise.textarea.${i + 1}`}
                rows={2}
                className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Error Correction")) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">Error Correction</h3>
          <p className="text-sm text-muted-foreground font-ui">
            Identify the error in each statement and rewrite it correctly.
          </p>
          {errorSamples.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-2">
              <p className="font-ui text-sm bg-red-50 text-red-800 border border-red-200 px-3 py-2 rounded-lg">
                {s}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Corrected version..."
                data-ocid={`exercise.textarea.${i + 1}`}
                rows={2}
                className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("True / False") || t.includes("True/False")) {
    const tfEx = [
      "CLT stands for Communicative Language Teaching.",
      "The affective filter always improves language acquisition.",
      "Phonology is the study of sentence structure.",
      "Scaffolding is a concept from Vygotsky's theory.",
      "Task-based learning avoids the use of real-world tasks.",
    ];
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">True / False / Not Given</h3>
          {tfEx.map((stmt, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              className="space-y-2 border-b border-border pb-3 last:border-0"
            >
              <p className="font-ui text-sm font-medium">
                {i + 1}. {stmt}
              </p>
              <div className="flex gap-4">
                {["True", "False", "Not Given"].map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer font-ui text-sm"
                  >
                    <input
                      type="radio"
                      name={`ex-tf-${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      onChange={() => setAnswer(i, opt)}
                      data-ocid={`exercise.radio.${i + 1}`}
                      className="accent-teal-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Comprehension")) {
    const cqPrompts = [
      "What is the central argument?",
      "What evidence is provided?",
      "What assumptions underlie the main claims?",
      "What limitations are acknowledged?",
      "How does this connect to broader themes?",
    ];
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">Comprehension Questions</h3>
          {cqPrompts.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <div key={i} className="space-y-1">
              <label
                className="font-ui text-sm font-semibold"
                htmlFor={`cq-${i}`}
              >
                {i + 1}. {p}
              </label>
              <textarea
                id={`cq-${i}`}
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Your answer..."
                data-ocid={`exercise.textarea.${i + 1}`}
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          ))}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  // default
  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5">
        <LessonContent content={lesson.content} />
        <div className="mt-4 space-y-2">
          <label className="font-ui text-sm font-semibold" htmlFor="ex-default">
            Your Response
          </label>
          <textarea
            id="ex-default"
            value={answers[0]}
            onChange={(e) => setAnswer(0, e.target.value)}
            placeholder="Write your response here..."
            data-ocid="exercise.textarea"
            rows={5}
            className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          />
        </div>
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Memory Match Game ────────────────────────────────────────────────────────
function MemoryMatchGame({
  onComplete,
  isCompleted,
  isPending,
}: {
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const pairs = ELP_VOCAB.slice(0, 8);
  type Card = {
    id: number;
    content: string;
    type: "term" | "def";
    pairId: number;
    flipped: boolean;
    matched: boolean;
  };
  const makeCards = (): Card[] => {
    const cards: Card[] = [];
    pairs.forEach((p, i) => {
      cards.push({
        id: i * 2,
        content: p.term,
        type: "term",
        pairId: i,
        flipped: false,
        matched: false,
      });
      cards.push({
        id: i * 2 + 1,
        content: p.def,
        type: "def",
        pairId: i,
        flipped: false,
        matched: false,
      });
    });
    return cards.sort(() => Math.random() - 0.5);
  };
  const [cards, setCards] = useState<Card[]>(makeCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const allMatched = cards.every((c) => c.matched);

  const flip = (idx: number) => {
    if (selected.length === 2 || cards[idx].flipped || cards[idx].matched)
      return;
    const newSelected = [...selected, idx];
    const newCards = cards.map((c, i) =>
      i === idx ? { ...c, flipped: true } : c,
    );
    setCards(newCards);
    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected;
      if (
        newCards[a].pairId === newCards[b].pairId &&
        newCards[a].type !== newCards[b].type
      ) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, matched: true } : c,
            ),
          );
          setSelected([]);
        }, 600);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, flipped: false } : c,
            ),
          );
          setSelected([]);
        }, 800);
      }
    } else {
      setSelected(newSelected);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold font-ui">Memory Match</h3>
          <span className="text-sm text-muted-foreground font-ui">
            Moves: {moves}
          </span>
        </div>
        <p className="text-sm text-muted-foreground font-ui">
          Match each term to its definition. Click two cards to flip them.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(i)}
              data-ocid={`game.canvas_target.${i + 1}`}
              className={`aspect-square rounded-lg border-2 p-1 text-xs font-ui font-semibold transition-all cursor-pointer ${
                card.matched
                  ? "border-green-500 bg-green-100 text-green-800"
                  : card.flipped
                    ? (
                        card.type === "term"
                          ? "border-teal-500 bg-teal-50 text-teal-800"
                          : "border-amber-500 bg-amber-50 text-amber-800"
                      )
                    : "border-border bg-muted hover:bg-muted/60"
              }`}
            >
              {card.flipped || card.matched ? card.content : "?"}
            </button>
          ))}
        </div>
        {allMatched && (
          <div className="text-center font-ui font-semibold text-green-700 bg-green-50 rounded-lg p-3">
            🎉 All matched in {moves} moves!
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setCards(makeCards());
            setSelected([]);
            setMoves(0);
          }}
          className="text-sm text-muted-foreground underline font-ui hover:text-foreground"
        >
          Reset Game
        </button>
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Bingo Game ───────────────────────────────────────────────────────────────
function BingoGame({
  onComplete,
  isCompleted,
  isPending,
}: {
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const allTerms = [
    "Phonology",
    "Morphology",
    "Syntax",
    "Semantics",
    "Pragmatics",
    "Discourse",
    "Scaffolding",
    "CLT",
    "Fluency",
    "Accuracy",
    "ZPD",
    "TBL",
    "Input",
    "Affective",
    "Register",
    "Cohesion",
  ];
  const [grid] = useState(() =>
    allTerms.sort(() => Math.random() - 0.5).slice(0, 16),
  );
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [won, setWon] = useState(false);

  const toggle = (i: number) => {
    const newMarked = new Set(marked);
    if (newMarked.has(i)) newMarked.delete(i);
    else newMarked.add(i);
    setMarked(newMarked);
    // Check rows/cols/diag
    const lines = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
      [0, 5, 10, 15],
      [3, 6, 9, 12],
    ];
    if (lines.some((line) => line.every((pos) => newMarked.has(pos))))
      setWon(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold font-ui">Vocabulary Bingo</h3>
        <p className="text-sm text-muted-foreground font-ui">
          Click to mark terms as the teacher calls them. Get 4 in a row to win!
        </p>
        <div className="grid grid-cols-4 gap-2">
          {grid.map((term, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              type="button"
              onClick={() => toggle(i)}
              data-ocid={`game.canvas_target.${i + 1}`}
              className={`py-3 px-1 rounded-lg border-2 text-xs font-ui font-semibold transition-all ${
                marked.has(i)
                  ? "border-teal-500 bg-teal-100 text-teal-800"
                  : "border-border hover:border-teal-300"
              }`}
            >
              {term}
            </button>
          ))}
        </div>
        {won && (
          <div className="text-center font-ui font-semibold text-teal-700 bg-teal-50 rounded-lg p-3">
            🎉 BINGO! You got 4 in a row!
          </div>
        )}
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Game View ────────────────────────────────────────────────────────────────
function CrosswordGame({
  onComplete,
  isCompleted,
  isPending,
}: {
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const clues = [
    {
      dir: "1 Across",
      clue: "Study of sound systems in language",
      ans: "Phonology",
    },
    {
      dir: "2 Down",
      clue: "Temporary support to aid learning",
      ans: "Scaffolding",
    },
    { dir: "3 Across", clue: "Study of meaning in language", ans: "Semantics" },
    {
      dir: "4 Down",
      clue: "Smooth, natural language production",
      ans: "Fluency",
    },
    {
      dir: "5 Across",
      clue: "Communicative Language Teaching (abbr)",
      ans: "CLT",
    },
  ];
  const [cAnswers, setCAnswers] = useState<string[]>(Array(5).fill(""));
  const setCA = (i: number, v: string) =>
    setCAnswers((p) => {
      const n = [...p];
      n[i] = v;
      return n;
    });
  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold font-ui">🔤 Crossword Puzzle</h3>
        <p className="text-sm text-muted-foreground font-ui">
          Fill in the answers using the clues below.
        </p>
        {clues.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          <div key={i} className="space-y-1">
            <label
              className="font-ui text-sm font-semibold"
              htmlFor={`cw-${i}`}
            >
              {c.dir}: {c.clue}
            </label>
            <input
              id={`cw-${i}`}
              type="text"
              value={cAnswers[i]}
              onChange={(e) => setCA(i, e.target.value)}
              placeholder="Answer..."
              data-ocid={`game.input.${i + 1}`}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-ui text-sm uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
          </div>
        ))}
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

function GameView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const t = lesson.title;
  const [started, setStarted] = useState(false);
  const [response, setResponse] = useState("");
  const [quizSelected, setQuizSelected] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [round, setRound] = useState(0);

  if (t.includes("Memory Match")) {
    return (
      <MemoryMatchGame
        onComplete={onComplete}
        isCompleted={isCompleted}
        isPending={isPending}
      />
    );
  }

  if (t.includes("Bingo")) {
    return (
      <BingoGame
        onComplete={onComplete}
        isCompleted={isCompleted}
        isPending={isPending}
      />
    );
  }

  if (t.includes("Quiz Bowl") || t.includes("Kahoot")) {
    const score = MCQ_QUESTIONS.filter(
      (q, i) => quizSelected[i] === q.ans,
    ).length;
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold font-ui">
            {t.includes("Kahoot") ? "⚡ Kahoot-Style Quiz" : "🏆 Quiz Bowl"}
          </h3>
          {MCQ_QUESTIONS.map((q, qi) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={qi}
              className="space-y-2 border-b border-border pb-4 last:border-0"
            >
              <p className="font-ui text-sm font-semibold">
                {qi + 1}. {q.q}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.opts.map((opt, oi) => {
                  const colors = [
                    "bg-red-100 border-red-300 text-red-800",
                    "bg-blue-100 border-blue-300 text-blue-800",
                    "bg-yellow-100 border-yellow-300 text-yellow-800",
                    "bg-green-100 border-green-300 text-green-800",
                  ];
                  const isSelected = quizSelected[qi] === oi;
                  const isCorrect = oi === q.ans;
                  let cls = `flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer font-ui text-sm font-medium transition-all ${colors[oi]} `;
                  if (quizSubmitted && isCorrect)
                    cls += "ring-2 ring-green-500";
                  else if (quizSubmitted && isSelected && !isCorrect)
                    cls += "opacity-50";
                  else if (isSelected) cls += "ring-2 ring-violet-500";
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <label key={oi} className={cls}>
                      <input
                        type="radio"
                        name={`kb-${qi}`}
                        disabled={quizSubmitted}
                        checked={isSelected}
                        onChange={() =>
                          setQuizSelected((p) => ({ ...p, [qi]: oi }))
                        }
                        data-ocid={`game.radio.${qi + 1}`}
                        className="sr-only"
                      />
                      <span className="font-bold">
                        {["A", "B", "C", "D"][oi]}
                      </span>{" "}
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {!quizSubmitted ? (
            <button
              type="button"
              onClick={() => setQuizSubmitted(true)}
              data-ocid="game.submit_button"
              className="px-6 py-2 rounded-lg bg-violet-500 text-white font-ui font-semibold text-sm hover:bg-violet-600"
            >
              Submit Answers
            </button>
          ) : (
            <div className="font-ui font-semibold text-teal-700 bg-teal-50 rounded-lg p-3 text-center">
              Score: {score}/{MCQ_QUESTIONS.length} —{" "}
              {score >= 4
                ? "🏆 Champion!"
                : score >= 3
                  ? "👏 Well done!"
                  : "💪 Keep going!"}
            </div>
          )}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  if (t.includes("Crossword")) {
    return (
      <CrosswordGame
        onComplete={onComplete}
        isCompleted={isCompleted}
        isPending={isPending}
      />
    );
  }

  if (
    t.includes("Word Association") ||
    t.includes("20 Questions") ||
    t.includes("Hot Seat") ||
    t.includes("Taboo") ||
    t.includes("Category Sort")
  ) {
    const gameName = t.includes("Taboo")
      ? "Taboo"
      : t.includes("Hot Seat")
        ? "Hot Seat"
        : t.includes("20 Questions")
          ? "20 Questions"
          : t.includes("Word Association")
            ? "Word Association Chain"
            : "Category Sort Race";
    const rounds = [ELP_VOCAB[0].term, ELP_VOCAB[2].term, ELP_VOCAB[4].term];
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold font-ui">🎮 {gameName}</h3>
          <div className="bg-background border border-border rounded-lg p-4 text-center space-y-3">
            <p className="font-ui text-sm text-muted-foreground">
              Current Term:
            </p>
            <p className="font-display text-2xl font-bold text-teal-700">
              {rounds[Math.min(round, rounds.length - 1)]}
            </p>
            {round < rounds.length - 1 && (
              <button
                type="button"
                onClick={() => setRound((r) => r + 1)}
                data-ocid="game.primary_button"
                className="px-4 py-2 bg-violet-500 text-white rounded-lg font-ui text-sm font-semibold hover:bg-violet-600"
              >
                Next Term →
              </button>
            )}
          </div>
          <LessonContent content={lesson.content} />
          {!started ? (
            <button
              type="button"
              onClick={() => setStarted(true)}
              data-ocid="game.primary_button"
              className="px-6 py-2 bg-violet-500 text-white rounded-lg font-ui font-semibold text-sm hover:bg-violet-600"
            >
              ▶ Start Game
            </button>
          ) : (
            <div className="space-y-2">
              <label
                className="font-ui text-sm font-semibold"
                htmlFor="game-resp"
              >
                Your Response / Notes
              </label>
              <textarea
                id="game-resp"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your responses here..."
                data-ocid="game.textarea"
                rows={4}
                className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          )}
        </div>
        <CompleteButton
          onComplete={onComplete}
          isPending={isPending}
          isCompleted={isCompleted}
        />
      </div>
    );
  }

  // Default game
  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-xl p-5 space-y-4">
        <LessonContent content={lesson.content} />
        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            data-ocid="game.primary_button"
            className="px-6 py-2 bg-violet-500 text-white rounded-lg font-ui font-semibold hover:bg-violet-600"
          >
            ▶ Start & Play
          </button>
        ) : (
          <div className="space-y-2">
            <label
              className="font-ui text-sm font-semibold"
              htmlFor="game-resp2"
            >
              Your Response
            </label>
            <textarea
              id="game-resp2"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response here..."
              data-ocid="game.textarea"
              rows={4}
              className="w-full rounded-lg border border-border bg-background p-3 font-ui text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
          </div>
        )}
      </div>
      <CompleteButton
        onComplete={onComplete}
        isPending={isPending}
        isCompleted={isCompleted}
      />
    </div>
  );
}

// ─── Interactive Lesson Dispatcher ────────────────────────────────────────────
function InteractiveLessonView({
  lesson,
  onComplete,
  isCompleted,
  isPending,
}: {
  lesson: { title: string; content: string; type?: LocalLesson["type"] };
  onComplete: () => void;
  isCompleted: boolean;
  isPending: boolean;
}) {
  const type = lesson.type || detectTypeFromTitle(lesson.title);
  switch (type) {
    case "Activity":
      return (
        <ActivityView
          lesson={lesson}
          onComplete={onComplete}
          isCompleted={isCompleted}
          isPending={isPending}
        />
      );
    case "Worksheet":
      return (
        <WorksheetView
          lesson={lesson}
          onComplete={onComplete}
          isCompleted={isCompleted}
          isPending={isPending}
        />
      );
    case "LSRW":
      return (
        <LSRWView
          lesson={lesson}
          onComplete={onComplete}
          isCompleted={isCompleted}
          isPending={isPending}
        />
      );
    case "Game":
      return (
        <GameView
          lesson={lesson}
          onComplete={onComplete}
          isCompleted={isCompleted}
          isPending={isPending}
        />
      );
    case "Exercise":
      return (
        <ExerciseView
          lesson={lesson}
          onComplete={onComplete}
          isCompleted={isCompleted}
          isPending={isPending}
        />
      );
    default:
      return (
        <div className="space-y-6">
          <LessonContent content={lesson.content} />
          <CompleteButton
            onComplete={onComplete}
            isPending={isPending}
            isCompleted={isCompleted}
          />
        </div>
      );
  }
}

function LessonContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-3">
      {lines.map((line, _lineIdx) => {
        const lineKey = line.slice(0, 30) || `empty-${_lineIdx}`;
        if (line.startsWith("# "))
          return (
            <h1 key={lineKey} className="text-2xl font-bold font-display">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={lineKey} className="text-xl font-bold font-display">
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("### "))
          return (
            <h3 key={lineKey} className="text-lg font-semibold font-ui">
              {line.slice(4)}
            </h3>
          );
        if (line.startsWith("```")) return null;
        if (line.trim() === "") return <div key={lineKey} className="h-2" />;
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
        return (
          <p key={lineKey} className="leading-relaxed font-ui">
            {parts.map((part) => {
              if (part.startsWith("**") && part.endsWith("**"))
                return <strong key={part}>{part.slice(2, -2)}</strong>;
              if (part.startsWith("`") && part.endsWith("`"))
                return (
                  <code
                    key={part}
                    className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

function QuizSection({
  actor,
  lessonId,
}: { actor: ReturnType<typeof useActor>["actor"]; lessonId: bigint }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const {
    celebration: quizCelebration,
    triggerCelebration: triggerQuizCelebration,
  } = useCelebration();

  const questionsQuery = useQuery({
    queryKey: ["quiz-student", String(lessonId)],
    queryFn: () => actor!.getQuizQuestionsForStudent(lessonId),
    enabled: !!actor,
  });
  const attemptsQuery = useQuery({
    queryKey: ["quiz-attempts", String(lessonId)],
    queryFn: () => actor!.getMyQuizAttempts(lessonId),
    enabled: !!actor,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const qs = questionsQuery.data ?? [];
      const answers = qs.map((_, i) => BigInt(selected[i] ?? 0));
      const res = await actor!.submitQuizAnswers(lessonId, answers);
      if ("ok" in res) return res.ok;
      throw new Error(res.err);
    },
    onSuccess: (attempt) => {
      setResult(attempt);
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["quiz-attempts", String(lessonId)] });
      const score = Number(attempt.score);
      if (score >= 70) {
        toast.success(`Quiz submitted! Score: ${score}% 🎉`);
        triggerQuizCelebration(pickRandom(CORRECT_MESSAGES));
      } else {
        toast.info(pickRandom(WRONG_MESSAGES));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const questions = questionsQuery.data ?? [];
  const lastAttempt = (attemptsQuery.data ?? []).sort(
    (a, b) => Number(b.completedAt) - Number(a.completedAt),
  )[0];

  if (questions.length === 0) return null;

  return (
    <div className="space-y-4" data-ocid="quiz.section">
      <CelebrationOverlay
        visible={quizCelebration.visible}
        message={quizCelebration.message}
      />
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-semibold font-ui text-lg">Quiz</h2>
        {lastAttempt && (
          <Badge variant="outline" className="font-ui">
            {Number(lastAttempt.score)}% last attempt
          </Badge>
        )}
      </div>

      {submitted && result ? (
        <div
          className={`p-4 rounded-xl border ${
            Number(result.score) >= 70
              ? "bg-green-50 border-green-200"
              : "bg-orange-50 border-orange-200"
          }`}
          data-ocid="quiz.success_state"
        >
          <p className="font-semibold font-ui text-lg">
            Score: {Number(result.score)}%
          </p>
          <p className="text-sm text-muted-foreground font-ui">
            {Number(result.score) >= 70 ? "Great job!" : "Keep practicing!"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSubmitted(false);
              setSelected({});
              setResult(null);
            }}
            data-ocid="quiz.secondary_button"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div
              key={String(q.id)}
              className="space-y-3"
              data-ocid={`quiz.item.${qi + 1}`}
            >
              <p className="font-medium font-ui">
                {qi + 1}. {q.question}
              </p>
              <RadioGroup
                value={selected[qi] !== undefined ? String(selected[qi]) : ""}
                onValueChange={(v) =>
                  setSelected((s) => ({ ...s, [qi]: Number(v) }))
                }
              >
                {q.options.map((opt, oi) => (
                  <div
                    key={opt || String(oi)}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem
                      value={String(oi)}
                      id={`q${qi}-o${oi}`}
                      data-ocid={`quiz.radio.${qi + 1}`}
                    />
                    <Label
                      htmlFor={`q${qi}-o${oi}`}
                      className="cursor-pointer font-ui"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={
              submitMutation.isPending ||
              Object.keys(selected).length < questions.length
            }
            data-ocid="quiz.submit_button"
          >
            {submitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
}

function DiscussionSection({
  actor,
  lessonId,
}: { actor: ReturnType<typeof useActor>["actor"]; lessonId: bigint }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<bigint | null>(null);

  const postsQuery = useQuery({
    queryKey: ["discussion", String(lessonId)],
    queryFn: () => actor!.getDiscussionPosts(lessonId),
    enabled: !!actor,
  });

  const postMutation = useMutation({
    mutationFn: () =>
      actor!.postDiscussion(lessonId, content.trim(), replyTo ? [replyTo] : []),
    onSuccess: () => {
      setContent("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["discussion", String(lessonId)] });
    },
    onError: () => toast.error("Failed to post"),
  });

  const posts = postsQuery.data ?? [];
  const topLevel = posts.filter((p) => p.parentId.length === 0);
  const getReplies = (parentId: bigint) =>
    posts.filter((p) => p.parentId.length > 0 && p.parentId[0] === parentId);

  return (
    <div className="space-y-4" data-ocid="discussion.section">
      <h2 className="font-semibold font-ui text-lg">Discussion</h2>

      <div className="space-y-4">
        {topLevel.map((post, idx) => (
          <div
            key={String(post.id)}
            className="space-y-2"
            data-ocid={`discussion.item.${idx + 1}`}
          >
            <PostBubble post={post} onReply={() => setReplyTo(post.id)} />
            {getReplies(post.id).map((reply) => (
              <div key={String(reply.id)} className="ml-8">
                <PostBubble post={reply} onReply={null} />
              </div>
            ))}
          </div>
        ))}
        {topLevel.length === 0 && (
          <p
            className="text-sm text-muted-foreground font-ui"
            data-ocid="discussion.empty_state"
          >
            No discussion yet. Be the first!
          </p>
        )}
      </div>

      <div className="space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-ui">
            Replying to a post{" "}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="underline"
            >
              cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a thought or question…"
            rows={2}
            className="resize-none font-ui text-sm"
            data-ocid="discussion.textarea"
          />
          <Button
            size="icon"
            onClick={() => postMutation.mutate()}
            disabled={!content.trim() || postMutation.isPending}
            data-ocid="discussion.submit_button"
          >
            {postMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PostBubble({
  post,
  onReply,
}: {
  post: DiscussionPost;
  onReply: (() => void) | null;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold font-ui">{post.authorName}</span>
        <span className="text-xs text-muted-foreground font-ui">
          {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm font-ui">{post.content}</p>
      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="text-xs text-primary hover:underline mt-1 font-ui"
          data-ocid="discussion.reply.button"
        >
          Reply
        </button>
      )}
    </div>
  );
}

// ─── Student Roster Page ──────────────────────────────────────────────────────
function StudentRosterPage() {
  const [roster, setRoster] = useState<RosterStudent[]>(() => {
    const stored = localStorage.getItem(ROSTER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_STUDENTS;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegNo, setEditRegNo] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRegNo, setNewRegNo] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function startEdit(s: RosterStudent) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRegNo(s.registerNo);
    setEditEmail(s.email);
  }

  function saveEdit() {
    if (!editName.trim() || !editRegNo.trim()) return;
    const updated = roster.map((s) =>
      s.id === editingId
        ? {
            ...s,
            name: editName.trim(),
            registerNo: editRegNo.trim(),
            email: editEmail.trim(),
          }
        : s,
    );
    setRoster(updated);
    saveRoster(updated);
    setEditingId(null);
    toast.success("Student updated!");
  }

  function deleteStudent(id: string) {
    const updated = roster.filter((s) => s.id !== id);
    setRoster(updated);
    saveRoster(updated);
    toast.success("Student removed.");
  }

  function addStudent() {
    if (!newName.trim() || !newRegNo.trim()) {
      toast.error("Please enter both name and register number.");
      return;
    }
    const newStudent: RosterStudent = {
      id: String(Date.now()),
      registerNo: newRegNo.trim(),
      name: newName.trim(),
      email: newEmail.trim(),
    };
    const updated = [...roster, newStudent];
    setRoster(updated);
    saveRoster(updated);
    setNewName("");
    setNewRegNo("");
    setNewEmail("");
    toast.success("Student added!");
  }

  function exportCSV() {
    const rows = [
      ["#", "Register No", "Name", "Email"],
      ...roster.map((s, i) => [String(i + 1), s.registerNo, s.name, s.email]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduloom-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roster exported!");
  }

  function exportBackup() {
    const courses = getLocalCourses();
    const data = { courses, roster, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eduloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported!");
  }

  return (
    <div className="space-y-6" data-ocid="roster.section">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="font-display text-3xl font-bold"
            style={{ color: "oklch(0.35 0.12 52)" }}
          >
            Student Roster
          </h1>
          <p className="text-muted-foreground font-ui mt-1">
            {roster.length} students in your class
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            data-ocid="roster.export_button"
            className="font-ui"
            style={{
              borderColor: "oklch(0.62 0.14 52)",
              color: "oklch(0.35 0.12 52)",
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportBackup}
            data-ocid="roster.backup_button"
            className="font-ui"
            style={{
              borderColor: "oklch(0.62 0.14 52)",
              color: "oklch(0.35 0.12 52)",
            }}
          >
            Export Backup
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <Card
        className="shadow-card"
        style={{ border: "1px solid oklch(0.87 0.05 52)" }}
      >
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-ui" data-ocid="roster.table">
              <thead>
                <tr
                  style={{
                    background: "oklch(0.95 0.04 52)",
                    borderBottom: "1px solid oklch(0.87 0.05 52)",
                  }}
                >
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-10">
                    #
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Register No
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s, idx) => (
                  <tr
                    key={s.id}
                    data-ocid={`roster.row.${idx + 1}`}
                    style={{ borderBottom: "1px solid oklch(0.93 0.03 52)" }}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    {editingId === s.id ? (
                      <>
                        <td className="px-4 py-2 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editRegNo}
                            onChange={(e) => setEditRegNo(e.target.value)}
                            className="h-8 text-xs font-ui w-32"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-xs font-ui w-48"
                          />
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          <Input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="email@institution.edu"
                            className="h-8 text-xs font-ui w-48"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={saveEdit}
                              style={{
                                background: "oklch(0.62 0.14 52)",
                                color: "white",
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-xs font-semibold"
                          style={{ color: "oklch(0.45 0.10 52)" }}
                        >
                          {s.registerNo}
                        </td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                          {s.email || (
                            <span className="italic text-muted-foreground/50">
                              not set
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-ui"
                              onClick={() => startEdit(s)}
                              data-ocid={`roster.edit_button.${idx + 1}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-ui text-destructive hover:text-destructive"
                              onClick={() => deleteStudent(s.id)}
                              data-ocid={`roster.delete_button.${idx + 1}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Student Form */}
      <Card
        className="shadow-card"
        style={{ border: "1px solid oklch(0.87 0.05 52)" }}
      >
        <CardHeader>
          <CardTitle
            className="font-display text-base"
            style={{ color: "oklch(0.35 0.12 52)" }}
          >
            Add New Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="font-ui text-xs">Register No</Label>
              <Input
                value={newRegNo}
                onChange={(e) => setNewRegNo(e.target.value)}
                placeholder="e.g. 128139018"
                className="mt-1 h-9 font-ui text-sm"
                data-ocid="roster.add.register_input"
              />
            </div>
            <div>
              <Label className="font-ui text-xs">Student Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. ARJUN KUMAR"
                className="mt-1 h-9 font-ui text-sm"
                data-ocid="roster.add.name_input"
              />
            </div>
            <div>
              <Label className="font-ui text-xs">Email (optional)</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="student@institution.edu"
                className="mt-1 h-9 font-ui text-sm"
                data-ocid="roster.add.email_input"
              />
            </div>
          </div>
          <Button
            className="mt-4 font-ui"
            onClick={addStudent}
            data-ocid="roster.add_button"
            style={{ background: "oklch(0.62 0.14 52)", color: "white" }}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Student
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────
function TeacherDashboard({
  actor,
  setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: TeacherView) => void;
}) {
  const qc = useQueryClient();
  const backendCoursesQuery = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => actor!.getAllCourses(),
    enabled: !!actor,
  });

  const localCoursesQueryTeacher = useQuery({
    queryKey: ["local-courses"],
    queryFn: () => getLocalCourses(),
    staleTime: 0,
  });

  const coursesQuery = {
    isLoading: backendCoursesQuery.isLoading,
    data: [
      ...(backendCoursesQuery.data ?? []),
      ...(localCoursesQueryTeacher.data ?? []).map(
        (c) =>
          ({
            course: {
              id: BigInt(c.id),
              title: c.title,
              description: c.description,
              teacherId: { toString: () => "local" } as any,
              createdAt: BigInt(c.createdAt),
              isPublished: c.isPublished,
            },
            enrollmentCount: BigInt(0),
            lessonCount: BigInt(0),
            _localId: c.id,
            _bannerColor: c.bannerColor,
            _section: c.section,
            _subject: c.subject,
          }) as any,
      ),
    ] as any[],
  };

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => actor!.getLeaderboard(),
    enabled: !!actor,
  });

  const publishMutation = useMutation({
    mutationFn: async ({
      id,
      published,
    }: { id: bigint; published: boolean }) => {
      const localId = Number(id);
      const localCourses = getLocalCourses();
      const isLocal = localCourses.some((c) => c.id === localId);
      if (isLocal) {
        if (actor) {
          try {
            const lc = localCourses.find((c) => c.id === localId);
            if (lc) {
              const result = await actor.createCourse(
                lc.title,
                lc.description || "",
              );
              if ("ok" in result) {
                await actor.publishCourse(result.ok.id, published);
                localStorage.setItem(
                  `eduloom_meta_${result.ok.id}`,
                  JSON.stringify({
                    section: lc.section,
                    subject: lc.subject,
                    room: lc.room,
                    bannerColor: lc.bannerColor,
                  }),
                );
                deleteLocalCourse(localId);
                return;
              }
            }
          } catch (_e) {
            // fall through to local update
          }
        }
        updateLocalCourse(localId, { isPublished: published });
        return;
      }
      return actor!.publishCourse(id, published);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      qc.invalidateQueries({ queryKey: ["local-courses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      const localId = Number(id);
      const localCourses = getLocalCourses();
      const isLocal = localCourses.some((c) => c.id === localId);
      if (isLocal) {
        deleteLocalCourse(localId);
        return;
      }
      return actor!.deleteCourse(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      qc.invalidateQueries({ queryKey: ["local-courses"] });
      toast.success("Course deleted");
    },
  });

  const courses = coursesQuery.data ?? [];
  const totalEnrollments = courses.reduce(
    (sum, c) => sum + Number(c.enrollmentCount),
    0,
  );
  const publishedCount = courses.filter((c) => c.course.isPublished).length;

  return (
    <div className="space-y-8" data-ocid="teacher.dashboard.section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img
            src="/assets/generated/teacher-clipart.dim_400x500.png"
            alt="Teacher"
            className="h-20 w-auto object-contain hidden sm:block"
          />
          <div>
            <h1
              className="font-display text-3xl font-bold"
              style={{ color: "oklch(0.35 0.12 52)" }}
            >
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground font-ui mt-1">
              Manage your courses and track student progress
            </p>
          </div>
        </div>
        <Button
          onClick={() => setView({ page: "create-course" })}
          data-ocid="teacher.new_course.primary_button"
          style={{
            background: "oklch(0.62 0.14 52)",
            color: "oklch(0.98 0 0)",
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4 mr-2" /> New Course
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-card card-pastel-lavender">
          <CardContent className="p-4">
            <p className="text-xs font-ui text-muted-foreground uppercase tracking-widest">
              Total Courses
            </p>
            <p className="text-3xl font-display font-bold mt-1">
              {courses.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-pastel-peach">
          <CardContent className="p-4">
            <p className="text-xs font-ui text-muted-foreground uppercase tracking-widest">
              Published
            </p>
            <p
              className="text-3xl font-display font-bold mt-1"
              style={{ color: "oklch(0.62 0.14 52)" }}
            >
              {publishedCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card card-pastel-mint">
          <CardContent className="p-4">
            <p className="text-xs font-ui text-muted-foreground uppercase tracking-widest">
              Enrollments
            </p>
            <p className="text-3xl font-display font-bold mt-1">
              {totalEnrollments}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses list */}
      <div className="space-y-3">
        <h2 className="font-ui font-semibold text-sm text-muted-foreground uppercase tracking-widest">
          Your Courses
        </h2>
        {coursesQuery.isLoading ? (
          <div data-ocid="teacher.courses.loading_state">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="text-center py-14 rounded-2xl border border-dashed"
            data-ocid="teacher.courses.empty_state"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "oklch(0.62 0.14 52 / 0.12)" }}
            >
              <BookOpen
                className="h-6 w-6"
                style={{ color: "oklch(0.62 0.14 52)" }}
              />
            </div>
            <p className="text-muted-foreground font-ui">
              No courses yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((cws, idx) => (
              <Card
                key={String(cws.course.id)}
                className="shadow-card"
                data-ocid={`teacher.courses.item.${idx + 1}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold font-ui truncate">
                      {cws.course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-ui truncate">
                      {cws.course.description}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-ui">
                      <span>{Number(cws.lessonCount)} lessons</span>
                      <span>{Number(cws.enrollmentCount)} students</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cws.course.isPublished}
                        onCheckedChange={(v) =>
                          publishMutation.mutate({
                            id: cws.course.id,
                            published: v,
                          })
                        }
                        data-ocid={`teacher.courses.switch.${idx + 1}`}
                      />
                      <span className="text-xs text-muted-foreground font-ui">
                        {cws.course.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setView({
                          page: "course-editor",
                          courseId: cws.course.id,
                        })
                      }
                      data-ocid={`teacher.courses.edit_button.${idx + 1}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(cws.course.id)}
                      className="text-destructive hover:text-destructive"
                      data-ocid={`teacher.courses.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Student progress / leaderboard */}
      <div className="space-y-3">
        <h2 className="font-ui font-semibold text-sm text-muted-foreground uppercase tracking-widest">
          Student Progress
        </h2>
        <Card className="shadow-card">
          <CardContent className="p-0">
            {leaderboardQuery.isLoading ? (
              <div
                className="p-4 space-y-3"
                data-ocid="teacher.progress.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (leaderboardQuery.data ?? []).length === 0 ? (
              <div
                className="text-center py-8"
                data-ocid="teacher.progress.empty_state"
              >
                <p className="text-muted-foreground font-ui text-sm">
                  No student activity yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {(leaderboardQuery.data ?? []).map((entry, i) => (
                  <div
                    key={String(entry.studentId)}
                    className="flex items-center gap-4 px-4 py-3"
                    data-ocid={`teacher.progress.item.${i + 1}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-ui shrink-0 ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-ui font-medium">
                      {entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-ui">
                      {Number(entry.completedLessons)} lessons
                    </span>
                    <Badge variant="secondary" className="font-ui text-xs">
                      {Number(entry.totalXp)} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Course Editor ────────────────────────────────────────────────────────────
// ─── Create Course Page ───────────────────────────────────────────────────────
function CreateCoursePage({
  actor,
  setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  setView: (v: TeacherView) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [bannerColor, setBannerColor] = useState("oklch(0.62 0.14 52)");

  const BANNER_COLORS = [
    { label: "Amber", value: "oklch(0.62 0.14 52)" },
    { label: "Teal", value: "oklch(0.55 0.12 185)" },
    { label: "Indigo", value: "oklch(0.50 0.18 260)" },
    { label: "Rose", value: "oklch(0.58 0.18 15)" },
    { label: "Emerald", value: "oklch(0.52 0.14 160)" },
    { label: "Purple", value: "oklch(0.52 0.18 300)" },
  ];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error(
          "Not connected to server. Please wait for the connection to be established and try again.",
        );
      }
      if (actor) {
        const result = await actor.createCourse(
          title.trim(),
          description.trim(),
        );
        if ("ok" in result) {
          // Publish with retries
          for (let _attempt = 0; _attempt < 5; _attempt++) {
            try {
              await actor.publishCourse(result.ok.id, true);
              break;
            } catch {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
          localStorage.setItem(
            `eduloom_meta_${result.ok.id}`,
            JSON.stringify({
              section: section.trim(),
              subject: subject.trim(),
              room: room.trim(),
              bannerColor,
            }),
          );
          return result.ok as any;
        }
        throw new Error("Failed to create course on server.");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      qc.invalidateQueries({ queryKey: ["local-courses"] });
      toast.success("Course created successfully!");
      setView({ page: "dashboard" });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create course. Please try again.";
      toast.error(msg);
    },
  });

  return (
    <div
      className="max-w-2xl mx-auto space-y-8"
      data-ocid="create_course.section"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView({ page: "dashboard" })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="create_course.link"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Create New Course</h1>
      </div>

      {/* Banner preview */}
      <div
        className="rounded-2xl overflow-hidden p-8 flex items-end"
        style={{ background: bannerColor, minHeight: "120px" }}
      >
        <div>
          <p className="text-white/60 font-ui text-xs uppercase tracking-widest mb-1">
            Course Preview
          </p>
          <h2 className="font-display text-2xl font-bold text-white">
            {title || "Your Course Title"}
          </h2>
          {section && (
            <p className="text-white/70 font-ui text-sm mt-0.5">{section}</p>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <Label className="font-ui text-sm text-muted-foreground">
          Banner Color
        </Label>
        <div className="flex gap-3 mt-2">
          {BANNER_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setBannerColor(c.value)}
              className="w-8 h-8 rounded-full border-4 transition-transform hover:scale-110"
              style={{
                background: c.value,
                borderColor:
                  bannerColor === c.value ? "oklch(0.98 0 0)" : "transparent",
                boxShadow:
                  bannerColor === c.value ? `0 0 0 2px ${c.value}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Form */}
      <Card className="shadow-card">
        <CardContent className="p-6 space-y-5">
          <div>
            <Label className="font-ui font-medium" htmlFor="course-title">
              Course Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. English Language Pedagogy II"
              className="mt-1.5 font-ui"
              data-ocid="create_course.title.input"
            />
          </div>

          <div>
            <Label className="font-ui font-medium" htmlFor="course-description">
              Description
            </Label>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this course?"
              rows={3}
              className="mt-1.5 font-ui resize-none"
              data-ocid="create_course.description.textarea"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-ui font-medium" htmlFor="course-section">
                Section
              </Label>
              <Input
                id="course-section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Semester IV"
                className="mt-1.5 font-ui"
                data-ocid="create_course.section.input"
              />
            </div>
            <div>
              <Label className="font-ui font-medium" htmlFor="course-subject">
                Subject
              </Label>
              <Input
                id="course-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. English Pedagogy"
                className="mt-1.5 font-ui"
                data-ocid="create_course.subject.input"
              />
            </div>
          </div>

          <div>
            <Label className="font-ui font-medium" htmlFor="course-room">
              Room{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Input
              id="course-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Room 204"
              className="mt-1.5 font-ui"
              data-ocid="create_course.room.input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setView({ page: "dashboard" })}
          data-ocid="create_course.cancel_button"
        >
          Cancel
        </Button>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!title.trim() || createMutation.isPending}
          data-ocid="create_course.submit_button"
          style={{ background: bannerColor, color: "white" }}
          className="hover:opacity-90 transition-opacity min-w-[140px]"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function CourseEditor({
  actor,
  courseId,
  setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  courseId: bigint;
  setView: (v: TeacherView) => void;
}) {
  const qc = useQueryClient();
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [announcements, setAnnouncements] = useState<
    { id: string; text: string; timestamp: Date }[]
  >([]);
  const [announcementText, setAnnouncementText] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => actor!.getAllCourses(),
    enabled: !!actor,
  });
  const lessonsQuery = useQuery({
    queryKey: ["lessons", String(courseId)],
    queryFn: async () => {
      try {
        return await actor!.getLessons(courseId);
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });
  const localLessonsQuery3 = useQuery({
    queryKey: ["local-lessons", String(courseId)],
    queryFn: () =>
      getLocalLessons().filter((l) => l.courseId === Number(courseId)),
    staleTime: 0,
  });
  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => actor!.getLeaderboard(),
    enabled: !!actor,
  });

  const cws = (coursesQuery.data ?? []).find((c) => c.course.id === courseId);
  const localLessonsRaw3 = localLessonsQuery3.data ?? [];
  const lessons3 = [
    ...(lessonsQuery.data ?? []),
    ...localLessonsRaw3.map((l) => ({
      id: BigInt(l.id),
      courseId: BigInt(l.courseId),
      title: l.title,
      content: l.content,
      orderIndex: BigInt(l.orderIndex),
      createdAt: BigInt(0),
    })),
  ];

  const createLessonMutation = useMutation({
    mutationFn: () => {
      const orderIndex = BigInt(lessons3.length + 1);
      return actor!.createLesson(
        courseId,
        lessonTitle.trim(),
        lessonContent.trim(),
        orderIndex,
      );
    },
    onSuccess: (res) => {
      if ("err" in res) {
        toast.error(res.err);
        return;
      }
      qc.invalidateQueries({ queryKey: ["lessons", String(courseId)] });
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      setShowAddLesson(false);
      setLessonTitle("");
      setLessonContent("");
      toast.success("Lesson added!");
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", String(courseId)] });
      toast.success("Deleted");
    },
  });

  function postAnnouncement() {
    if (!announcementText.trim()) return;
    setAnnouncements((prev) => [
      {
        id: `ann_${Date.now()}`,
        text: announcementText.trim(),
        timestamp: new Date(),
      },
      ...prev,
    ]);
    setAnnouncementText("");
  }

  function relativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  // Group lessons by type based on title prefix
  const lessons = lessonsQuery.data ?? [];
  const groupedLessons = {
    Activities: lessons.filter((l) => l.title.startsWith("Activity")),
    Worksheets: lessons.filter((l) => l.title.startsWith("Worksheet")),
    "LSRW Tasks": lessons.filter((l) => l.title.startsWith("LSRW")),
    Games: lessons.filter((l) => l.title.startsWith("Game")),
    Exercises: lessons.filter((l) => l.title.startsWith("Exercise")),
    Other: lessons.filter(
      (l) =>
        !l.title.startsWith("Activity") &&
        !l.title.startsWith("Worksheet") &&
        !l.title.startsWith("LSRW") &&
        !l.title.startsWith("Game") &&
        !l.title.startsWith("Exercise"),
    ),
  };

  const BANNER_COLORS = [
    { label: "Amber", value: "oklch(0.62 0.14 52)" },
    { label: "Teal", value: "oklch(0.55 0.12 185)" },
    { label: "Indigo", value: "oklch(0.50 0.18 260)" },
    { label: "Rose", value: "oklch(0.58 0.18 15)" },
    { label: "Emerald", value: "oklch(0.52 0.14 160)" },
    { label: "Purple", value: "oklch(0.52 0.18 300)" },
  ];
  const [bannerColor, setBannerColor] = useState(BANNER_COLORS[0].value);

  return (
    <div className="space-y-0" data-ocid="course_editor.section">
      {/* Google Classroom-style banner */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-8"
        style={{ background: bannerColor, minHeight: "140px" }}
      >
        <button
          type="button"
          onClick={() => setView({ page: "dashboard" })}
          className="absolute top-4 left-4 flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-ui"
          data-ocid="course_editor.link"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </button>
        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold text-white">
            {cws?.course.title ?? "Course"}
          </h1>
          <p className="text-white/75 font-ui text-sm mt-1">
            {cws?.course.description}
          </p>
        </div>
        {/* Color swatches */}
        <div className="absolute top-4 right-4 flex gap-1.5">
          {BANNER_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setBannerColor(c.value)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c.value,
                borderColor: bannerColor === c.value ? "white" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stream" className="space-y-6">
        <TabsList className="font-ui">
          <TabsTrigger value="stream" data-ocid="course_editor.stream.tab">
            Stream
          </TabsTrigger>
          <TabsTrigger
            value="classwork"
            data-ocid="course_editor.classwork.tab"
          >
            Classwork
          </TabsTrigger>
          <TabsTrigger value="people" data-ocid="course_editor.people.tab">
            People
          </TabsTrigger>
        </TabsList>

        {/* ── Stream Tab ── */}
        <TabsContent value="stream" className="space-y-4">
          {/* Post announcement */}
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Announce something to your class..."
                rows={3}
                className="font-ui resize-none"
                data-ocid="course_editor.announcement.textarea"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                    postAnnouncement();
                }}
              />
              <div className="flex justify-end">
                <Button
                  onClick={postAnnouncement}
                  disabled={!announcementText.trim()}
                  data-ocid="course_editor.announcement.submit_button"
                  style={{ background: bannerColor, color: "white" }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcements feed */}
          {announcements.length === 0 ? (
            <div
              className="text-center py-10 border border-dashed rounded-xl"
              data-ocid="course_editor.stream.empty_state"
            >
              <p className="text-muted-foreground font-ui text-sm">
                Post an announcement to your class
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann, idx) => (
                <Card
                  key={ann.id}
                  className="shadow-card"
                  data-ocid={`course_editor.stream.item.${idx + 1}`}
                >
                  <CardContent className="p-4">
                    <p className="font-ui text-sm whitespace-pre-wrap">
                      {ann.text}
                    </p>
                    <p className="font-ui text-xs text-muted-foreground mt-2">
                      {relativeTime(ann.timestamp)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Classwork Tab ── */}
        <TabsContent value="classwork" className="space-y-6">
          {/* Lessons management */}
          <div className="flex items-center justify-between">
            <h2 className="font-ui font-semibold">Lessons</h2>
            <Button
              size="sm"
              onClick={() => setShowAddLesson(true)}
              data-ocid="course_editor.add_lesson.open_modal_button"
              style={{ background: bannerColor, color: "white" }}
              className="hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Lesson
            </Button>
          </div>

          {lessonsQuery.isLoading ? (
            <div data-ocid="course_editor.lessons.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div
              className="text-center py-8 border border-dashed rounded-xl"
              data-ocid="course_editor.lessons.empty_state"
            >
              <p className="text-muted-foreground font-ui">
                No lessons yet. Add a lesson or generate 50 items from
                Materials.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Other/custom lessons first */}
              {groupedLessons.Other.length > 0 && (
                <div className="space-y-2">
                  {groupedLessons.Other.map((lesson, idx) => (
                    <div
                      key={String(lesson.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-xs"
                      data-ocid={`course_editor.lessons.item.${idx + 1}`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs flex items-center justify-center font-bold font-ui shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium font-ui">
                        {lesson.title}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setView({
                            page: "lesson-editor",
                            lessonId: lesson.id,
                            courseId,
                          })
                        }
                        data-ocid={`course_editor.lessons.edit_button.${idx + 1}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLessonMutation.mutate(lesson.id)}
                        className="text-destructive hover:text-destructive"
                        data-ocid={`course_editor.lessons.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Generated items grouped by type */}
              {Object.entries(groupedLessons)
                .filter(([key, items]) => key !== "Other" && items.length > 0)
                .map(([groupName, items]) => (
                  <Accordion type="single" collapsible key={groupName}>
                    <AccordionItem
                      value={groupName}
                      className="border rounded-xl px-4"
                    >
                      <AccordionTrigger className="font-ui font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span>{groupName}</span>
                          <Badge
                            variant="secondary"
                            className="font-ui text-xs"
                          >
                            {items.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pb-2">
                          {items.map((lesson, idx) => (
                            <div
                              key={String(lesson.id)}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                              data-ocid={`course_editor.generated.item.${idx + 1}`}
                            >
                              <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-bold font-ui shrink-0">
                                {idx + 1}
                              </span>
                              <span className="flex-1 font-medium font-ui text-sm">
                                {lesson.title}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setView({
                                    page: "lesson-editor",
                                    lessonId: lesson.id,
                                    courseId,
                                  })
                                }
                                data-ocid={`course_editor.generated.edit_button.${idx + 1}`}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteLessonMutation.mutate(lesson.id)
                                }
                                className="text-destructive hover:text-destructive"
                                data-ocid={`course_editor.generated.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
            </div>
          )}

          <Dialog open={showAddLesson} onOpenChange={setShowAddLesson}>
            <DialogContent data-ocid="course_editor.add_lesson.dialog">
              <DialogHeader>
                <DialogTitle className="font-display">Add Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-ui">Title</Label>
                  <Input
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Lesson title"
                    className="mt-1.5"
                    data-ocid="course_editor.add_lesson.input"
                  />
                </div>
                <div>
                  <Label className="font-ui">Content</Label>
                  <Textarea
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="Write lesson content here… (supports # headings, **bold**, `code`)"
                    rows={6}
                    className="mt-1.5"
                    data-ocid="course_editor.add_lesson.textarea"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddLesson(false)}
                  data-ocid="course_editor.add_lesson.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createLessonMutation.mutate()}
                  disabled={
                    !lessonTitle.trim() || createLessonMutation.isPending
                  }
                  data-ocid="course_editor.add_lesson.submit_button"
                  style={{ background: bannerColor, color: "white" }}
                  className="hover:opacity-90 transition-opacity"
                >
                  {createLessonMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Lesson
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── People Tab ── */}
        <TabsContent value="people" className="space-y-4">
          {(() => {
            const roster = getRoster();
            const leaderboard = leaderboardQuery.data ?? [];
            const xpMap = new Map(
              leaderboard.map((e) => [e.name.toLowerCase(), e]),
            );
            return (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-ui font-semibold">
                    Class List ({roster.length} students)
                  </h2>
                </div>
                {leaderboardQuery.isLoading ? (
                  <div
                    data-ocid="course_editor.people.loading_state"
                    className="space-y-3"
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : roster.length === 0 ? (
                  <div
                    className="text-center py-10 border border-dashed rounded-xl"
                    data-ocid="course_editor.people.empty_state"
                  >
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground font-ui text-sm">
                      No students in the roster yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roster.map((s, i) => {
                      const lb = xpMap.get(s.name.toLowerCase());
                      return (
                        <Card
                          key={s.id}
                          className="shadow-card"
                          data-ocid={`course_editor.people.item.${i + 1}`}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-ui text-white shrink-0"
                              style={{ background: bannerColor }}
                            >
                              {s.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-ui font-semibold text-sm truncate">
                                {s.name}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {s.registerNo}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lb ? (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className="font-ui text-xs"
                                  >
                                    {Number(lb.totalXp)} XP
                                  </Badge>
                                  <span className="font-ui text-xs text-muted-foreground">
                                    {Number(lb.completedLessons)} lessons
                                  </span>
                                </>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="font-ui text-xs text-muted-foreground"
                                >
                                  Not enrolled
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Lesson Editor ────────────────────────────────────────────────────────────
function LessonEditor({
  actor,
  lessonId,
  courseId,
  setView,
}: {
  actor: ReturnType<typeof useActor>["actor"];
  lessonId: bigint;
  courseId: bigint;
  setView: (v: TeacherView) => void;
}) {
  const qc = useQueryClient();
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [qQuestion, setQQuestion] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState("");

  const lessonsQuery = useQuery({
    queryKey: ["lessons", String(courseId)],
    queryFn: () => actor!.getLessons(courseId),
    enabled: !!actor,
  });
  const lesson = (lessonsQuery.data ?? []).find((l) => l.id === lessonId);

  useEffect(() => {
    if (lesson && !initialized) {
      setEditTitle(lesson.title);
      setEditContent(lesson.content);
      setInitialized(true);
    }
  }, [lesson, initialized]);

  const questionsQuery = useQuery({
    queryKey: ["quiz-teacher", String(lessonId)],
    queryFn: () => actor!.getQuizQuestionsForTeacher(lessonId),
    enabled: !!actor,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      actor!.updateLesson(
        lessonId,
        editTitle.trim(),
        editContent.trim(),
        lesson?.orderIndex ?? BigInt(1),
      ),
    onSuccess: (res) => {
      if ("err" in res) {
        toast.error(res.err);
        return;
      }
      qc.invalidateQueries({ queryKey: ["lessons", String(courseId)] });
      toast.success("Lesson saved!");
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: () =>
      actor!.createQuizQuestion(
        lessonId,
        qQuestion.trim(),
        qOptions.filter((o) => o.trim()),
        BigInt(qCorrect),
        qExplanation.trim(),
      ),
    onSuccess: (res) => {
      if ("err" in res) {
        toast.error(res.err);
        return;
      }
      qc.invalidateQueries({ queryKey: ["quiz-teacher", String(lessonId)] });
      setShowAddQ(false);
      setQQuestion("");
      setQOptions(["", "", "", ""]);
      setQCorrect(0);
      setQExplanation("");
      toast.success("Question added!");
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteQuizQuestion(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["quiz-teacher", String(lessonId)] }),
  });

  return (
    <div className="space-y-8 max-w-3xl" data-ocid="lesson_editor.section">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView({ page: "course-editor", courseId })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="lesson_editor.link"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Edit Lesson</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="font-ui">Title</Label>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mt-1.5"
            data-ocid="lesson_editor.title.input"
          />
        </div>
        <div>
          <Label className="font-ui">Content</Label>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={12}
            className="font-mono text-sm mt-1.5"
            data-ocid="lesson_editor.content.textarea"
          />
          <p className="text-xs text-muted-foreground font-ui mt-1">
            Supports: # H1, ## H2, **bold**, `code`
          </p>
        </div>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={!editTitle.trim() || updateMutation.isPending}
          data-ocid="lesson_editor.save_button"
          style={{
            background: "oklch(0.62 0.14 52)",
            color: "oklch(0.98 0 0)",
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-ui font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Quiz Questions
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddQ(true)}
            data-ocid="lesson_editor.add_question.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>

        {(questionsQuery.data ?? []).length === 0 ? (
          <p
            className="text-sm text-muted-foreground font-ui"
            data-ocid="lesson_editor.questions.empty_state"
          >
            No quiz questions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {(questionsQuery.data ?? []).map((q, idx) => (
              <Card
                key={String(q.id)}
                data-ocid={`lesson_editor.questions.item.${idx + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium font-ui mb-2">{q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div
                            key={opt || String(oi)}
                            className={`text-sm px-2 py-1 rounded font-ui ${
                              oi === Number(q.correctOptionIndex)
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {oi === Number(q.correctOptionIndex) ? "✓ " : "  "}
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground font-ui mt-2 italic">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestionMutation.mutate(q.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                      data-ocid={`lesson_editor.questions.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddQ} onOpenChange={setShowAddQ}>
        <DialogContent
          className="max-w-lg"
          data-ocid="lesson_editor.add_question.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Quiz Question
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-ui">Question</Label>
              <Input
                value={qQuestion}
                onChange={(e) => setQQuestion(e.target.value)}
                placeholder="What is…?"
                className="mt-1.5"
                data-ocid="lesson_editor.add_question.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-ui">Options (mark correct one)</Label>
              {qOptions.map((opt, oi) => (
                <div key={String(oi)} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={qCorrect === oi}
                    onChange={() => setQCorrect(oi)}
                    className="accent-primary"
                    data-ocid={`lesson_editor.add_question.radio.${oi + 1}`}
                  />
                  <Input
                    value={opt}
                    onChange={(e) =>
                      setQOptions((prev) =>
                        prev.map((o, i) => (i === oi ? e.target.value : o)),
                      )
                    }
                    placeholder={`Option ${oi + 1}`}
                    data-ocid={`lesson_editor.add_question.option_input.${oi + 1}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="font-ui">Explanation (optional)</Label>
              <Input
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Why is this the answer?"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddQ(false)}
              data-ocid="lesson_editor.add_question.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addQuestionMutation.mutate()}
              disabled={
                !qQuestion.trim() ||
                qOptions.filter((o) => o.trim()).length < 2 ||
                addQuestionMutation.isPending
              }
              data-ocid="lesson_editor.add_question.submit_button"
              style={{
                background: "oklch(0.62 0.14 52)",
                color: "oklch(0.98 0 0)",
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {addQuestionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
