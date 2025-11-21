# 📝 Typography Quick Reference

## Font Sizes & Usage

### Headings
```tsx
// Display - Hero sections, landing pages
<h1 className="text-display">Welcome to Helpdesk</h1>

// H1 - Page titles
<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>

// H2 - Section titles
<h2 className="text-3xl font-semibold tracking-tight">Recent Tickets</h2>

// H3 - Subsection titles
<h3 className="text-2xl font-semibold tracking-tight">Team Performance</h3>

// H4 - Card titles
<h4 className="text-xl font-semibold">Ticket Details</h4>

// H5 - Small headings
<h5 className="text-lg font-semibold">Comments</h5>

// H6 - Tiny headings
<h6 className="text-base font-semibold">Metadata</h6>
```

### Body Text
```tsx
// Large body - Important content, introductions
<p className="text-body-lg">
  This is important introductory text that needs emphasis.
</p>

// Regular body - Standard content
<p className="text-body">
  This is the standard body text used throughout the application.
</p>

// Small body - Secondary information
<p className="text-body-sm">
  Additional details or secondary information.
</p>

// Caption - Labels, timestamps, metadata
<span className="text-caption">
  Created 2 hours ago
</span>
```

## Color Classes

### Text Colors
```tsx
// Primary text (default)
<p className="text-foreground">Main text</p>

// Muted text (secondary)
<p className="text-muted-foreground">Secondary text</p>

// Primary color
<span className="text-primary">Important link</span>

// Success
<span className="text-success">Completed</span>

// Warning
<span className="text-warning">Pending</span>

// Destructive
<span className="text-destructive">Error</span>
```

### Background Colors
```tsx
// Card background
<div className="bg-card text-card-foreground">Card content</div>

// Muted background
<div className="bg-muted text-muted-foreground">Subtle section</div>

// Primary background
<div className="bg-primary text-primary-foreground">Primary button</div>

// Success background
<div className="bg-success text-success-foreground">Success message</div>

// Warning background
<div className="bg-warning text-warning-foreground">Warning message</div>

// Destructive background
<div className="bg-destructive text-destructive-foreground">Error message</div>
```

## Common Patterns

### Page Header
```tsx
<header className="mb-8">
  <h1 className="text-4xl font-bold tracking-tight mb-2">
    Page Title
  </h1>
  <p className="text-body text-muted-foreground">
    Page description or subtitle
  </p>
</header>
```

### Card with Title
```tsx
<div className="card-modern p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p className="text-body text-muted-foreground mb-4">
    Card description or content
  </p>
  <div className="flex gap-2">
    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg btn-text">
      Primary Action
    </button>
  </div>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success">
  <CheckCircle className="h-4 w-4" />
  Completed
</span>
```

### Form Label
```tsx
<label className="text-sm font-medium text-foreground mb-1.5 block">
  Email Address
</label>
<input 
  type="email" 
  className="input-modern w-full px-3 py-2 rounded-lg"
  placeholder="you@example.com"
/>
```

### List Item
```tsx
<div className="flex items-start gap-3 p-4 hover:bg-muted/50 rounded-lg transition-colors">
  <div className="flex-1">
    <h4 className="text-base font-semibold mb-1">Item Title</h4>
    <p className="text-body-sm text-muted-foreground">
      Item description or details
    </p>
    <span className="text-caption">2 hours ago</span>
  </div>
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
    <Icon className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-xl font-semibold mb-2">No items found</h3>
  <p className="text-body text-muted-foreground max-w-sm">
    Get started by creating your first item
  </p>
</div>
```

## Font Weights

```tsx
// Bold - Headings, strong emphasis
<span className="font-bold">Bold text</span>

// Semibold - Subheadings, labels
<span className="font-semibold">Semibold text</span>

// Medium - Buttons, navigation
<span className="font-medium">Medium text</span>

// Regular - Body text (default)
<span className="font-normal">Regular text</span>
```

## Line Heights

```tsx
// Tight - Headings
<h1 className="leading-tight">Tight line height</h1>

// Normal - Small text
<p className="leading-normal">Normal line height</p>

// Relaxed - Body text (default for text-body)
<p className="leading-relaxed">Relaxed line height</p>

// Loose - Large text blocks
<p className="leading-loose">Loose line height</p>
```

## Tracking (Letter Spacing)

```tsx
// Tight - Headings (default for h1-h3)
<h1 className="tracking-tight">Tight tracking</h1>

// Normal - Body text (default)
<p className="tracking-normal">Normal tracking</p>

// Wide - Uppercase labels
<span className="tracking-wide uppercase">Wide tracking</span>
```

## Responsive Typography

```tsx
// Scales automatically on larger screens
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg">
  Responsive body text
</p>
```

## Accessibility Tips

1. **Always maintain contrast ratios**:
   - Use `text-foreground` for main text
   - Use `text-muted-foreground` for secondary text
   - Avoid light text on light backgrounds

2. **Use semantic HTML**:
   - Use `<h1>` to `<h6>` for headings
   - Use `<p>` for paragraphs
   - Use `<strong>` for emphasis

3. **Ensure readable font sizes**:
   - Minimum 14px (text-sm) for body text
   - Minimum 16px (text-base) for primary content
   - Larger sizes for headings

4. **Provide sufficient line height**:
   - 1.5 minimum for body text
   - 1.2-1.4 for headings

## Migration Examples

### Before (Old Style)
```tsx
<div className="bg-blue-500 text-white p-4 rounded">
  <h2 className="text-2xl font-bold mb-2">Title</h2>
  <p className="text-sm">Description text</p>
</div>
```

### After (New Style)
```tsx
<div className="bg-primary text-primary-foreground p-6 rounded-xl">
  <h2 className="text-3xl font-semibold tracking-tight mb-3">Title</h2>
  <p className="text-body">Description text</p>
</div>
```
