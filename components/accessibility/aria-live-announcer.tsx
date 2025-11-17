'use client';

import React, { useEffect, useRef } from 'react';

interface AriaLiveAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * ARIA Live Region Announcer
 * Announces messages to screen readers without visual display
 */
export function AriaLiveAnnouncer({ 
  message, 
  priority = 'polite', 
  clearAfter = 3000 
}: AriaLiveAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear any existing timeout
      const timeoutId = setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, clearAfter);

      return () => clearTimeout(timeoutId);
    }
  }, [message, clearAfter]);

  if (!message) return null;

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {message}
    </div>
  );
}

/**
 * Global ARIA Live Region Provider
 * Provides a centralized way to announce messages
 */
export function GlobalAriaLiveRegion() {
  return (
    <>
      {/* Polite announcements */}
      <div
        id="aria-live-polite"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      
      {/* Assertive announcements */}
      <div
        id="aria-live-assertive"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </>
  );
}

/**
 * Utility function to announce messages globally
 */
export function announceToScreenReader(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
) {
  const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
  const region = document.getElementById(regionId);
  
  if (region) {
    // Clear first to ensure the message is announced even if it's the same
    region.textContent = '';
    
    // Use setTimeout to ensure the clear happens before the new message
    setTimeout(() => {
      region.textContent = message;
      
      // Clear after a delay
      setTimeout(() => {
        region.textContent = '';
      }, 3000);
    }, 100);
  }
}