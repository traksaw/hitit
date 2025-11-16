# 🔐 Role-Based Permissions System

## Overview

The jam collaboration system now supports role-based permissions with four distinct roles:

### Roles Hierarchy

1. **Owner** (Highest privileges)
   - Can do everything
   - Delete jam
   - Manage collaborators (add/remove/change roles)
   - Edit jam settings
   - Add/remove clips
   - Comment and like

2. **Producer**
   - Edit jam settings (title, description, privacy)
   - Add/remove clips
   - Manage audio mix
   - Comment and like
   - **Cannot**: Delete jam, manage collaborators

3. **Contributor**
   - Add clips only
   - Comment and like
   - **Cannot**: Edit jam settings, remove clips, manage mix

4. **Viewer**
   - View jam content
   - Comment and like
   - **Cannot**: Add/edit/remove clips, edit jam settings

---

## Database Schema

### Updated Jam Model

```javascript
collaborators: [
  {
    user: ObjectId (ref: 'User'),
    role: String (enum: ['producer', 'contributor', 'viewer']),
    addedAt: Date,
    addedBy: ObjectId (ref: 'User')
  }
]
```

The `user` field (owner) automatically has 'owner' role.

---

## Permission Methods

### On Jam Model

```javascript
jam.getUserRole(userId)      // Returns: 'owner', 'producer', 'contributor', 'viewer', or null
jam.canEdit(userId)          // Returns: true if owner or producer
jam.canContribute(userId)    // Returns: true if owner, producer, or contributor
jam.canView(userId)          // Returns: true if any role
jam.isOwner(userId)          // Returns: true if owner
```

---

## Middleware

### Permission Middleware Functions

Located in `backend/middleware/jamPermissions.js`:

- `ensureOwner` - Only jam owner can proceed
- `ensureCanEdit` - Owner or producer can proceed
- `ensureCanContribute` - Owner, producer, or contributor can proceed
- `ensureCanView` - Any collaborator can proceed (or public jam)

### Usage Example

```javascript
router.delete(
  '/deleteJam/:id',
  ensureAuth,
  ensureOwner,  // ← Only owner can delete
  clipsController.deleteJam
);
```

---

## Protected Routes

### Routes with Permission Checks

| Route | Required Permission | Who Can Access |
|-------|-------------------|----------------|
| `PUT /addClipToJam/:jamid/:clipid` | `ensureCanContribute` | Owner, Producer, Contributor |
| `DELETE /deleteClipFromJam/:jamid/:clipid` | `ensureCanEdit` | Owner, Producer |
| `PUT /addUserToJam/:jamid/:userid` | `ensureOwner` | Owner only |
| `DELETE /deleteUserFromJam/:jamid/:userid` | `ensureOwner` | Owner only |
| `DELETE /deleteJam/:id` | `ensureOwner` | Owner only |

---

## API Changes

### Adding Collaborators with Roles

**Endpoint:** `PUT /clips/addUserToJam/:jamid/:userid`

**Query Parameters:**
```
?role=producer|contributor|viewer
```

**Example:**
```javascript
PUT /clips/addUserToJam/507f1f77bcf86cd799439011/507f191e810c19729de860ea?role=producer
```

### Get User's Role

**Endpoint:** `GET /api/jam/:id`

**Response includes:**
```json
{
  "jam": { ... },
  "userRole": "producer",  // ← User's role in this jam
  "permissions": {
    "canEdit": true,
    "canContribute": true,
    "canDelete": false
  }
}
```

---

## Frontend Integration

### Updated Jam Type

```typescript
interface JamCollaborator {
  user: string | User;
  role: 'producer' | 'contributor' | 'viewer';
  addedAt: Date;
  addedBy?: string | User;
}

interface Jam {
  // ... existing fields
  collaborators: JamCollaborator[];
}
```

### Permission-Based UI

```svelte
{#if permissions.canEdit}
  <button on:click={deleteClip}>Delete Clip</button>
{/if}

{#if permissions.canContribute}
  <button on:click={addClip}>Add Clip</button>
{/if}
```

---

## Migration Notes

### Breaking Change

The `collaborators` field changed from:
```javascript
collaborators: [ObjectId, ObjectId, ...]
```

To:
```javascript
collaborators: [
  { user: ObjectId, role: 'contributor', addedAt: Date, addedBy: ObjectId },
  ...
]
```

### Handling Old Data

Existing jams with old collaborator format will need migration. Options:

1. **Automatic Migration:** Update queries to handle both formats
2. **Manual Migration:** Run script to convert old data
3. **Lazy Migration:** Convert on first edit

---

## Testing Checklist

- [ ] Owner can delete jam
- [ ] Producer can edit jam but not delete
- [ ] Producer can add/remove clips
- [ ] Contributor can only add clips
- [ ] Contributor cannot remove clips
- [ ] Viewer can only view and comment
- [ ] Non-collaborators cannot access private jams
- [ ] Permission denied returns 403 with clear message

---

## Next Steps

1. ✅ Database schema updated
2. ✅ Permission middleware created
3. ✅ Routes protected
4. ⏳ Update controllers to handle role parameter
5. ⏳ Build frontend UI for role management
6. ⏳ Create role change API
7. ⏳ Add role indicators in UI

---

**Status:** Backend foundation complete, ready for controller updates and frontend integration.
