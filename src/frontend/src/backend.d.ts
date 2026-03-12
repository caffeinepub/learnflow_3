import { Principal } from "@dfinity/principal";

export interface Course {
  id: bigint;
  title: string;
  description: string;
  teacherId: Principal;
  createdAt: bigint;
  isPublished: boolean;
}

export interface Lesson {
  id: bigint;
  courseId: bigint;
  title: string;
  content: string;
  orderIndex: bigint;
  createdAt: bigint;
}

export interface LessonInput {
  title: string;
  content: string;
  orderIndex: bigint;
}

export interface QuizQuestion {
  id: bigint;
  lessonId: bigint;
  question: string;
  options: string[];
  correctOptionIndex: bigint;
  explanation: string;
}

export interface QuizQuestionForStudent {
  id: bigint;
  question: string;
  options: string[];
}

export interface QuizAttempt {
  id: bigint;
  studentId: Principal;
  lessonId: bigint;
  answers: bigint[];
  score: bigint;
  completedAt: bigint;
}

export interface DiscussionPost {
  id: bigint;
  lessonId: bigint;
  authorId: Principal;
  authorName: string;
  content: string;
  parentId: [] | [bigint];
  createdAt: bigint;
}

export interface CourseWithStats {
  course: Course;
  enrollmentCount: bigint;
  lessonCount: bigint;
}

export interface StudentProgress {
  courseId: bigint;
  completedLessons: bigint;
  totalLessons: bigint;
  totalXp: bigint;
}

export interface LeaderboardEntry {
  studentId: Principal;
  name: string;
  totalXp: bigint;
  completedLessons: bigint;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface backendInterface {
  // Auth
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  isCallerAdmin(): Promise<boolean>;

  // Student name
  setStudentName(name: string): Promise<void>;

  // Courses
  createCourse(title: string, description: string): Promise<{ ok: Course } | { err: string }>;
  updateCourse(id: bigint, title: string, description: string): Promise<{ ok: Course } | { err: string }>;
  publishCourse(id: bigint, published: boolean): Promise<{ ok: Course } | { err: string }>;
  deleteCourse(id: bigint): Promise<{ ok: null } | { err: string }>;
  getAllCourses(): Promise<CourseWithStats[]>;
  getPublishedCourses(): Promise<CourseWithStats[]>;

  // Lessons
  createLesson(courseId: bigint, title: string, content: string, orderIndex: bigint): Promise<{ ok: Lesson } | { err: string }>;
  batchCreateLessons(courseId: bigint, inputs: LessonInput[]): Promise<{ ok: bigint } | { err: string }>;
  updateLesson(id: bigint, title: string, content: string, orderIndex: bigint): Promise<{ ok: Lesson } | { err: string }>;
  deleteLesson(id: bigint): Promise<{ ok: null } | { err: string }>;
  getLessons(courseId: bigint): Promise<Lesson[]>;

  // Quiz
  createQuizQuestion(lessonId: bigint, question: string, options: string[], correctOptionIndex: bigint, explanation: string): Promise<{ ok: QuizQuestion } | { err: string }>;
  deleteQuizQuestion(id: bigint): Promise<{ ok: null } | { err: string }>;
  getQuizQuestionsForStudent(lessonId: bigint): Promise<QuizQuestionForStudent[]>;
  getQuizQuestionsForTeacher(lessonId: bigint): Promise<QuizQuestion[]>;
  submitQuizAnswers(lessonId: bigint, answers: bigint[]): Promise<{ ok: QuizAttempt } | { err: string }>;
  getMyQuizAttempts(lessonId: bigint): Promise<QuizAttempt[]>;

  // Enrollment & Progress
  enrollInCourse(courseId: bigint): Promise<{ ok: null } | { err: string }>;
  getMyEnrolledCourses(): Promise<Array<{ courseId: bigint; enrolledAt: bigint }>>;
  getMyProgress(courseId: bigint): Promise<StudentProgress>;
  isEnrolled(courseId: bigint): Promise<boolean>;
  markLessonComplete(lessonId: bigint): Promise<{ ok: null } | { err: string }>;
  isLessonComplete(lessonId: bigint): Promise<boolean>;

  // Discussion
  postDiscussion(lessonId: bigint, content: string, parentId: [] | [bigint]): Promise<{ ok: DiscussionPost } | { err: string }>;
  getDiscussionPosts(lessonId: bigint): Promise<DiscussionPost[]>;

  // Leaderboard
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export declare function createActor(
  canisterId: string,
  uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions
): Promise<backendInterface>;

export declare class ExternalBlob {
  static fromURL(url: string): ExternalBlob;
  getBytes(): Promise<Uint8Array>;
  onProgress?: (progress: number) => void;
}

export interface CreateActorOptions {
  agentOptions?: Record<string, unknown>;
  agent?: unknown;
  processError?: (e: unknown) => never;
}
