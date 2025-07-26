import { CollectionOptions, CollectionResult } from '../types/link-collector';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:7071/api';

export async function collectLinksAPI(
  url: string,
  selector?: string,
  options?: CollectionOptions
): Promise<CollectionResult> {
  const response = await fetch(`${API_BASE_URL}/collectLinks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      selector,
      options,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}