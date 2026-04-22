import { AI_CONFIG } from '../config/constants';
import { pb } from './pocketbase';

export const generateVisualization = async (
  prompt: string,
  language: string = 'javascript'
): Promise<string> => {
  if (!pb.authStore.isValid || !pb.authStore.token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(AI_CONFIG.generateEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pb.authStore.token}`,
    },
    body: JSON.stringify({ prompt, language }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.html;
};
