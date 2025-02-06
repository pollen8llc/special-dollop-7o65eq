import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.0.0
import { format } from 'date-fns'; // date-fns@2.30.0
import { VirtualList } from 'react-virtual'; // react-virtual@3.0.0
import { ErrorBoundary } from 'react-error-boundary'; // react-error-boundary@4.0.0

import type { Experience } from '../../types/experience.types';
import ExperienceForm from '../forms/ExperienceForm';
import FadeInAnimation from '../animations/FadeInAnimation';
import { useToast } from '../../hooks/useToast';
import { validateExperienceForm } from '../../utils/validation';

interface ExperienceListProps {
  experiences: Experience[];
  isEditable: boolean;
  onAdd: (data: ExperienceFormData) => Promise<void>;
  onUpdate: (id: string, data: ExperienceFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  prefersReducedMotion: boolean;
}

export const ExperienceList: React.FC<ExperienceListProps> = ({
  experiences,
  isEditable,
  onAdd,
  onUpdate,
  onDelete,
  prefersReducedMotion,
}) => {
  // State management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Sort experiences by date in descending order
  const sortedExperiences = useMemo(() => {
    return [...experiences].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [experiences]);

  // Virtual list configuration for performance
  const rowVirtualizer = VirtualList({
    size: sortedExperiences.length,
    overscan: 5,
  });

  // Animation variants with reduced motion support
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  // Experience form submission handler
  const handleExperienceSubmit = useCallback(async (
    data: ExperienceFormData,
    experienceId: string | null = null
  ) => {
    try {
      setIsSubmitting(true);

      const validationResult = validateExperienceForm(data);
      if (!validationResult.success) {
        showToast('ERROR', 'Please check the form for errors');
        return;
      }

      if (experienceId) {
        await onUpdate(experienceId, data);
        showToast('SUCCESS', 'Experience updated successfully');
      } else {
        await onAdd(data);
        showToast('SUCCESS', 'Experience added successfully');
      }

      setEditingId(null);
    } catch (error) {
      showToast('ERROR', 'Failed to save experience');
    } finally {
      setIsSubmitting(false);
    }
  }, [onAdd, onUpdate, showToast]);

  // Delete experience handler with confirmation
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      try {
        await onDelete(id);
        showToast('SUCCESS', 'Experience deleted successfully');
      } catch (error) {
        showToast('ERROR', 'Failed to delete experience');
      }
    }
  }, [onDelete, showToast]);

  return (
    <ErrorBoundary
      fallback={<div className="text-error-500">Error loading experiences</div>}
    >
      <div className="space-y-6" role="region" aria-label="Professional experiences">
        {/* Add Experience Button */}
        {isEditable && !editingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setEditingId('new')}
              className="w-full p-4 border-2 border-dashed border-primary-300 rounded-lg
                       hover:border-primary-500 transition-colors duration-200
                       flex items-center justify-center text-primary-600"
              aria-label="Add new experience"
            >
              <span className="mr-2">+</span>
              Add Experience
            </button>
          </motion.div>
        )}

        {/* Experience Form */}
        <AnimatePresence mode="wait">
          {editingId && (
            <FadeInAnimation>
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <ExperienceForm
                  initialData={editingId === 'new' ? null : 
                    experiences.find(exp => exp.id === editingId) || null}
                  isSubmitting={isSubmitting}
                  onSubmit={(data) => handleExperienceSubmit(data, editingId === 'new' ? null : editingId)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            </FadeInAnimation>
          )}
        </AnimatePresence>

        {/* Experience List */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const experience = sortedExperiences[virtualRow.index];
            return (
              <motion.div
                key={experience.id}
                variants={itemVariants}
                layout
                className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg
                          transition-shadow duration-200"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {experience.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {experience.company}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(experience.startDate), 'MMM yyyy')} - {
                        experience.endDate 
                          ? format(new Date(experience.endDate), 'MMM yyyy')
                          : 'Present'
                      }
                    </p>
                    {experience.description && (
                      <p className="text-foreground mt-2">
                        {experience.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditable && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingId(experience.id)}
                        className="text-primary-500 hover:text-primary-600
                                 transition-colors duration-200"
                        aria-label={`Edit ${experience.title} experience`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="text-error-500 hover:text-error-600
                                 transition-colors duration-200"
                        aria-label={`Delete ${experience.title} experience`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default ExperienceList;