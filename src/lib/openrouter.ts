import { AI_CONFIG } from '../config/constants';
import { auth } from './firebase';

export const generateVisualization = async (prompt: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const token = await user.getIdToken();

  const response = await fetch(AI_CONFIG.generateEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.html;
};
