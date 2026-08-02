import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pusher } from '../services/pusher.service';

export const realtimeRouter = Router();

realtimeRouter.post('/auth', requireAuth, (req, res) => {
  const socketId = req.body.socket_id as string;
  const channelName = req.body.channel_name as string;
  if (!socketId || !channelName) {
    res.status(400).json({ error: 'socket_id та channel_name обов’язкові' });
    return;
  }

  if (channelName.startsWith('private-notifications-')) {
    const ownerId = channelName.replace('private-notifications-', '');
    if (ownerId !== req.user!.sub) {
      res.status(403).json({ error: 'Заборонено' });
      return;
    }
  }

  // Board/shopping/presence channels are namespaced per workspace - reject a request for
  // any workspace other than the caller's own, so one tenant can never snoop on another's realtime events.
  if (channelName.startsWith('private-board-') || channelName.startsWith('private-shopping-') || channelName.startsWith('presence-online-')) {
    const workspaceId = channelName.replace(/^private-board-|^private-shopping-|^presence-online-/, '');
    if (workspaceId !== req.user!.workspaceId) {
      res.status(403).json({ error: 'Заборонено' });
      return;
    }
  }

  if (channelName.startsWith('presence-')) {
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: req.user!.sub,
      user_info: { username: req.user!.username, role: req.user!.role },
    });
    res.json(authResponse);
    return;
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName);
  res.json(authResponse);
});
