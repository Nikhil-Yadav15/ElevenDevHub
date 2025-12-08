# Team Access & Permissions Feature

## Overview
Implemented a complete team collaboration system that allows project owners to invite collaborators with different permission levels.

## Features

### Role-Based Access Control
Three distinct roles with hierarchical permissions:

1. **Owner** (Level 3)
   - Full control over the project
   - Can add/remove members
   - Can change member roles
   - Automatically assigned to project creator
   - Cannot be removed or changed

2. **Maintainer** (Level 2)
   - Can deploy projects
   - Can view all project details
   - Can add new members (as Viewer or Maintainer)
   - Can remove Viewers
   - Cannot remove other Maintainers or themselves

3. **Viewer** (Level 1)
   - Read-only access
   - Can view project details
   - Cannot make changes
   - Cannot add/remove members

### Invitation System
- Invite users by GitHub username
- Track invitation status: `pending`, `accepted`, `declined`
- Track who invited each member
- Display pending invitations separately in UI

## Implementation Details

### Database Schema

#### New Table: `project_members`
```sql
CREATE TABLE `project_members` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `user_id` text NOT NULL,
  `role` text DEFAULT 'viewer' NOT NULL,
  `invited_by` text NOT NULL,
  `invited_at` integer DEFAULT (unixepoch()) NOT NULL,
  `status` text DEFAULT 'accepted' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
  FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`)
);
```

**Indexes:**
- `project_id` - Fast lookup of project members
- `user_id` - Fast lookup of user's projects
- Unique constraint on (`project_id`, `user_id`) - Prevents duplicate memberships

**Migration:** `drizzle/migrations/0002_vengeful_rhino.sql`

### Helper Functions

File: `lib/db/project-members.js`

1. **getProjectMembers(db, projectId)**
   - Returns all members with user details (JOIN with users table)
   - Includes: id, userId, username, email, avatarUrl, role, status

2. **getUserRole(db, projectId, userId)**
   - Gets user's role and status in a specific project
   - Returns null if user is not a member

3. **hasPermission(db, projectId, userId, requiredRole)**
   - Checks if user has required permission level
   - Uses hierarchy: owner (3) > maintainer (2) > viewer (1)
   - Returns true if user's level >= required level

4. **addProjectMember(db, data)**
   - Adds new member to project
   - Generates UUID for member record
   - Sets timestamps automatically

5. **updateMemberRole(db, projectId, userId, newRole)**
   - Updates member's role
   - Only callable by project owner

6. **removeMember(db, projectId, userId)**
   - Removes member from project
   - Owner/Maintainer can remove Viewers
   - Owner can remove anyone except themselves

7. **getUserProjectMemberships(db, userId)**
   - Gets all projects where user is a member
   - Returns project details with role

8. **findUserByUsername(db, username)**
   - Finds user by GitHub username
   - Used for invitations

### API Endpoints

#### GET `/api/projects/[id]/members`
**Purpose:** List all team members

**Authentication:** Required

**Authorization:** Must be owner or member (viewer+)

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "userId": "uuid",
      "username": "githubuser",
      "email": "user@example.com",
      "avatarUrl": "https://...",
      "role": "owner",
      "status": "accepted",
      "isOwner": true,
      "invitedAt": 1234567890
    }
  ]
}
```

#### POST `/api/projects/[id]/members`
**Purpose:** Invite new member

**Authentication:** Required

**Authorization:** Must be owner or maintainer

**Body:**
```json
{
  "username": "githubuser",
  "role": "viewer" // or "maintainer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "githubuser added as viewer",
  "member": {
    "id": "uuid",
    "userId": "uuid",
    "username": "githubuser",
    "role": "viewer",
    "status": "accepted"
  }
}
```

**Validations:**
- Username must exist in users table
- Cannot add existing members (409 Conflict)
- Cannot set role as "owner" (only viewer/maintainer)

#### PATCH `/api/projects/[id]/members/[userId]`
**Purpose:** Update member role

**Authentication:** Required

**Authorization:** Must be project owner

**Body:**
```json
{
  "role": "maintainer" // or "viewer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated to maintainer"
}
```

#### DELETE `/api/projects/[id]/members/[userId]`
**Purpose:** Remove member from project

**Authentication:** Required

**Authorization:**
- Owner: Can remove anyone
- Maintainer: Can remove viewers only (not other maintainers or themselves)

**Response:**
```json
{
  "success": true,
  "message": "Member removed from project"
}
```

### UI Components

#### Team Management Page
**Route:** `/projects/[id]/team`

**Features:**
- View all team members with avatars
- Separate sections for Owner, Active Members, Pending Invites
- Invite form (username + role dropdown)
- Role dropdown for each member (owner only)
- Remove button for each member (owner/maintainer)
- Visual status indicators (badges)

**Access Control:**
- Owner sees: Full controls (invite, change roles, remove)
- Maintainer sees: Can invite, can remove viewers, cannot change roles
- Viewer sees: Read-only list

**UI Sections:**

1. **Invite Form** (Owner/Maintainer only)
   - GitHub username input
   - Role selector (Viewer/Maintainer)
   - Submit button

2. **Owner Section**
   - Single card with owner details
   - Yellow "Owner" badge
   - Cannot be modified

3. **Active Members**
   - Cards for accepted members
   - Avatar, username, email
   - Role dropdown (owner only)
   - Remove button (owner/maintainer)

4. **Pending Invites**
   - Dimmed cards for pending members
   - Gray "Pending" badge
   - Cancel button (owner/maintainer)

#### Project Detail Page Enhancement
**Route:** `/projects/[id]`

**Addition:** "👥 Team" button in header
- Blue button next to "Delete"
- Links to `/projects/[id]/team`
- Always visible to all members

### Auto-Add Owner on Project Creation

**Modified:** `lib/db/helpers.js` - `createProject()`

When a project is created:
1. Project record is inserted
2. Automatically adds creator to `project_members` table
3. Role: "owner"
4. Status: "accepted" (not pending)
5. invitedBy: self (creator's userId)

This ensures the permission system works immediately after project creation.

## Permission Hierarchy

```
owner (3)     → Full control
   ↓
maintainer (2) → Deploy + manage
   ↓
viewer (1)    → Read-only
```

**Hierarchy Logic:**
```javascript
const roleHierarchy = {
  owner: 3,
  maintainer: 2,
  viewer: 1,
};

// User can perform action if their level >= required level
hasPermission(userRole, requiredRole) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
```

## Security Considerations

1. **Authentication Check:** All endpoints verify user is logged in
2. **Authorization Check:** Each endpoint validates user's permission level
3. **Cascade Delete:** Removing a project deletes all members
4. **Cascade Delete:** Removing a user deletes all their memberships
5. **Unique Constraint:** Prevents duplicate memberships
6. **Owner Protection:** Owner cannot be removed or downgraded
7. **Self-Protection:** Maintainers cannot remove themselves

## Future Enhancements

1. **Email Notifications:** Send invites via email
2. **Invitation Acceptance:** Let users accept/decline invites
3. **Activity Log:** Track who did what and when
4. **Team Transfer:** Allow owner to transfer ownership
5. **Permission Customization:** Add more granular permissions
6. **Bulk Operations:** Invite/remove multiple users at once
7. **User Search:** Auto-complete for username input
8. **Member Activity:** Show last active date for each member

## Testing Checklist

- [ ] Create a project (owner auto-added)
- [ ] Invite a viewer (by GitHub username)
- [ ] Invite a maintainer
- [ ] Change viewer to maintainer
- [ ] Change maintainer to viewer
- [ ] Remove a viewer as owner
- [ ] Remove a viewer as maintainer
- [ ] Try to remove maintainer as maintainer (should fail)
- [ ] Remove a maintainer as owner
- [ ] Try to remove owner (should fail)
- [ ] View team page as owner (full controls)
- [ ] View team page as maintainer (limited controls)
- [ ] View team page as viewer (read-only)
- [ ] Try to access project as non-member (should fail)
- [ ] Delete project (all members removed)

## Files Modified/Created

### New Files
- `lib/db/project-members.js` - Helper functions
- `app/api/projects/[id]/members/route.js` - GET/POST endpoints
- `app/api/projects/[id]/members/[userId]/route.js` - PATCH/DELETE endpoints
- `app/projects/[id]/team/page.js` - Team management UI
- `drizzle/migrations/0002_vengeful_rhino.sql` - Database migration

### Modified Files
- `lib/db/schema.js` - Added projectMembers table definition
- `lib/db/helpers.js` - Updated createProject to auto-add owner
- `app/projects/[id]/page.js` - Added "Team" button to header

## Usage Example

```javascript
// Check if user can deploy (requires maintainer role)
const canDeploy = await hasPermission(db, projectId, userId, "maintainer");

// Add a viewer
await addProjectMember(db, {
  projectId: "project-uuid",
  userId: "user-uuid",
  role: "viewer",
  invitedBy: "inviter-uuid",
});

// Get all members
const members = await getProjectMembers(db, projectId);

// Update role
await updateMemberRole(db, projectId, userId, "maintainer");

// Remove member
await removeMember(db, projectId, userId);
```

## Environment Requirements

- Node.js 18+
- Next.js 16+
- Cloudflare D1 Database
- Drizzle ORM
- GitHub OAuth (for user identification)

## Migration Applied

Local database: ✅ Applied
Remote database: ⚠️ Not applied (requires Cloudflare auth setup)

To apply to remote:
```bash
npx wrangler d1 execute eleven-db --remote --file=./drizzle/migrations/0002_vengeful_rhino.sql
```
