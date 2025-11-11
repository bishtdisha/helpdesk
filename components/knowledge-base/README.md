# Knowledge Base UI Components

This directory contains the UI components for the knowledge base feature with role-based access control.

## Components

### KBArticleList
Main component for displaying a list of knowledge base articles with role-based filtering.

**Features:**
- Role-based article filtering (PUBLIC, INTERNAL, RESTRICTED)
- Search functionality across title and summary
- Category navigation
- Access level filtering
- Create article button (Admin/Team Leader only)
- Article metadata display (views, helpful count)

**Props:**
- `userRole?: string` - Current user's role for permission checks

**Usage:**
```tsx
import { KBArticleList } from "@/components/knowledge-base"

<KBArticleList userRole={currentUser.role.name} />
```

### KBArticleDetail
Component for displaying full article details with engagement tracking.

**Features:**
- Full article content display with formatting
- View tracking (automatically records views)
- "Was this helpful?" feedback mechanism
- Related articles suggestions
- Edit/Delete actions (role-based)
- Article metadata (views, helpful count, categories)

**Props:**
- `articleId: string` - ID of the article to display
- `userRole?: string` - Current user's role for permission checks
- `userId?: string` - Current user's ID for ownership checks

**Usage:**
```tsx
import { KBArticleDetail } from "@/components/knowledge-base"

<KBArticleDetail 
  articleId={articleId} 
  userRole={currentUser.role.name}
  userId={currentUser.id}
/>
```

### KBArticleEditor
Component for creating and editing knowledge base articles.

**Features:**
- Create new articles or edit existing ones
- Rich text content editor
- Access level selection (PUBLIC, INTERNAL, RESTRICTED)
- Team selection for RESTRICTED articles
- Category assignment (multi-select)
- Publish/unpublish toggle (Admin only)
- Form validation
- Draft saving

**Props:**
- `articleId?: string` - If provided, edit mode; otherwise, create mode
- `userRole?: string` - Current user's role for permission checks

**Usage:**
```tsx
import { KBArticleEditor } from "@/components/knowledge-base"

// Create mode
<KBArticleEditor userRole={currentUser.role.name} />

// Edit mode
<KBArticleEditor articleId={articleId} userRole={currentUser.role.name} />
```

### ArticleSuggestion
Component for suggesting relevant articles based on ticket content.

**Features:**
- Automatic article suggestions based on content analysis
- Relevance scoring (High, Medium, Low)
- Quick view dialog for article preview
- Full article view in new tab
- Article metadata display
- Category badges

**Props:**
- `ticketContent: string` - Title + description of the ticket
- `onArticleSelect?: (articleId: string) => void` - Callback when article is selected
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { ArticleSuggestion } from "@/components/knowledge-base"

<ArticleSuggestion 
  ticketContent={`${ticketTitle} ${ticketDescription}`}
  onArticleSelect={(id) => console.log("Selected:", id)}
/>
```

## Role-Based Access Control

The components implement the following access control rules:

### Admin/Manager
- View all articles (PUBLIC, INTERNAL, RESTRICTED)
- Create new articles
- Edit any article
- Delete any article
- Publish/unpublish articles
- Assign any access level

### Team Leader
- View PUBLIC, INTERNAL, and team-specific RESTRICTED articles
- Create new articles
- Edit own articles and team articles
- Cannot delete articles
- Cannot publish/unpublish (articles saved as drafts)
- Can assign PUBLIC, INTERNAL, and team RESTRICTED access levels

### User/Employee
- View PUBLIC and INTERNAL articles only
- Cannot create articles
- Cannot edit articles
- Cannot delete articles
- Read-only access

## API Integration

The components integrate with the following API endpoints:

- `GET /api/knowledge-base/articles` - List articles with filters
- `POST /api/knowledge-base/articles` - Create new article
- `GET /api/knowledge-base/articles/:id` - Get article details
- `PUT /api/knowledge-base/articles/:id` - Update article
- `DELETE /api/knowledge-base/articles/:id` - Delete article
- `POST /api/knowledge-base/articles/:id/view` - Record article view
- `POST /api/knowledge-base/articles/:id/helpful` - Record helpful vote
- `GET /api/knowledge-base/search` - Search articles
- `GET /api/knowledge-base/suggest` - Get article suggestions
- `GET /api/knowledge-base/categories` - List categories

## Styling

All components use the shadcn/ui component library with Tailwind CSS for consistent styling and dark mode support.

## Requirements Covered

These components fulfill the following requirements from the spec:

- **Requirement 9.1**: Knowledge base article access based on user roles
- **Requirement 15.1**: Read-only knowledge base access for User/Employee
- **Requirement 15.2**: Knowledge base search functionality
- **Requirement 15.3**: Knowledge base category browsing
- **Requirement 15.5**: Article suggestion based on ticket content

## Implementation Notes

1. **View Tracking**: The `KBArticleDetail` component automatically records a view when an article is loaded.

2. **Helpful Votes**: Users can vote once per article (tracked client-side with state).

3. **Article Suggestions**: The `ArticleSuggestion` component uses keyword matching and relevance scoring to suggest articles. It automatically fetches suggestions when ticket content changes.

4. **Access Level Colors**:
   - PUBLIC: Green
   - INTERNAL: Blue
   - RESTRICTED: Orange

5. **Content Formatting**: Article content supports basic line break formatting. For more advanced formatting, consider integrating a markdown parser or rich text editor.

6. **Performance**: The components implement loading states and error handling for better UX.
