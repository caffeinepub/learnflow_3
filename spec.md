# EduLoom

## Current State
EduLoom is an educational platform with a Teacher Console and Student Console. Teachers create courses and generate 50 learning items (Activities, Worksheets, LSRW Tasks, Games, Exercises) from uploaded PDFs. Currently, both courses and lessons are saved to the teacher's browser localStorage. Students on other devices cannot see any courses or lessons.

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- **Course creation (`CreateCoursePage`)**: Change `mutationFn` to call `actor.createCourse(title, description)` (backend) instead of `saveLocalCourse`. After creation, immediately call `actor.publishCourse(id, true)` to make it visible to students. Store extra metadata (section, subject, room, bannerColor) in localStorage keyed by backend course ID (e.g. `eduloom_meta_{id}`) for display enrichment.
- **Teacher publish toggle (`publishMutation`)**: For local-only courses (those in localStorage without a backend ID), first call `actor.createCourse()`, then `actor.publishCourse()`, then remove from localStorage and save the metadata. For backend courses, continue calling `actor.publishCourse()` directly.
- **Lesson/activity generation**: When "Generate 50 Learning Items" is clicked, call `actor.batchCreateLessons(courseId, inputs)` to save to backend. Keep a localStorage fallback for courses that are still local-only. The `courseId` for backend courses is the bigint ID from the backend.
- **Student Explore page (`ExplorePage`)**: Keep `actor.getPublishedCourses()` as primary source. Remove or deprioritize the local-course fallback since courses will now be in the backend. Students will now see courses created by the teacher.
- **Student course view (lesson list)**: Use `actor.getLessons(courseId)` as primary source for lessons. Merge with localStorage lessons as fallback for old local courses.
- **Teacher course management**: Courses from backend take priority. Keep local course display for backward compatibility.

### Remove
- Nothing to remove

## Implementation Plan
1. Fix `CreateCoursePage`: use `actor` (not `_actor`), call `actor.createCourse()` then `actor.publishCourse(id, true)`, save metadata locally.
2. Fix `publishMutation`: sync local courses to backend on publish by calling `actor.createCourse()` + `actor.publishCourse()`.
3. Fix lesson generation (`generateActivities` / `saveLocalLessons` call): call `actor.batchCreateLessons(courseId, inputs)` for backend courses. For local courses, keep localStorage.
4. Fix student lesson view: read from `actor.getLessons(courseId)` merged with local fallback.
5. Fix `ExplorePage`: show backend published courses to all students regardless of device.
