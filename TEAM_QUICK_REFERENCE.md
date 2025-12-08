# Team Access Quick Reference

## Quick Start

### 1. Navigate to Team Page
From any project detail page: Click "👥 Team" button

### 2. Invite a Collaborator
1. Enter GitHub username
2. Select role (Viewer or Maintainer)
3. Click "Invite"

### 3. Manage Members
- **Change Role:** Use dropdown next to member (owner only)
- **Remove Member:** Click "Remove" button

## Role Permissions

| Action | Owner | Maintainer | Viewer |
|--------|-------|-----------|--------|
| View project | ✅ | ✅ | ✅ |
| Deploy project | ✅ | ✅ | ❌ |
| Add members | ✅ | ✅ (viewer/maintainer) | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Remove viewers | ✅ | ✅ | ❌ |
| Remove maintainers | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

## API Quick Reference

### List Members
```bash
GET /api/projects/{id}/members
```

### Add Member
```bash
POST /api/projects/{id}/members
Body: { "username": "githubuser", "role": "viewer" }
```

### Update Role
```bash
PATCH /api/projects/{id}/members/{userId}
Body: { "role": "maintainer" }
```

### Remove Member
```bash
DELETE /api/projects/{id}/members/{userId}
```

## Common Tasks

### Make Someone a Maintainer
1. Go to Team page
2. Find their card in Active Members
3. Change dropdown from "Viewer" to "Maintainer"

### Remove Someone
1. Go to Team page
2. Find their card
3. Click "Remove" button
4. Confirm deletion

### Check Your Role
Look at the badge next to your name:
- 🟡 Yellow "Owner" - You created this project
- 🟢 Green "Maintainer" - You can deploy
- 🔵 Blue "Viewer" - Read-only access
- ⚪ Gray "Pending" - Invitation not accepted yet

## Database Schema

```sql
project_members {
  id: UUID primary key
  project_id: UUID → projects.id
  user_id: UUID → users.id
  role: "owner" | "maintainer" | "viewer"
  invited_by: UUID → users.id
  invited_at: timestamp
  status: "pending" | "accepted" | "declined"
}
```

## Helper Functions

```javascript
import {
  getProjectMembers,
  getUserRole,
  hasPermission,
  addProjectMember,
  updateMemberRole,
  removeMember,
} from "@/lib/db/project-members";

// Check permission
const canDeploy = await hasPermission(db, projectId, userId, "maintainer");

// Get all members
const members = await getProjectMembers(db, projectId);

// Add member
await addProjectMember(db, {
  projectId,
  userId,
  role: "viewer",
  invitedBy: currentUserId,
});
```

## Troubleshooting

### "User not found"
- User must have logged in to the platform at least once
- Check GitHub username spelling

### "Access denied"
- You don't have permission for this action
- Check your role on the team page

### "User is already a member"
- Cannot invite existing members
- Remove them first, then re-invite

### Migration not applied
```bash
# Local
npx wrangler d1 execute eleven-db --local --file=./drizzle/migrations/0002_vengeful_rhino.sql

# Remote (requires auth)
npx wrangler d1 execute eleven-db --remote --file=./drizzle/migrations/0002_vengeful_rhino.sql
```

## Status Codes

- `200` - Success
- `400` - Bad request (invalid input)
- `401` - Not authenticated
- `403` - Not authorized (insufficient permissions)
- `404` - Not found (user, project, or member)
- `409` - Conflict (duplicate member)
- `500` - Server error
