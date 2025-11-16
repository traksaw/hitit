# 🎯 Phase 2: Core Experience - Implementation Guide

## ✅ **What's Already Done**

### Current Infrastructure:
- ✅ User profile page (`/profile`) with stats, jams, clips
- ✅ User authentication (Passport.js)
- ✅ WebSocket infrastructure (Socket.IO) for real-time features
- ✅ Public API endpoints for profiles
- ✅ Jam privacy model added (`isPrivate` field)

---

## 🚀 **Phase 2 Features to Implement**

### **1. User Profile Pages (Public/Private Views)** - Priority: HIGH

#### **Current State:**
- Profile page only shows logged-in user's profile
- No way to view other users' profiles
- No privacy controls

#### **Implementation Plan:**

**A. Create Dynamic Profile Route**
```
frontend/src/routes/profile/[userId]/+page.svelte
```
- View any user's profile by ID
- Shows public information only if not owner
- Falls back to `/profile` for current user

**B. Update Backend to Filter Private Content**
```javascript
// In getProfileAPI controller:
if (!isOwnProfile) {
  // Filter out private jams
  jams = jams.filter(jam => !jam.isPrivate);

  // Hide email and sensitive info
  user = {
    userName: user.userName,
    image: user.image,
    favoriteGenres: user.favoriteGenres
    // Don't include email
  };
}
```

**C. Add Privacy Controls UI**
- Toggle in jam creation form
- Edit privacy on existing jams
- Visual indicator (🔒 icon) for private jams

---

### **2. Privacy Toggles for Jams** - Priority: HIGH

#### **Implementation:**

**A. Update Create Jam Form**
```svelte
<!-- In create-jam/+page.svelte -->
<div class="form-group">
  <label>
    <input type="checkbox" bind:checked={isPrivate} />
    Make this jam private
  </label>
  <p class="help-text">Private jams are only visible to you and collaborators</p>
</div>
```

**B. Backend Validation**
```javascript
// In clips controller createJam:
const newJam = await Jam.create({
  // ... existing fields
  isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true
});
```

**C. Feed Filtering**
```javascript
// In getJamFeedAPI:
const query = {
  $or: [
    { isPrivate: false }, // Public jams
    { user: req.user.id }, // User's own jams
    { collaborators: req.user.id } // Jams they collaborate on
  ]
};
const jams = await Jam.find(query).sort({ createdAt: 'desc' });
```

---

### **3. Dark Mode Theme** - Priority: MEDIUM

#### **Implementation Plan:**

**A. Create Theme Store**
```typescript
// frontend/src/lib/stores/theme.ts
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function createThemeStore() {
  // Load from localStorage or system preference
  const stored = localStorage.getItem('theme') as Theme;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial: Theme = stored || (prefersDark ? 'dark' : 'light');

  const { subscribe, set } = writable<Theme>(initial);

  return {
    subscribe,
    toggle: () => {
      set(current === 'dark' ? 'light' : 'dark');
    },
    set: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      set(theme);
    }
  };
}

export const themeStore = createThemeStore();
```

**B. Add Dark Mode CSS Variables**
```css
/* In app.css */
:root {
  /* Light mode (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e9ecef;
  --accent: #667eea;
}

.dark {
  /* Dark mode */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e4e4e4;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  --accent: #8b9eff;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s, color 0.3s;
}
```

**C. Theme Toggle Component**
```svelte
<!-- frontend/src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
  import { themeStore } from '$lib/stores/theme';

  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<button on:click={toggleTheme} class="theme-toggle" title="Toggle dark mode">
  {#if $themeStore === 'dark'}
    ☀️ Light
  {:else}
    🌙 Dark
  {/if}
</button>
```

**D. Add to Header**
```svelte
<!-- In Header.svelte -->
<ThemeToggle />
```

---

### **4. Notification System** - Priority: MEDIUM

#### **Backend Implementation:**

**A. Create Notification Model**
```javascript
// backend/models/Notification.js
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'collaborator_add', 'mention'],
    required: true,
  },
  jam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jam',
    required: false,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
```

**B. Notification Controller**
```javascript
// backend/controllers/notifications.js
const Notification = require('../models/Notification');

module.exports = {
  // Get user's notifications
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ recipient: req.user.id })
        .populate('sender', 'userName image')
        .populate('jam', 'title image')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { read: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  },

  // Mark all as read
  markAllAsRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { recipient: req.user.id, read: false },
        { read: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  },

  // Create notification helper
  createNotification: async (recipientId, senderId, type, message, relatedData = {}) => {
    try {
      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        message,
        ...relatedData
      });

      // Emit real-time notification via Socket.IO
      const io = require('../services/collaboration').io;
      if (io) {
        io.to(`user:${recipientId}`).emit('notification', {
          type,
          message,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }
};
```

**C. Trigger Notifications**
```javascript
// In likeJam controller:
const { createNotification } = require('./notifications');

// After successful like:
if (jam.user.toString() !== req.user.id.toString()) {
  await createNotification(
    jam.user,
    req.user.id,
    'like',
    `${req.user.userName} liked your jam "${jam.title}"`,
    { jam: jam._id }
  );
}

// In createComment controller:
await createNotification(
  jam.user,
  req.user.id,
  'comment',
  `${req.user.userName} commented on "${jam.title}"`,
  { jam: jam._id, comment: newComment._id }
);

// In addUserToJam controller:
await createNotification(
  req.params.userid,
  req.user.id,
  'collaborator_add',
  `${req.user.userName} added you to "${jam.title}"`,
  { jam: jam._id }
);
```

#### **Frontend Implementation:**

**A. Notification Store**
```typescript
// frontend/src/lib/stores/notifications.ts
import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

interface Notification {
  _id: string;
  sender: { userName: string; image: string };
  type: 'like' | 'comment' | 'collaborator_add';
  message: string;
  jam?: { title: string; _id: string };
  read: boolean;
  createdAt: string;
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<Notification[]>([]);

  let socket: any = null;

  return {
    subscribe,
    init: async () => {
      // Fetch initial notifications
      const response = await fetch('/api/notifications');
      const data = await response.json();
      set(data.notifications);

      // Connect to real-time notifications
      socket = io();
      socket.on('notification', (notification: Notification) => {
        update(notifications => [notification, ...notifications]);
      });
    },
    markAsRead: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      update(notifications =>
        notifications.map(n => n._id === id ? { ...n, read: true } : n)
      );
    },
    markAllAsRead: async () => {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      update(notifications =>
        notifications.map(n => ({ ...n, read: true }))
      );
    }
  };
}

export const notificationStore = createNotificationStore();
```

**B. Notification Bell Component**
```svelte
<!-- frontend/src/lib/components/NotificationBell.svelte -->
<script lang="ts">
  import { notificationStore } from '$lib/stores/notifications';
  import { onMount } from 'svelte';

  let showDropdown = false;
  let unreadCount = 0;

  $: unreadCount = $notificationStore.filter(n => !n.read).length;

  onMount(() => {
    notificationStore.init();
  });

  function toggleDropdown() {
    showDropdown = !showDropdown;
    if (showDropdown) {
      notificationStore.markAllAsRead();
    }
  }
</script>

<div class="notification-bell">
  <button on:click={toggleDropdown} class="bell-button">
    🔔
    {#if unreadCount > 0}
      <span class="badge">{unreadCount}</span>
    {/if}
  </button>

  {#if showDropdown}
    <div class="dropdown">
      <h3>Notifications</h3>
      {#if $notificationStore.length === 0}
        <p class="empty">No notifications yet</p>
      {:else}
        {#each $notificationStore as notification}
          <div class="notification-item {notification.read ? 'read' : 'unread'}">
            <img src={notification.sender.image} alt={notification.sender.userName} />
            <div class="content">
              <p>{notification.message}</p>
              <span class="time">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .notification-bell {
    position: relative;
  }

  .bell-button {
    position: relative;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    width: 350px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
  }

  .notification-item {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .notification-item.unread {
    background: #f0f8ff;
  }

  .notification-item img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  .content p {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
  }

  .time {
    font-size: 0.75rem;
    color: #999;
  }
</style>
```

---

## 📋 **Implementation Checklist**

### High Priority:
- [ ] Add privacy field to Jam creation form
- [ ] Filter private jams from public feed
- [ ] Create `/profile/[userId]` dynamic route
- [ ] Add dark mode theme toggle
- [ ] Create dark mode CSS variables

### Medium Priority:
- [ ] Notification backend (model + controller)
- [ ] Notification triggers (likes, comments, invites)
- [ ] Notification UI component
- [ ] Real-time notifications via WebSocket

### Low Priority:
- [ ] Settings page for preferences
- [ ] Email notifications (optional)
- [ ] Notification preferences (mute types)

---

## 🧪 **Testing Plan**

1. **Privacy:**
   - Create private jam → should not appear in public feed
   - View own profile → should see private jams
   - View other user's profile → should not see their private jams

2. **Dark Mode:**
   - Toggle theme → all pages should update
   - Refresh page → theme should persist
   - System preference should be respected on first load

3. **Notifications:**
   - Like a jam → owner receives notification
   - Comment on jam → owner receives notification
   - Add collaborator → they receive notification
   - Real-time update → notification appears without refresh

---

## 🚀 **Quick Start Guide**

**To implement privacy:**
1. Update create-jam form with checkbox
2. Add validation in backend controller
3. Update feed query to filter private jams

**To implement dark mode:**
1. Create theme store
2. Add CSS variables
3. Add toggle button to header

**To implement notifications:**
1. Create Notification model
2. Add notification routes
3. Trigger notifications in controllers
4. Build UI component

---

**Ready to implement? Pick a feature and let's build it!** 🎵
