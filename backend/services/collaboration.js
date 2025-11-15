const WebSocket = require('ws');

class CollaborationService {
  constructor() {
    this.wss = null;
    this.jamRooms = new Map(); // Map of jamId -> Set of client connections
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/collaboration' });

    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection established');

      ws.jamId = null;
      ws.userId = null;
      ws.userName = null;
      ws.isAlive = true;

      // Handle pong responses for keep-alive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.handleUserLeave(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    // Keep-alive ping interval (every 30 seconds)
    const keepAliveInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(keepAliveInterval);
    });

    console.log('✅ WebSocket collaboration service initialized');
  }

  handleMessage(ws, data) {
    const { type } = data;

    switch (type) {
      case 'join_jam':
        this.handleJoinJam(ws, data);
        break;
      case 'cursor_move':
        this.handleCursorMove(ws, data);
        break;
      case 'track_update':
        this.handleTrackUpdate(ws, data);
        break;
      case 'playback_sync':
        this.handlePlaybackSync(ws, data);
        break;
      default:
        console.warn('⚠️ Unknown message type:', type);
    }
  }

  handleJoinJam(ws, data) {
    const { jamId, userId, userName } = data;

    // Leave previous jam if any
    if (ws.jamId) {
      this.handleUserLeave(ws);
    }

    // Join new jam
    ws.jamId = jamId;
    ws.userId = userId;
    ws.userName = userName;

    if (!this.jamRooms.has(jamId)) {
      this.jamRooms.set(jamId, new Set());
    }

    this.jamRooms.get(jamId).add(ws);

    console.log(`👤 ${userName} joined jam ${jamId}`);

    // Notify other users in the jam
    this.broadcastToJam(
      jamId,
      {
        type: 'user_joined',
        userId,
        userName,
        timestamp: Date.now(),
      },
      ws
    );

    // Send current users list to the new joiner
    const currentUsers = Array.from(this.jamRooms.get(jamId))
      .filter((client) => client !== ws && client.userId)
      .map((client) => ({
        userId: client.userId,
        userName: client.userName,
      }));

    ws.send(
      JSON.stringify({
        type: 'room_state',
        users: currentUsers,
        timestamp: Date.now(),
      })
    );
  }

  handleCursorMove(ws, data) {
    const { jamId, userId, userName, x, y, timestamp } = data;

    if (!ws.jamId || ws.jamId !== jamId) {
      return;
    }

    // Broadcast cursor position to other users in the jam
    this.broadcastToJam(
      jamId,
      {
        type: 'cursor_move',
        userId,
        userName,
        x,
        y,
        timestamp,
      },
      ws
    );
  }

  handleTrackUpdate(ws, data) {
    const { jamId, trackId, updates } = data;

    if (!ws.jamId || ws.jamId !== jamId) {
      return;
    }

    // Broadcast track updates (mute, solo, volume, etc.) to other users
    this.broadcastToJam(
      jamId,
      {
        type: 'track_update',
        trackId,
        updates,
        userId: ws.userId,
        timestamp: Date.now(),
      },
      ws
    );
  }

  handlePlaybackSync(ws, data) {
    const { jamId, isPlaying, currentTime } = data;

    if (!ws.jamId || ws.jamId !== jamId) {
      return;
    }

    // Broadcast playback state to other users
    this.broadcastToJam(
      jamId,
      {
        type: 'playback_sync',
        isPlaying,
        currentTime,
        userId: ws.userId,
        timestamp: Date.now(),
      },
      ws
    );
  }

  handleUserLeave(ws) {
    if (!ws.jamId) return;

    const jamId = ws.jamId;
    const userId = ws.userId;
    const userName = ws.userName;

    // Remove from jam room
    if (this.jamRooms.has(jamId)) {
      this.jamRooms.get(jamId).delete(ws);

      // Clean up empty rooms
      if (this.jamRooms.get(jamId).size === 0) {
        this.jamRooms.delete(jamId);
      }

      // Notify other users
      this.broadcastToJam(jamId, {
        type: 'user_left',
        userId,
        userName,
        timestamp: Date.now(),
      });

      console.log(`👤 ${userName} left jam ${jamId}`);
    }

    ws.jamId = null;
    ws.userId = null;
    ws.userName = null;
  }

  broadcastToJam(jamId, message, excludeClient = null) {
    if (!this.jamRooms.has(jamId)) return;

    const messageStr = JSON.stringify(message);

    this.jamRooms.get(jamId).forEach((client) => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  getActiveUsers(jamId) {
    if (!this.jamRooms.has(jamId)) return [];

    return Array.from(this.jamRooms.get(jamId))
      .filter((client) => client.userId)
      .map((client) => ({
        userId: client.userId,
        userName: client.userName,
      }));
  }
}

module.exports = new CollaborationService();
