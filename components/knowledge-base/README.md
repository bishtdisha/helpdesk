# Knowledge Base Components

This directory contains all components related to the Knowledge Base feature, implementing task 16 from the ticket system frontend integration spec.

## Components

### KBArticleList
Displays a list of knowledge base articles with role-based filtering, category navigation, and pagination support.

**Features:**
- Fetches articles from `GET /api/knowledge-base/articles`
- Role-based filtering (PUBLIC, INTERNAL, RESTRICTED)
- Category filtering
- Article metadata display (views, helpful count, author)
- Empty state handling
- Loading skeletons

**Usage:**
```tsx
import { KBArticleList } from '@/components/knowledge-base';

<KBArticleList
  onArticleClick={(articleId) => console.log(articleId)}
  showCategoryFilter={true}
  showAccessLevelFilter={false}
  defaultFilters={{ isPublished: true }}
/>
```

### KBArticleDetail
Displays full article content with metadata, automatic view tracking, and helpful feedback.

**Features:**
- Fetches article from `GET /api/knowledge-base/articles/:id`
- Displays formatted content with proper styling
- Shows author, views, helpful count
- Automatic view tracking via `POST /api/knowledge-base/articles/:id/view`
- "Was this helpful?" feedback via `POST /api/knowledge-base/articles/:id/helpful`
- Category badges

**Usage:**
```tsx
import { KBArticleDetail } from '@/components/knowledge-base';

<KBArticleDetail
  articleId="article-id"
  onBack={() => console.log('back')}
  trackView={true}
/>
```

### KBArticleSearch
Provides search functionality with debounced input and highlighted search terms.

**Features:**
- Debounced search input (300ms)
- Sends queries to `GET /api/knowledge-base/search`
- Highlights search terms in results
- Empty state for no results
- Loading states

**Usage:**
```tsx
import { KBArticleSearch } from '@/components/knowledge-base';

<KBArticleSearch
  onArticleClick={(articleId) => console.log(articleId)}
  filters={{ isPublished: true }}
  placeholder="Search articles..."
  autoFocus={true}
/>
```

### KBArticleSuggestions
Displays suggested articles based on content, useful during ticket creation.

**Features:**
- Fetches suggestions from `GET /api/knowledge-base/suggest`
- Content-based article recommendations
- Quick preview functionality
- Article summaries
- Links to full article details

**Usage:**
```tsx
import { KBArticleSuggestions } from '@/components/knowledge-base';

<KBArticleSuggestions
  content="My ticket description..."
  onArticleClick={(articleId) => console.log(articleId)}
  limit={5}
  title="Suggested Articles"
  showPreview={true}
/>
```

### KBCategoryTree
Displays category tree navigation with parent-child relationships.

**Features:**
- Fetches categories from `GET /api/knowledge-base/categories`
- Tree structure with expand/collapse
- Article count per category
- Category selection
- Hierarchical navigation

**Usage:**
```tsx
import { KBCategoryTree } from '@/components/knowledge-base';

<KBCategoryTree
  onCategorySelect={(categoryId) => console.log(categoryId)}
  selectedCategoryId={null}
  showArticleCount={true}
/>
```

### KnowledgeBase (Main)
Main knowledge base interface integrating all components.

**Features:**
- Browse and search tabs
- Category navigation sidebar
- Article list and detail views
- Seamless navigation between views

**Usage:**
```tsx
import { KnowledgeBase } from '@/components/knowledge-base';

<KnowledgeBase />
```

## Hooks

### useKBArticles
Fetches knowledge base articles with filtering.

```tsx
import { useKBArticles } from '@/lib/hooks';

const { articles, isLoading, isError, error, refresh } = useKBArticles({
  accessLevel: 'PUBLIC',
  categoryId: 'category-id',
  isPublished: true,
  search: 'query',
});
```

### useKBArticle
Fetches a single article with automatic view tracking.

```tsx
import { useKBArticle } from '@/lib/hooks';

const { 
  article, 
  isLoading, 
  recordView, 
  recordHelpful 
} = useKBArticle('article-id', {
  trackView: true,
});
```

### useKBCategories
Fetches all categories with parent-child relationships.

```tsx
import { useKBCategories } from '@/lib/hooks';

const { categories, isLoading, isError } = useKBCategories();
```

### useKBSearch
Provides debounced search functionality.

```tsx
import { useKBSearch } from '@/lib/hooks';

const { 
  results, 
  isSearching, 
  search, 
  clearSearch, 
  query 
} = useKBSearch({
  debounceMs: 300,
  isPublished: true,
});

// Trigger search
search('my query');
```

### useKBSuggestions
Fetches article suggestions based on content.

```tsx
import { useKBSuggestions } from '@/lib/hooks';

const { suggestions, isLoading } = useKBSuggestions(
  'ticket content',
  { limit: 5 }
);
```

## API Integration

All components integrate with the following backend endpoints:

- `GET /api/knowledge-base/articles` - List articles with role-based filtering
- `GET /api/knowledge-base/articles/:id` - Get single article
- `POST /api/knowledge-base/articles/:id/view` - Record article view
- `POST /api/knowledge-base/articles/:id/helpful` - Record helpful vote
- `GET /api/knowledge-base/search` - Search articles
- `GET /api/knowledge-base/suggest` - Get article suggestions
- `GET /api/knowledge-base/categories` - List categories

## RBAC Compliance

All components respect role-based access control:

- **PUBLIC** articles: Visible to all users
- **INTERNAL** articles: Visible to authenticated users
- **RESTRICTED** articles: Visible only to specific teams

The backend API handles all filtering, and the frontend displays only what the API returns.

## Requirements Implemented

This implementation satisfies the following requirements:

- **Requirement 11.1**: Fetch articles from API with role-based filtering
- **Requirement 11.2**: Search interface with query endpoint
- **Requirement 11.3**: Article suggestions during ticket creation
- **Requirement 11.4**: Display article content with formatting
- **Requirement 11.5**: Track article views
- **Requirement 60.1**: Role-based article access control
- **Requirement 60.2**: Display only permitted articles
- **Requirement 60.3**: View count increment tracking
- **Requirement 60.4**: Category-based filtering

## Testing

To test the knowledge base components:

1. Navigate to `/knowledge-base` in your application
2. Browse articles by category
3. Search for articles using keywords
4. Click on an article to view details
5. Mark articles as helpful
6. Verify view counts increment

## Notes

- All components use SWR for caching and revalidation
- Search is debounced to reduce API calls
- View tracking is automatic when viewing article details
- All content is sanitized before rendering
- Components are fully responsive and accessible
