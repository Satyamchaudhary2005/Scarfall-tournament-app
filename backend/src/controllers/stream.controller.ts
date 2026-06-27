import { Request, Response } from 'express';
import { getIO } from '../services/socket';

let latestScenes: any = null;
let sceneVersion = 0;

export const saveScenesToMemory = (scenes: any) => {
  sceneVersion++;
  latestScenes = { scenes, version: sceneVersion, updatedAt: Date.now() };
};

export const getScenesVersion = () => sceneVersion;

export const saveScenes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scenes } = req.body;
    if (!scenes) { res.status(400).json({ error: 'scenes required' }); return; }
    saveScenesToMemory(scenes);
    try {
      getIO().emit('stream:state-update', { scenes, version: sceneVersion });
    } catch {}
    res.json({ version: sceneVersion });
  } catch (error) {
    console.error('Save scenes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getScenes = async (_req: Request, res: Response): Promise<void> => {
  res.json(latestScenes || { scenes: null, version: 0, updatedAt: 0 });
};
