import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { TicketPriority } from '@prisma/client';

export interface TicketTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  title?: string;
  content?: string;
  priority: TicketPriority;
  isGlobal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  title?: string;
  content?: string;
  priority?: TicketPriority;
  isGlobal?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  title?: string;
  content?: string;
  priority?: TicketPriority;
  isGlobal?: boolean;
}

export function useTemplates(category?: string) {
  const params = category ? { category } : undefined;
  
  const { data, error, isLoading, mutate } = useSWR(
    ['/api/templates', params],
    ([url, params]) => apiClient.get(url, params)
  );

  return {
    templates: (data?.data || []) as TicketTemplate[],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useTemplate(templateId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    templateId ? `/api/templates/${templateId}` : null,
    apiClient.get
  );

  return {
    template: data?.data as TicketTemplate | undefined,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useTemplateMutations() {
  const createTemplate = async (data: CreateTemplateData): Promise<TicketTemplate> => {
    const response = await apiClient.post('/api/templates', data);
    return response.data;
  };

  const updateTemplate = async (id: string, data: UpdateTemplateData): Promise<TicketTemplate> => {
    const response = await apiClient.put(`/api/templates/${id}`, data);
    return response.data;
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/templates/${id}`);
  };

  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}