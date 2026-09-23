import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Assignment } from '../types';
import AssignmentService from '../services/assignmentService';

interface AssignmentDetailContextType {
  selectedAssignmentId: string | null;
  assignmentDetail: Assignment | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  selectAssignment: (assignmentId: string | null) => Promise<void>;
  refreshSelectedAssignment: () => Promise<void>;
  clearSelection: () => void;
}

const AssignmentDetailContext = createContext<AssignmentDetailContextType | undefined>(undefined);

type ErrorWithResponse = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const normalized = error as ErrorWithResponse;
  return normalized?.response?.data?.message || normalized?.message || fallback;
};

export const AssignmentDetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<Assignment | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (assignmentId: string) => {
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const detail = await AssignmentService.getAssignmentById(assignmentId);
      setAssignmentDetail(detail);
    } catch (error) {
      setDetailError(getErrorMessage(error, 'Failed to load assignment details'));
      setAssignmentDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const selectAssignment = useCallback(
    async (assignmentId: string | null) => {
      setSelectedAssignmentId(assignmentId);
      if (!assignmentId) {
        setAssignmentDetail(null);
        setDetailError(null);
        return;
      }

      await fetchDetail(assignmentId);
    },
    [fetchDetail]
  );

  const refreshSelectedAssignment = useCallback(async () => {
    if (!selectedAssignmentId) return;
    await fetchDetail(selectedAssignmentId);
  }, [fetchDetail, selectedAssignmentId]);

  const clearSelection = useCallback(() => {
    setSelectedAssignmentId(null);
    setAssignmentDetail(null);
    setDetailError(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedAssignmentId,
      assignmentDetail,
      isLoadingDetail,
      detailError,
      selectAssignment,
      refreshSelectedAssignment,
      clearSelection,
    }),
    [
      selectedAssignmentId,
      assignmentDetail,
      isLoadingDetail,
      detailError,
      selectAssignment,
      refreshSelectedAssignment,
      clearSelection,
    ]
  );

  return <AssignmentDetailContext.Provider value={value}>{children}</AssignmentDetailContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAssignmentDetail = (): AssignmentDetailContextType => {
  const context = useContext(AssignmentDetailContext);
  if (context === undefined) {
    throw new Error('useAssignmentDetail must be used within an AssignmentDetailProvider');
  }
  return context;
};
