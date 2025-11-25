# DynamicDropdownSelect Component

A reusable, database-driven dropdown component with search/filter capabilities, loading states, and error handling.

## Features

- ✅ **Dynamic Data Loading**: Fetches data from any API endpoint
- ✅ **Search/Filter Support**: Built-in search with debounced API calls
- ✅ **Loading States**: Shows spinner during data fetching
- ✅ **Error Handling**: Gracefully handles and displays errors
- ✅ **Type-Safe**: Full TypeScript support with generics
- ✅ **Customizable Formatting**: Control how items are displayed
- ✅ **Pagination Ready**: Supports large datasets with limit parameter
- ✅ **Accessible**: Built on Radix UI primitives

## Requirements Satisfied

This component satisfies the following requirements from the enhanced ticket creation spec:

- **Requirement 2.1**: Fetch and display all active helpdesk teams
- **Requirement 2.2**: Fetch and display all active users
- **Requirement 2.3**: Fetch and display all customers
- **Requirement 2.4**: Store selected entity's unique identifier
- **Requirement 2.5**: Display loading indicator during data fetch

## Usage

### Basic Example

```tsx
import { DynamicDropdownSelect } from '@/components/dynamic-dropdown-select';

interface Team {
  id: string;
  name: string;
  description?: string;
}

function MyComponent() {
  const [teamId, setTeamId] = useState<string>('');

  return (
    <DynamicDropdownSelect<Team>
      endpoint="/teams"
      value={teamId}
      onValueChange={setTeamId}
      placeholder="Select a team..."
      formatLabel={(team) => team.name}
      formatValue={(team) => team.id}
      responseKey="teams"
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint to fetch data from |
| `value` | `string` | No | Currently selected value (entity ID) |
| `onValueChange` | `(value: string) => void` | Yes | Callback when selection changes |
| `formatLabel` | `(item: T) => string` | Yes | Function to format the display label |
| `formatValue` | `(item: T) => string` | Yes | Function to extract the value (usually ID) |
| `placeholder` | `string` | No | Placeholder text (default: "Select an option...") |
| `disabled` | `boolean` | No | Disable the dropdown |
| `formatSecondaryLabel` | `(item: T) => string \| null` | No | Optional secondary label formatter |
| `searchPlaceholder` | `string` | No | Search input placeholder |
| `emptyMessage` | `string` | No | Message when no results found |
| `className` | `string` | No | Additional CSS classes |
| `responseKey` | `string` | No | Key to extract items from API response |

### Examples for Ticket Creation

#### Team Selector

```tsx
<DynamicDropdownSelect<Team>
  endpoint="/teams"
  value={teamId}
  onValueChange={setTeamId}
  placeholder="Select a team..."
  formatLabel={(team) => team.name}
  formatValue={(team) => team.id}
  formatSecondaryLabel={(team) => team.description || null}
  searchPlaceholder="Search teams..."
  responseKey="teams"
/>
```

#### User/Assignee Selector

```tsx
<DynamicDropdownSelect<User>
  endpoint="/users"
  value={assignedTo}
  onValueChange={setAssignedTo}
  placeholder="Select a user..."
  formatLabel={(user) => user.name}
  formatValue={(user) => user.id}
  formatSecondaryLabel={(user) => user.email}
  searchPlaceholder="Search users..."
  responseKey="users"
/>
```

#### Customer Selector

```tsx
<DynamicDropdownSelect<Customer>
  endpoint="/customers"
  value={customerId}
  onValueChange={setCustomerId}
  placeholder="Select a customer..."
  formatLabel={(customer) => customer.name}
  formatValue={(customer) => customer.id}
  formatSecondaryLabel={(customer) => 
    customer.company ? `(${customer.company})` : customer.email
  }
  searchPlaceholder="Search customers..."
  responseKey="customers"
/>
```

## API Response Format

The component expects API responses in one of these formats:

### Option 1: Direct Array
```json
[
  { "id": "1", "name": "Item 1" },
  { "id": "2", "name": "Item 2" }
]
```

### Option 2: Object with Array (using responseKey)
```json
{
  "teams": [
    { "id": "1", "name": "Team 1" },
    { "id": "2", "name": "Team 2" }
  ]
}
```

### Option 3: Auto-detection
If no `responseKey` is provided, the component will automatically find the first array in the response object.

## Search Functionality

The component supports server-side search:

- Search is triggered when the user types 2+ characters or clears the input
- Search query is sent as a `search` parameter to the API
- Example: `GET /api/teams?search=engineering&limit=50`

## Error Handling

The component handles errors gracefully:

- Network errors are caught and displayed
- API errors are shown in the dropdown
- Loading states prevent multiple simultaneous requests
- User-friendly error messages

## Loading States

- Initial load shows spinner in the trigger button
- Search operations show spinner in the dropdown
- Dropdown is disabled during loading

## Performance Considerations

- Pagination: Automatically limits results to 50 items
- Debounced search: Only searches after 2+ characters
- Efficient re-renders: Uses React hooks properly
- Memory efficient: Clears search on selection

## Accessibility

- Built on Radix UI Command component
- Keyboard navigation support
- Screen reader friendly
- ARIA attributes included
- Focus management

## Integration with Forms

Works seamlessly with form libraries:

```tsx
// React Hook Form example
<Controller
  name="teamId"
  control={control}
  render={({ field }) => (
    <DynamicDropdownSelect<Team>
      endpoint="/teams"
      value={field.value}
      onValueChange={field.onChange}
      formatLabel={(team) => team.name}
      formatValue={(team) => team.id}
      responseKey="teams"
    />
  )}
/>
```

## Testing

See `components/dynamic-dropdown-select-examples.tsx` for complete working examples.

## Related Components

- `CustomerSelector`: Specialized customer selector (can be replaced with DynamicDropdownSelect)
- `TeamSelector`: Dialog-based team assignment (different use case)

## Future Enhancements

Potential improvements for future iterations:

- [ ] Virtual scrolling for very large datasets
- [ ] Multi-select support
- [ ] Custom item renderers
- [ ] Caching of fetched data
- [ ] Optimistic updates
- [ ] Infinite scroll pagination
