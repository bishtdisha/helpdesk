'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyboardNavigationAudit } from './keyboard-navigation-audit';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Keyboard, 
  MousePointer, 
  Volume2,
  Contrast,
  Zap
} from 'lucide-react';

interface AccessibilityTestResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
}

/**
 * Comprehensive accessibility testing page
 * Tests WCAG 2.1 AA compliance across multiple categories
 */
export function AccessibilityTestPage() {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Run comprehensive accessibility tests
   */
  const runAccessibilityTests = async () => {
    setIsRunning(true);
    const results: AccessibilityTestResult[] = [];

    // Test 1: Keyboard Navigation
    results.push(...await testKeyboardNavigation());
    
    // Test 2: ARIA Labels and Roles
    results.push(...await testAriaLabels());
    
    // Test 3: Color Contrast
    results.push(...await testColorContrast());
    
    // Test 4: Focus Management
    results.push(...await testFocusManagement());
    
    // Test 5: Screen Reader Support
    results.push(...await testScreenReaderSupport());
    
    // Test 6: Semantic HTML
    results.push(...await testSemanticHTML());

    setTestResults(results);
    setIsRunning(false);
  };

  /**
   * Test keyboard navigation
   */
  const testKeyboardNavigation = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    results.push({
      category: 'Keyboard Navigation',
      test: 'Skip Links',
      status: skipLinks.length > 0 ? 'pass' : 'fail',
      description: `Found ${skipLinks.length} skip links`,
      recommendation: skipLinks.length === 0 ? 'Add skip links for main content areas' : undefined
    });

    // Check for keyboard event handlers on interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');
    let keyboardAccessible = 0;
    
    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== '-1') {
        keyboardAccessible++;
      }
    });

    results.push({
      category: 'Keyboard Navigation',
      test: 'Interactive Elements',
      status: keyboardAccessible === interactiveElements.length ? 'pass' : 'warning',
      description: `${keyboardAccessible}/${interactiveElements.length} interactive elements are keyboard accessible`,
      recommendation: keyboardAccessible < interactiveElements.length ? 'Ensure all interactive elements are keyboard accessible' : undefined
    });

    return results;
  };

  /**
   * Test ARIA labels and roles
   */
  const testAriaLabels = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // Check for ARIA landmarks
    const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], main, nav, header, footer, aside');
    results.push({
      category: 'ARIA Labels',
      test: 'Landmark Roles',
      status: landmarks.length >= 3 ? 'pass' : 'warning',
      description: `Found ${landmarks.length} landmark elements`,
      recommendation: landmarks.length < 3 ? 'Add more semantic landmarks (main, nav, header, footer)' : undefined
    });

    // Check for ARIA live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    results.push({
      category: 'ARIA Labels',
      test: 'Live Regions',
      status: liveRegions.length > 0 ? 'pass' : 'warning',
      description: `Found ${liveRegions.length} ARIA live regions`,
      recommendation: liveRegions.length === 0 ? 'Add ARIA live regions for dynamic content updates' : undefined
    });

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button');
    let buttonsWithLabels = 0;
    
    buttons.forEach(button => {
      const hasLabel = button.textContent?.trim() || 
                     button.getAttribute('aria-label') || 
                     button.getAttribute('aria-labelledby') ||
                     button.getAttribute('title');
      if (hasLabel) buttonsWithLabels++;
    });

    results.push({
      category: 'ARIA Labels',
      test: 'Button Labels',
      status: buttonsWithLabels === buttons.length ? 'pass' : 'fail',
      description: `${buttonsWithLabels}/${buttons.length} buttons have accessible names`,
      recommendation: buttonsWithLabels < buttons.length ? 'Add aria-label or text content to all buttons' : undefined
    });

    return results;
  };

  /**
   * Test color contrast (simplified check)
   */
  const testColorContrast = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // This is a simplified test - in practice, you'd use a proper contrast checking library
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a');
    let contrastIssues = 0;
    
    // Check for common low-contrast patterns
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple check for gray text on white background (common low contrast issue)
      if (color.includes('rgb(128, 128, 128)') || color.includes('#808080')) {
        contrastIssues++;
      }
    });

    results.push({
      category: 'Color Contrast',
      test: 'Text Contrast',
      status: contrastIssues === 0 ? 'pass' : 'warning',
      description: `Found ${contrastIssues} potential contrast issues`,
      recommendation: contrastIssues > 0 ? 'Review color contrast ratios (minimum 4.5:1 for normal text)' : undefined
    });

    return results;
  };

  /**
   * Test focus management
   */
  const testFocusManagement = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // Check for visible focus indicators
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    let elementsWithFocusStyles = 0;
    
    focusableElements.forEach(element => {
      const styles = window.getComputedStyle(element, ':focus');
      const hasOutline = styles.outline !== 'none';
      const hasBoxShadow = styles.boxShadow !== 'none';
      const hasFocusClass = element.classList.toString().includes('focus');
      
      if (hasOutline || hasBoxShadow || hasFocusClass) {
        elementsWithFocusStyles++;
      }
    });

    results.push({
      category: 'Focus Management',
      test: 'Focus Indicators',
      status: elementsWithFocusStyles > focusableElements.length * 0.8 ? 'pass' : 'warning',
      description: `${elementsWithFocusStyles}/${focusableElements.length} focusable elements have visible focus indicators`,
      recommendation: elementsWithFocusStyles < focusableElements.length * 0.8 ? 'Ensure all focusable elements have visible focus indicators' : undefined
    });

    return results;
  };

  /**
   * Test screen reader support
   */
  const testScreenReaderSupport = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // Check for screen reader only content
    const srOnlyElements = document.querySelectorAll('.sr-only, .visually-hidden');
    results.push({
      category: 'Screen Reader',
      test: 'Screen Reader Content',
      status: srOnlyElements.length > 0 ? 'pass' : 'warning',
      description: `Found ${srOnlyElements.length} screen reader only elements`,
      recommendation: srOnlyElements.length === 0 ? 'Add screen reader only content for better context' : undefined
    });

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    let imagesWithAlt = 0;
    
    images.forEach(img => {
      if (img.hasAttribute('alt')) imagesWithAlt++;
    });

    results.push({
      category: 'Screen Reader',
      test: 'Image Alt Text',
      status: imagesWithAlt === images.length ? 'pass' : 'fail',
      description: `${imagesWithAlt}/${images.length} images have alt text`,
      recommendation: imagesWithAlt < images.length ? 'Add alt text to all images' : undefined
    });

    return results;
  };

  /**
   * Test semantic HTML
   */
  const testSemanticHTML = async (): Promise<AccessibilityTestResult[]> => {
    const results: AccessibilityTestResult[] = [];
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const hasH1 = document.querySelector('h1') !== null;
    
    results.push({
      category: 'Semantic HTML',
      test: 'Heading Structure',
      status: hasH1 && headings.length > 0 ? 'pass' : 'warning',
      description: `Found ${headings.length} headings, H1 present: ${hasH1}`,
      recommendation: !hasH1 ? 'Ensure page has an H1 heading' : undefined
    });

    // Check for form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    let inputsWithLabels = 0;
    
    inputs.forEach(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                      input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby');
      if (hasLabel) inputsWithLabels++;
    });

    results.push({
      category: 'Semantic HTML',
      test: 'Form Labels',
      status: inputs.length === 0 || inputsWithLabels === inputs.length ? 'pass' : 'fail',
      description: `${inputsWithLabels}/${inputs.length} form inputs have labels`,
      recommendation: inputsWithLabels < inputs.length ? 'Associate all form inputs with labels' : undefined
    });

    return results;
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'fail':
        return 'destructive';
      case 'warning':
        return 'secondary';
    }
  };

  const groupedResults = testResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, AccessibilityTestResult[]>);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.status === 'pass').length;
  const failedTests = testResults.filter(r => r.status === 'fail').length;
  const warningTests = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility Testing Suite
          </CardTitle>
          <CardDescription>
            Comprehensive WCAG 2.1 AA compliance testing for the ticket system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={runAccessibilityTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Accessibility Tests'}
            </Button>
          </div>

          {totalTests > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{warningTests}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keyboard">Keyboard Navigation</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {totalTests > 0 && (
            <div className="grid gap-4">
              {Object.entries(groupedResults).map(([category, results]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">{result.test}</span>
                          </div>
                          <Badge variant={getStatusColor(result.status) as any}>
                            {result.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keyboard" className="space-y-4">
          <KeyboardNavigationAudit />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {totalTests > 0 ? (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.test}</div>
                          <div className="text-xs text-muted-foreground">{result.category}</div>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(result.status) as any}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.description}
                    </p>
                    {result.recommendation && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommendation:</strong> {result.recommendation}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Run the accessibility tests to see detailed results
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}