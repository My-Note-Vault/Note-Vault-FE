import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNoteDetail, createNote, updateNote, deleteNote } from "@/api/notes";
import type { CreateNoteRequest, UpdateNoteRequest } from "@/types/note";
import { invalidateSidebar } from "./useDocuments";

export const noteKeys = {
  all: ["notes"] as const,
  details: () => [...noteKeys.all, "detail"] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
};

export const useNoteDetail = (id: string | null) => {
  return useQuery({
    queryKey: noteKeys.detail(id!),
    queryFn: () => fetchNoteDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateNoteRequest) => createNote(req),
    onSuccess: () => {
      invalidateSidebar(queryClient);
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateNoteRequest & { id: string }) => updateNote(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      if (variables.name) {
        invalidateSidebar(queryClient);
      }
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: (_data, id) => {
      invalidateSidebar(queryClient);
      queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
    },
  });
};
