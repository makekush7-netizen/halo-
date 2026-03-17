# Halo PRD (March 17, 2026)

## 1. Product Overview
Halo is a real-time video meeting platform with two modes:
- **Personal Meetings**: anyone can create or join a meeting instantly (Google Meet style).
- **Organization Mode**: admins register and verify an organization, then run multiple concurrent meetings from a cockpit, managing members and permissions.

The primary differentiator is the **organization cockpit**: admins (and co-admins) can create and move between sessions with real-time oversight.

## 2. Goals
- Launch a premium, minimal UI with a clear user flow in a few hours.
- Deliver a reliable meeting experience (create/join, video, audio, shareable link).
- Support organization governance: admin control, member assignment, and session access boundaries.

## 3. Target Users
- **Personal Users**: anyone who needs a quick meeting link.
- **Organization Admins**: owners who create orgs and manage sessions.
- **Co-Admins**: peers of admin who can create/manage sessions and members.
- **Members**: join assigned meetings only.

## 4. User Roles and Permissions
### Admin
- Register and verify organization.
- Create, edit, and end meetings.
- Invite members, promote to co-admin.
- Jump between any meeting in the organization cockpit.

### Co-Admin
- Create and manage meetings.
- Invite members.
- Cannot override admin ownership or modify org verification.

### Member
- Join meetings they are assigned to.
- Cannot access meetings outside their assignment.

## 5. Core User Flows
### Personal Mode
1. Landing page -> "Try it Free".
2. Create meeting (generates room code + link).
3. Share link; participants join without account.

### Organization Mode
1. Landing page -> "Register Organization".
2. Admin registers org and receives verification (instant for MVP).
3. Admin lands in cockpit dashboard.
4. Admin creates meetings and assigns members.
5. Co-admins manage meetings in their scope.

## 6. Key Features (MVP)
### Personal
- Create meeting
- Join meeting with code
- Shareable link
- Audio/video on/off

### Organization
- Org registration + verification
- Role-based access (Admin, Co-Admin, Member)
- Cockpit to switch between sessions
- Create/assign meetings

## 7. Non-Goals (for MVP)
- Full billing/pricing system
- Recordings and storage
- Deep analytics and reporting beyond basics
- Complex org hierarchies beyond Admin/Co-Admin/Member

## 8. Data Model (Minimal)
### Organization
- orgId, orgName, verified, createdBy, createdAt

### User
- userId, email, role, orgId

### Meeting
- meetingId, orgId (optional), ownerId, title, status, createdAt

### Membership
- meetingId, userId, role

## 9. UX and Visual Direction
- Minimal black base with lemon-green accents.
- Premium typography (Space Grotesk, Inter).
- Use real imagery for storytelling sections.
- Strong hero with 2 CTAs: Register Organization, Try it Free.
- Clear mode-switch between Personal vs Organization.

## 10. Tech Stack
- Frontend: React + Vite
- Realtime: LiveKit (self-hosted)
- Backend: AWS Lambda + API Gateway
- Storage: DynamoDB + S3

## 11. Milestones
1. PRD finalized
2. Landing page rebuilt
3. Auth flow updated for org registration
4. Cockpit + meeting flows wired
5. End-to-end video tested

## 12. Success Criteria
- Personal meeting flow works in under 60 seconds.
- Admin can create org and launch meetings with role enforcement.
- Clean UI feels premium and modern.
