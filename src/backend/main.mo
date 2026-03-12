import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Time "mo:core/Time";

actor class Backend() = this {

  // ── Authorization ────────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Types ────────────────────────────────────────────────────────────────────
  public type Course = {
    id : Nat;
    title : Text;
    description : Text;
    teacherId : Principal;
    createdAt : Int;
    isPublished : Bool;
  };

  public type Lesson = {
    id : Nat;
    courseId : Nat;
    title : Text;
    content : Text;
    orderIndex : Nat;
    createdAt : Int;
  };

  public type LessonInput = {
    title : Text;
    content : Text;
    orderIndex : Nat;
  };

  public type QuizQuestion = {
    id : Nat;
    lessonId : Nat;
    question : Text;
    options : [Text];
    correctOptionIndex : Nat;
    explanation : Text;
  };

  public type QuizAttempt = {
    id : Nat;
    studentId : Principal;
    lessonId : Nat;
    answers : [Nat];
    score : Nat;
    completedAt : Int;
  };

  public type DiscussionPost = {
    id : Nat;
    lessonId : Nat;
    authorId : Principal;
    authorName : Text;
    content : Text;
    parentId : ?Nat;
    createdAt : Int;
  };

  public type CourseWithStats = {
    course : Course;
    enrollmentCount : Nat;
    lessonCount : Nat;
  };

  public type StudentProgress = {
    courseId : Nat;
    completedLessons : Nat;
    totalLessons : Nat;
    totalXp : Nat;
  };

  public type LeaderboardEntry = {
    studentId : Principal;
    name : Text;
    totalXp : Nat;
    completedLessons : Nat;
  };

  // ── State ────────────────────────────────────────────────────────────────────
  var nextCourseId : Nat = 1;
  var nextLessonId : Nat = 1;
  var nextQuestionId : Nat = 1;
  var nextAttemptId : Nat = 1;
  var nextPostId : Nat = 1;

  let courses = Map.empty<Nat, Course>();
  let lessons = Map.empty<Nat, Lesson>();
  let quizQuestions = Map.empty<Nat, QuizQuestion>();
  let quizAttempts = Map.empty<Nat, QuizAttempt>();
  let lessonProgress = Map.empty<Text, Int>();
  let enrollments = Map.empty<Text, Int>();
  let discussionPosts = Map.empty<Nat, DiscussionPost>();
  let studentNames = Map.empty<Text, Text>();

  // ── Helpers ──────────────────────────────────────────────────────────────────
  func enrollKey(p : Principal, courseId : Nat) : Text {
    p.toText() # ":" # courseId.toText();
  };

  func progressKey(p : Principal, lessonId : Nat) : Text {
    p.toText() # ":" # lessonId.toText();
  };

  func getLessonsForCourse(courseId : Nat) : [Lesson] {
    lessons.values().toArray()
      .filter(func(l : Lesson) : Bool { l.courseId == courseId })
      .sort(func(a : Lesson, b : Lesson) : Order.Order {
        Nat.compare(a.orderIndex, b.orderIndex);
      });
  };

  // ── Course Management (Teacher) ───────────────────────────────────────────────
  public shared ({ caller = _ }) func createCourse(title : Text, description : Text) : async { #ok : Course; #err : Text } {
    let course : Course = {
      id = nextCourseId;
      title;
      description;
      teacherId = Principal.fromText("2vxsx-fae");
      createdAt = Time.now();
      isPublished = false;
    };
    courses.add(nextCourseId, course);
    nextCourseId += 1;
    #ok(course);
  };

  public shared ({ caller = _ }) func updateCourse(id : Nat, title : Text, description : Text) : async { #ok : Course; #err : Text } {
    switch (courses.get(id)) {
      case null { #err("Not found") };
      case (?c) {
        let updated = { c with title; description };
        courses.add(id, updated);
        #ok(updated);
      };
    };
  };

  public shared ({ caller = _ }) func publishCourse(id : Nat, published : Bool) : async { #ok : Course; #err : Text } {
    switch (courses.get(id)) {
      case null { #err("Not found") };
      case (?c) {
        let updated = { c with isPublished = published };
        courses.add(id, updated);
        #ok(updated);
      };
    };
  };

  public shared ({ caller = _ }) func deleteCourse(id : Nat) : async { #ok; #err : Text } {
    switch (courses.get(id)) {
      case null { #err("Not found") };
      case (?_) {
        courses.remove(id);
        #ok;
      };
    };
  };

  // ── Lesson Management (Teacher) ───────────────────────────────────────────────
  public shared ({ caller = _ }) func createLesson(courseId : Nat, title : Text, content : Text, orderIndex : Nat) : async { #ok : Lesson; #err : Text } {
    switch (courses.get(courseId)) {
      case null { #err("Course not found") };
      case (?_) {
        let lesson : Lesson = {
          id = nextLessonId;
          courseId;
          title;
          content;
          orderIndex;
          createdAt = Time.now();
        };
        lessons.add(nextLessonId, lesson);
        nextLessonId += 1;
        #ok(lesson);
      };
    };
  };

  public shared ({ caller = _ }) func batchCreateLessons(courseId : Nat, inputs : [LessonInput]) : async { #ok : Nat; #err : Text } {
    switch (courses.get(courseId)) {
      case null { #err("Course not found") };
      case (?_) {
        var count = 0;
        for (input in inputs.vals()) {
          let lesson : Lesson = {
            id = nextLessonId;
            courseId;
            title = input.title;
            content = input.content;
            orderIndex = input.orderIndex;
            createdAt = Time.now();
          };
          lessons.add(nextLessonId, lesson);
          nextLessonId += 1;
          count += 1;
        };
        #ok(count);
      };
    };
  };

  public shared ({ caller = _ }) func updateLesson(id : Nat, title : Text, content : Text, orderIndex : Nat) : async { #ok : Lesson; #err : Text } {
    switch (lessons.get(id)) {
      case null { #err("Not found") };
      case (?l) {
        let updated = { l with title; content; orderIndex };
        lessons.add(id, updated);
        #ok(updated);
      };
    };
  };

  public shared ({ caller = _ }) func deleteLesson(id : Nat) : async { #ok; #err : Text } {
    switch (lessons.get(id)) {
      case null { #err("Not found") };
      case (?_) {
        lessons.remove(id);
        #ok;
      };
    };
  };

  // ── Quiz Management (Teacher) ─────────────────────────────────────────────────
  public shared ({ caller = _ }) func createQuizQuestion(lessonId : Nat, question : Text, options : [Text], correctOptionIndex : Nat, explanation : Text) : async { #ok : QuizQuestion; #err : Text } {
    switch (lessons.get(lessonId)) {
      case null { #err("Lesson not found") };
      case (?_) {
        let q : QuizQuestion = { id = nextQuestionId; lessonId; question; options; correctOptionIndex; explanation };
        quizQuestions.add(nextQuestionId, q);
        nextQuestionId += 1;
        #ok(q);
      };
    };
  };

  public shared ({ caller = _ }) func deleteQuizQuestion(id : Nat) : async { #ok; #err : Text } {
    switch (quizQuestions.get(id)) {
      case null { #err("Not found") };
      case (?_) {
        quizQuestions.remove(id);
        #ok;
      };
    };
  };

  // ── Student Actions ───────────────────────────────────────────────────────────
  public shared ({ caller }) func setStudentName(name : Text) : async () {
    studentNames.add(caller.toText(), name);
  };

  public shared ({ caller }) func enrollInCourse(courseId : Nat) : async { #ok; #err : Text } {
    switch (courses.get(courseId)) {
      case null { #err("Not found") };
      case (?c) {
        if (not c.isPublished) return #err("Course not published");
        enrollments.add(enrollKey(caller, courseId), Time.now());
        #ok;
      };
    };
  };

  public shared ({ caller }) func markLessonComplete(lessonId : Nat) : async { #ok; #err : Text } {
    switch (lessons.get(lessonId)) {
      case null { #err("Lesson not found") };
      case (?l) {
        switch (enrollments.get(enrollKey(caller, l.courseId))) {
          case null { #err("Not enrolled") };
          case (?_) {
            lessonProgress.add(progressKey(caller, lessonId), Time.now());
            #ok;
          };
        };
      };
    };
  };

  public shared ({ caller }) func submitQuizAnswers(lessonId : Nat, answers : [Nat]) : async { #ok : QuizAttempt; #err : Text } {
    switch (lessons.get(lessonId)) {
      case null { #err("Lesson not found") };
      case (?l) {
        switch (enrollments.get(enrollKey(caller, l.courseId))) {
          case null { #err("Not enrolled") };
          case (?_) {
            let qs = quizQuestions.values().toArray()
              .filter(func(q : QuizQuestion) : Bool { q.lessonId == lessonId });
            var correct = 0;
            var i = 0;
            for (q in qs.vals()) {
              let a = if (i < answers.size()) answers[i] else 999;
              if (a == q.correctOptionIndex) correct += 1;
              i += 1;
            };
            let score = if (qs.size() == 0) 0 else (correct * 100) / qs.size();
            let attempt : QuizAttempt = {
              id = nextAttemptId;
              studentId = caller;
              lessonId;
              answers;
              score;
              completedAt = Time.now();
            };
            quizAttempts.add(nextAttemptId, attempt);
            nextAttemptId += 1;
            #ok(attempt);
          };
        };
      };
    };
  };

  // ── Discussion ────────────────────────────────────────────────────────────────
  public shared ({ caller }) func postDiscussion(lessonId : Nat, content : Text, parentId : ?Nat) : async { #ok : DiscussionPost; #err : Text } {
    switch (lessons.get(lessonId)) {
      case null { #err("Lesson not found") };
      case (?_) {
        let name = studentNames.get(caller.toText()).get("Anonymous");
        let post : DiscussionPost = {
          id = nextPostId;
          lessonId;
          authorId = caller;
          authorName = name;
          content;
          parentId;
          createdAt = Time.now();
        };
        discussionPosts.add(nextPostId, post);
        nextPostId += 1;
        #ok(post);
      };
    };
  };

  // ── Queries ───────────────────────────────────────────────────────────────────
  public query func getPublishedCourses() : async [CourseWithStats] {
    courses.values().toArray()
      .filter(func(c : Course) : Bool { c.isPublished })
      .map(func(course : Course) : CourseWithStats {
        let enrollCount = enrollments.keys().toArray()
          .filter(func(k : Text) : Bool { k.endsWith(#text (":" # course.id.toText())) })
          .size();
        { course; enrollmentCount = enrollCount; lessonCount = getLessonsForCourse(course.id).size() };
      });
  };

  public query func getAllCourses() : async [CourseWithStats] {
    courses.values().toArray()
      .map(func(course : Course) : CourseWithStats {
        let enrollCount = enrollments.keys().toArray()
          .filter(func(k : Text) : Bool { k.endsWith(#text (":" # course.id.toText())) })
          .size();
        { course; enrollmentCount = enrollCount; lessonCount = getLessonsForCourse(course.id).size() };
      });
  };

  public query func getLessons(courseId : Nat) : async [Lesson] {
    getLessonsForCourse(courseId);
  };

  public query func getQuizQuestionsForStudent(lessonId : Nat) : async [{ id : Nat; question : Text; options : [Text] }] {
    quizQuestions.values().toArray()
      .filter(func(q : QuizQuestion) : Bool { q.lessonId == lessonId })
      .map(func(q : QuizQuestion) : { id : Nat; question : Text; options : [Text] } {
        { id = q.id; question = q.question; options = q.options };
      });
  };

  public query func getQuizQuestionsForTeacher(lessonId : Nat) : async [QuizQuestion] {
    quizQuestions.values().toArray()
      .filter(func(q : QuizQuestion) : Bool { q.lessonId == lessonId });
  };

  public query ({ caller }) func getMyEnrolledCourses() : async [{ courseId : Nat; enrolledAt : Int }] {
    let prefix = caller.toText() # ":";
    enrollments.entries().toArray()
      .filter(func(e : (Text, Int)) : Bool { e.0.startsWith(#text prefix) })
      .filterMap(func(e : (Text, Int)) : ?{ courseId : Nat; enrolledAt : Int } {
        let idText = e.0.trimStart(#text prefix);
        switch (Nat.fromText(idText)) {
          case null null;
          case (?cid) ?{ courseId = cid; enrolledAt = e.1 };
        };
      });
  };

  public query ({ caller }) func getMyProgress(courseId : Nat) : async StudentProgress {
    let courseLessons = getLessonsForCourse(courseId);
    var completed = 0;
    var xp = 0;
    for (lesson in courseLessons.vals()) {
      if (lessonProgress.get(progressKey(caller, lesson.id)).isSome()) {
        completed += 1;
        xp += 10;
      };
    };
    for (attempt in quizAttempts.values()) {
      if (attempt.studentId == caller) {
        switch (lessons.get(attempt.lessonId)) {
          case null ();
          case (?l) {
            if (l.courseId == courseId) xp += attempt.score / 10;
          };
        };
      };
    };
    { courseId; completedLessons = completed; totalLessons = courseLessons.size(); totalXp = xp };
  };

  public query ({ caller }) func getMyQuizAttempts(lessonId : Nat) : async [QuizAttempt] {
    quizAttempts.values().toArray()
      .filter(func(a : QuizAttempt) : Bool {
        a.studentId == caller and a.lessonId == lessonId;
      });
  };

  public query func getDiscussionPosts(lessonId : Nat) : async [DiscussionPost] {
    discussionPosts.values().toArray()
      .filter(func(p : DiscussionPost) : Bool { p.lessonId == lessonId })
      .sort(func(a : DiscussionPost, b : DiscussionPost) : Order.Order {
        if (a.createdAt < b.createdAt) #less
        else if (a.createdAt > b.createdAt) #greater
        else #equal;
      });
  };

  public query func getLeaderboard() : async [LeaderboardEntry] {
    let seen = Map.empty<Text, Bool>();
    for (key in enrollments.keys()) {
      let parts = key.split(#char ':').toArray();
      if (parts.size() > 0) seen.add(parts[0], true);
    };
    seen.keys().toArray()
      .map(func(pidText : Text) : LeaderboardEntry {
        let p = Principal.fromText(pidText);
        var xp = 0;
        var completedCount = 0;
        let prefix = pidText # ":";
        for (key in lessonProgress.keys()) {
          if (key.startsWith(#text prefix)) {
            xp += 10;
            completedCount += 1;
          };
        };
        for (attempt in quizAttempts.values()) {
          if (attempt.studentId == p) xp += attempt.score / 10;
        };
        let name = studentNames.get(pidText).get("Student");
        { studentId = p; name; totalXp = xp; completedLessons = completedCount };
      })
      .sort(func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
        if (a.totalXp > b.totalXp) #less
        else if (a.totalXp < b.totalXp) #greater
        else #equal;
      })
      |> (if (_.size() <= 10) _ else { let arr = _; [arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7], arr[8], arr[9]] });
  };

  public query ({ caller }) func isEnrolled(courseId : Nat) : async Bool {
    enrollments.get(enrollKey(caller, courseId)).isSome();
  };

  public query ({ caller }) func isLessonComplete(lessonId : Nat) : async Bool {
    lessonProgress.get(progressKey(caller, lessonId)).isSome();
  };
};
