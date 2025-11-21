'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Spec, SpecMetadata } from '@/types/spec';

const API_BASE = '/api';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  console.log('[API] Auth token:', token ? `${token.substring(0, 20)}...` : 'MISSING');
  if (!token) {
    console.warn('[API] No auth token found in localStorage');
  }
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  console.log('[API] Headers:', headers);
  return headers;
}

// Query keys
export const specKeys = {
  all: ['specs'] as const,
  lists: () => [...specKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...specKeys.lists(), filters] as const,
  details: () => [...specKeys.all, 'detail'] as const,
  detail: (id: string) => [...specKeys.details(), id] as const,
  revisions: (id: string) => [...specKeys.detail(id), 'revisions'] as const,
  comments: (id: string) => [...specKeys.detail(id), 'comments'] as const,
};

// Fetch spec by ID
export function useSpec(id: string) {
  return useQuery({
    queryKey: specKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/specs/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch spec');
      return res.json() as Promise<{ spec: Spec; permissions: any }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch spec list
export function useSpecs(filters?: Record<string, any>) {
  return useQuery({
    queryKey: specKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_BASE}/specs?${params}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch specs');
      return res.json() as Promise<{ specs: Spec[] }>;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Update spec mutation
export function useUpdateSpec(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; metadata: SpecMetadata }) => {
      const res = await fetch(`${API_BASE}/specs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update spec');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: specKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: specKeys.lists() });
    },
  });
}

// Create spec mutation
export function useCreateSpec() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      templateId?: string;
      title: string;
      type: SpecMetadata['type'];
      parentId?: string;
    }) => {
      const res = await fetch(`${API_BASE}/specs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create spec');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specKeys.lists() });
    },
  });
}

// Fetch revisions
export function useRevisions(specId: string) {
  return useQuery({
    queryKey: specKeys.revisions(specId),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/specs/${specId}/revisions`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch revisions');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - revisions don't change often
  });
}

// Fetch comments
export function useComments(specId: string) {
  return useQuery({
    queryKey: specKeys.comments(specId),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/specs/${specId}/comments`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds - comments are more dynamic
  });
}
