import { Router } from 'express';
import {
  getClans,
  getClan,
  createClan,
  joinClan,
  leaveClan,
  updateClan,
  deleteClan,
  transferLeadership,
  kickMember,
  getClanLeaderboard,
  getClanActivityLogs,
  searchUsers,
  sendInvite,
  getMyInvites,
  getClanInvites,
  acceptInvite,
  declineInvite,
  cancelInvite,
  applyToJoin,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../controllers/clan.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getClans);
router.get('/leaderboard', getClanLeaderboard);
router.get('/invites', authenticate, getMyInvites);
router.get('/search-users', authenticate, searchUsers);
router.get('/:id', getClan);
router.post('/', authenticate, createClan);
router.post('/:id/join', authenticate, joinClan);
router.post('/:id/leave', authenticate, leaveClan);
router.post('/:id/invite', authenticate, sendInvite);
router.get('/:id/invites', authenticate, getClanInvites);
router.patch('/:id', authenticate, updateClan);
router.delete('/:id', authenticate, deleteClan);
router.get('/:id/activity-logs', getClanActivityLogs);
router.delete('/:clanId/members/:userId', authenticate, kickMember);
router.post('/:id/transfer-leadership', authenticate, transferLeadership);
router.patch('/invites/:inviteId/accept', authenticate, acceptInvite);
router.patch('/invites/:inviteId/decline', authenticate, declineInvite);
router.delete('/invites/:inviteId', authenticate, cancelInvite);

// Join Request Routes
router.post('/:id/apply', authenticate, applyToJoin);
router.get('/:id/join-requests', authenticate, getJoinRequests);
router.post('/join-requests/:requestId/approve', authenticate, approveJoinRequest);
router.post('/join-requests/:requestId/reject', authenticate, rejectJoinRequest);

export default router;
