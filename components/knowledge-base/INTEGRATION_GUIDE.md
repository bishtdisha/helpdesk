# Knowledge Base Components - Integration Guide

## Quick Start

This guide shows how to integrate the knowledge base components into your application.

## Page Routes Setup

### 1. Knowledge Base List Page

Create `app/dashboard/knowledge-base/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/server-auth"
import { KBArticleList } from "@/components/knowledge-base"
import { redirect } from "next/navigation"

export default async function KnowledgeBasePage() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect("/login")
  }

  return (
    <div className="container py-6">
      <KBArticleList userRole={currentUser.role?.name} />
    </div>
  )
}
```

### 2. Article Detail Page

Create `app/dashboard/knowledge-base/[id]/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/server-auth"
import { KBArticleDetail } from "@/components/knowledge-base"
import { redirect } from "next/navigation"

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect("/login")
  }

  return (
    <div className="container py-6">
      <KBArticleDetail
        articleId={params.id}
        userRole={currentUser.role?.name}
        userId={currentUser.id}
      />
    </div>
  )
}
```

### 3. Create Article Page

Create `app/dashboard/knowledge-base/new/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/server-auth"
import { KBArticleEditor } from "@/components/knowledge-base"
import { redirect } from "next/navigation"

export default async function CreateArticlePage() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect("/login")
  }

  // Check if user can create articles
  const canCreate = 
    currentUser.role?.name === "Admin/Manager" ||
    currentUser.role?.name === "Team Leader"

  if (!canCreate) {
    redirect("/dashboard/knowledge-base")
  }

  return (
    <div className="container py-6">
      <KBArticleEditor userRole={currentUser.role.name} />
    </div>
  )
}
```

### 4. Edit Article Page

Create `app/dashboard/knowledge-base/[id]/edit/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/server-auth"
import { KBArticleEditor } from "@/components/knowledge-base"
import { redirect } from "next/navigation"

export default async function EditArticlePage({
  params,
}: {
  params: { id: string }
}) {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect("/login")
  }

  return (
    <div className="container py-6">
      <KBArticleEditor
        articleId={params.id}
        userRole={currentUser.role?.name}
      />
    </div>
  )
}
```

## Integration with Ticket Creation

Add article suggestions to your ticket creation form:

```tsx
"use client"

import { useState } from "react"
import { ArticleSuggestion } from "@/components/knowledge-base"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export function CreateTicketForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Submit ticket logic
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label>Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter ticket title"
        />
      </div>

      <div>
        <label>Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue"
          rows={6}
        />
      </div>

      {/* Article Suggestions */}
      {(title || description) && (
        <ArticleSuggestion
          ticketContent={`${title} ${description}`}
          onArticleSelect={(id) => {
            console.log("User viewed article:", id)
            // Optionally track that user viewed suggested article
          }}
        />
      )}

      <Button type="submit">Create Ticket</Button>
    </form>
  )
}
```

## Navigation Integration

Add knowledge base link to your navigation:

```tsx
// In your navigation component
import { BookOpen } from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
  {
    title: "Knowledge Base",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
  },
  // ... other items
]
```

## Role-Based Navigation

Show/hide knowledge base features based on user role:

```tsx
import { PermissionGate } from "@/components/rbac"

// In your navigation or page
<PermissionGate
  allowedRoles={["Admin/Manager", "Team Leader"]}
  fallback={null}
>
  <Button onClick={() => router.push("/dashboard/knowledge-base/new")}>
    Create Article
  </Button>
</PermissionGate>
```

## Standalone Usage

You can also use components directly in any page:

```tsx
"use client"

import { KBArticleList } from "@/components/knowledge-base"

export function MyCustomPage() {
  return (
    <div>
      <h1>Help Center</h1>
      <KBArticleList userRole="User/Employee" />
    </div>
  )
}
```

## API Endpoints Required

Ensure these API endpoints are available:

- ✅ `GET /api/knowledge-base/articles`
- ✅ `POST /api/knowledge-base/articles`
- ✅ `GET /api/knowledge-base/articles/:id`
- ✅ `PUT /api/knowledge-base/articles/:id`
- ✅ `DELETE /api/knowledge-base/articles/:id`
- ✅ `POST /api/knowledge-base/articles/:id/view`
- ✅ `POST /api/knowledge-base/articles/:id/helpful`
- ✅ `GET /api/knowledge-base/search`
- ✅ `GET /api/knowledge-base/suggest`
- ✅ `GET /api/knowledge-base/categories`
- ✅ `GET /api/teams`

All these endpoints are already implemented in the codebase.

## Styling Customization

The components use Tailwind CSS and can be customized:

```tsx
// Add custom className
<KBArticleList 
  userRole={userRole}
  className="my-custom-class"
/>

// Or wrap in a custom container
<div className="max-w-7xl mx-auto px-4">
  <KBArticleList userRole={userRole} />
</div>
```

## Error Handling

Components handle errors gracefully:

- **403 Forbidden**: Redirects to knowledge base list
- **404 Not Found**: Shows "Article not found" message
- **500 Server Error**: Shows error message in console
- **Network Errors**: Shows loading state, then error

## Performance Considerations

1. **Lazy Loading**: Consider lazy loading the article editor:
```tsx
import dynamic from "next/dynamic"

const KBArticleEditor = dynamic(
  () => import("@/components/knowledge-base").then(mod => mod.KBArticleEditor),
  { loading: () => <div>Loading editor...</div> }
)
```

2. **Caching**: API responses are cached by Next.js by default

3. **Pagination**: Consider adding pagination for large article lists

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Dark Mode

All components support dark mode out of the box using Tailwind's dark mode classes.

## Mobile Responsive

All components are fully responsive:
- Mobile: Single column layout
- Tablet: Two column layout
- Desktop: Three column layout

## Testing

Example test for article list:

```tsx
import { render, screen } from "@testing-library/react"
import { KBArticleList } from "@/components/knowledge-base"

describe("KBArticleList", () => {
  it("shows create button for Admin", () => {
    render(<KBArticleList userRole="Admin/Manager" />)
    expect(screen.getByText("New Article")).toBeInTheDocument()
  })

  it("hides create button for User", () => {
    render(<KBArticleList userRole="User/Employee" />)
    expect(screen.queryByText("New Article")).not.toBeInTheDocument()
  })
})
```

## Troubleshooting

### Articles not loading
- Check API endpoint is accessible
- Verify user authentication
- Check browser console for errors

### Create button not showing
- Verify user role is "Admin/Manager" or "Team Leader"
- Check userRole prop is passed correctly

### Suggestions not appearing
- Ensure ticket content is at least 10 characters
- Check `/api/knowledge-base/suggest` endpoint
- Verify articles exist in database

## Support

For issues or questions:
1. Check the README.md for component documentation
2. Review the IMPLEMENTATION_SUMMARY.md for technical details
3. Check API endpoint responses in browser DevTools
4. Verify user permissions and role assignments
