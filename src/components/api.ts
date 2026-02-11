import { projectId, publicAnonKey } from '../utils/supabase/info';

export const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-dcd239fe`;

// Upload image to Supabase Storage
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

// Save Vision Analysis
export async function saveVision(vision: any): Promise<void> {
  const response = await fetch(`${BASE_URL}/visions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ vision })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Save failed');
}

// List Visions
export async function getVisions(): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/visions`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Fetch failed');
  return data.data || [];
}

// Delete Vision
export async function deleteVision(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/visions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    }
  });

  if (!response.ok) throw new Error('Delete failed');
}
