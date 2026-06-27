import { Request, Response } from 'express';
import { emitReaction } from '../services/socket';

interface ReactionEvent {
  type: string;
  triggeredBy?: string;
  timestamp: number;
}

let latestReaction: ReactionEvent | null = null;

export const triggerReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.body;
    const validTypes = ['confetti', 'fireworks', 'hearts', 'stars', 'emoji_rain'];

    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `Invalid reaction type. Use: ${validTypes.join(', ')}` });
      return;
    }

    const reaction: ReactionEvent = { type, triggeredBy: req.user?.username, timestamp: Date.now() };
    latestReaction = reaction;

    try {
      emitReaction(reaction);
    } catch {
      // Socket may not be initialized
    }

    res.json({ message: `Reaction "${type}" triggered successfully` });
  } catch (error) {
    console.error('Trigger reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLatestReaction = async (_req: Request, res: Response): Promise<void> => {
  res.json({ reaction: latestReaction });
};
