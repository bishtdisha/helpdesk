'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Keyboard, Eye } from 'lucide-react';

interface KeyboardAuditResult {
  element: string;
  selector: string;
  issues: string[];
  passed: boolean;
  tabIndex?: number;
  hasAriaLabel?: boolean;
  hasVisibleFocus?: boolean;
}

/**
 * Keyboard navigation audit component
 * Tests and reports on keyboard accessibility issues
 */
export function KeyboardNavigationAudit() {
  const [auditResults, setAuditResults] = useState<KeyboardAuditResult[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentFocusedElement, setCurrentFocusedElement] = useState<string>('');

  /**
   * Audit keyboard navigation for all interactive elements
   */
  const runKeyboardAudit = () => {
    setIsAuditing(true);
    const results: KeyboardAuditResult[] = [];

    // Get all potentially interactive elements
    const selectors = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="checkbox"]',
      '[role="radio"]'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element, index) => {
        const issues: string[] = [];
        let passed = true;

        // Check if element is focusable
        const tabIndex = element.getAttribute('tabindex');
        const computedTabIndex = parseInt(tabIndex || '0');
        
        // Check for proper tab index
        if (computedTabIndex < -1) {
          issues.push('Invalid tabindex value (should be -1, 0, or positive)');
          passed = false;
        }

        // Check for ARIA labels on buttons without text
        const hasAriaLabel = element.hasAttribute('aria-label') || 
                           element.hasAttribute('aria-labelledby') ||
                           element.hasAttribute('title');
        
        const hasVisibleText = element.textContent?.trim() || 
                              element.querySelector('img')?.getAttribute('alt') ||
                              element.querySelector('[aria-label]');

        if (!hasVisibleText && !hasAriaLabel) {
          issues.push('Interactive element lacks accessible name (aria-label, text content, or alt text)');
          passed = false;
        }

        // Check for visible focus indicator
        const styles = window.getComputedStyle(element);
        const focusStyles = window.getComputedStyle(element, ':focus');
        
        // This is a simplified check - in practice, focus indicators are complex
        const hasVisibleFocus = focusStyles.outline !== 'none' || 
                               focusStyles.boxShadow !== 'none' ||
                               element.classList.contains('focus:ring') ||
                               element.classList.contains('focus-visible:ring');

        if (!hasVisibleFocus) {
          issues.push('Element may lack visible focus indicator');
          passed = false;
        }

        // Check for keyboard event handlers on non-standard interactive elements
        if (element.tagName !== 'BUTTON' && element.tagName !== 'A' && element.tagName !== 'INPUT') {
          const hasKeyboardHandler = element.hasAttribute('onkeydown') || 
                                   element.hasAttribute('onkeypress') ||
                                   element.hasAttribute('onkeyup');
          
          if (!hasKeyboardHandler && element.getAttribute('role') === 'button') {
            issues.push('Custom interactive element may lack keyboard event handlers');
            passed = false;
          }
        }

        results.push({
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ')[0]}` : ''}`,
          selector: `${selector}[${index}]`,
          issues,
          passed,
          tabIndex: computedTabIndex,
          hasAriaLabel,
          hasVisibleFocus
        });
      });
    });

    setAuditResults(results);
    setIsAuditing(false);
  };

  /**
   * Test tab order by programmatically focusing elements
   */
  const testTabOrder = () => {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    let currentIndex = 0;
    const focusNext = () => {
      if (currentIndex < focusableElements.length) {
        const element = focusableElements[currentIndex] as HTMLElement;
        element.focus();
        setCurrentFocusedElement(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''} (${currentIndex + 1}/${focusableElements.length})`);
        currentIndex++;
        setTimeout(focusNext, 1000);
      } else {
        setCurrentFocusedElement('Tab order test complete');
      }
    };

    focusNext();
  };

  /**
   * Check for keyboard traps
   */
  const checkKeyboardTraps = () => {
    // This would require more complex implementation
    // For now, just show a message
    alert('Keyboard trap detection requires manual testing. Try tabbing through the interface and ensure you can always escape from any focused area using Tab, Shift+Tab, or Escape.');
  };

  useEffect(() => {
    // Run initial audit
    runKeyboardAudit();
  }, []);

  const passedCount = auditResults.filter(r => r.passed).length;
  const failedCount = auditResults.length - passedCount;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Navigation Audit
          </CardTitle>
          <CardDescription>
            Automated accessibility audit for keyboard navigation and focus management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runKeyboardAudit} disabled={isAuditing}>
              {isAuditing ? 'Auditing...' : 'Run Audit'}
            </Button>
            <Button variant="outline" onClick={testTabOrder}>
              Test Tab Order
            </Button>
            <Button variant="outline" onClick={checkKeyboardTraps}>
              Check Keyboard Traps
            </Button>
          </div>

          {currentFocusedElement && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Currently focused: {currentFocusedElement}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Passed: {passedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm">Failed: {failedCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {auditResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Results</CardTitle>
            <CardDescription>
              Detailed results for each interactive element
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {result.element}
                      </code>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Tab: {result.tabIndex}</span>
                      <span>ARIA: {result.hasAriaLabel ? '✓' : '✗'}</span>
                      <span>Focus: {result.hasVisibleFocus ? '✓' : '✗'}</span>
                    </div>
                  </div>
                  
                  {result.issues.length > 0 && (
                    <div className="space-y-1">
                      {result.issues.map((issue, issueIndex) => (
                        <div key={issueIndex} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}