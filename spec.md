# EduLoom

## Current State
Courses are created on the backend via `createCourse` (isPublished=false by default), then a separate `publishCourse` call is made. This publish call is wrapped in a silent try/catch in all sync paths (auto-sync, manual sync, create page). If `publishCourse` fails silently, the course exists on the backend but returns invisible to students because `getPublishedCourses` filters by isPublished=true. This is the root cause of the persistent sync bug.

## Requested Changes (Diff)

### Add
- Backend: `publishAllCourses()` function that sets all existing courses to isPublished=true (one-shot recovery)
- Backend: `createCourse` now auto-sets isPublished=true so the separate publishCourse call is not needed
- Frontend: On Teacher Console mount, call `publishAllCourses()` to recover any courses stuck as unpublished

### Modify
- Backend: `createCourse` sets `isPublished = true` by default so all newly created courses are immediately visible to students
- Frontend: Remove all silent try/catch swallowing around `publishCourse` calls; make publish mandatory
- Frontend: Auto-sync, manual sync, and create-course flows all use the new auto-published createCourse
- Frontend: On Student Console "Explore Courses", call `getAllCourses` (not just `getPublishedCourses`) so all courses are visible regardless of published state

### Remove
- Backend: The isPublished filter is no longer critical since createCourse auto-publishes; keep for API compatibility but default to true

## Implementation Plan
1. Regenerate backend with createCourse defaulting to isPublished=true and add publishAllCourses() bulk recovery function
2. Fix frontend to call publishAllCourses on Teacher Console load
3. Fix Student Console to use getAllCourses so all courses appear
4. Remove all silent publishCourse try/catch wrappers in sync flows
