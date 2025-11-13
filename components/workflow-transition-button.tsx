'use client';

import { useState } from 'react';
import { WorkflowStage } from '@/types/spec';
import { UserRole } from '@/types/auth';
import { getValidTransitions } from '@/lib/permissions';

interface WorkflowTransitionButtonProps {
  specId: string;
  currentStage: WorkflowStage;
  userRole: UserRole;
  onTransition: (newStage: WorkflowStage) => Promise<void>;
  className?: string;
}

export function WorkflowTransitionButton({
  specId,
  currentStage,
  userRole,
  onTransition,
  className = '',
}: WorkflowTransitionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const validTransitions = getValidTransitions(userRole, currentStage);

  if (validTransitions.length === 0) {
    return null;
  }

  const handleTransitionClick = (stage: WorkflowStage) => {
    setSelectedStage(stage);
    setShowConfirmation(true);
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedStage) return;

    setIsTransitioning(true);
    try {
      await onTransition(selectedStage);
      setShowConfirmation(false);
      setSelectedStage(null);
    } catch (error) {
      console.error('Transition failed:', error);
      alert('Failed to transition workflow stage. Please try again.');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStage(null);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Transition Stage
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="py-1">
                {validTransitions.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => handleTransitionClick(stage)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Move to {stage}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {showConfirmation && selectedStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Stage Transition
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to transition this spec from{' '}
              <span className="font-semibold">{currentStage}</span> to{' '}
              <span className="font-semibold">{selectedStage}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isTransitioning}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isTransitioning}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isTransitioning ? 'Transitioning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
