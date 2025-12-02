# Database Migration Instructions

## What Changed
- Removed the `Customer` table completely
- Updated `Ticket` model to use `User` for the customer field
- Updated `TicketFeedback` to use `User` instead of `Customer`
- All three user types (customer, assignee, creator) now use the same `User` table

## Migration Steps

### 1. Create the migration
```bash
npx prisma migrate dev --name remove_customer_table_use_user
```

### 2. If you have existing data in the `customers` table:

You'll need to migrate that data to the `users` table first. Run this SQL before the migration:

```sql
-- Insert customers as users (if they don't already exist)
INSERT INTO users (id, email, name, password, "isActive", "createdAt", "updatedAt")
SELECT 
  c.id,
  c.email,
  c.name,
  '$2b$10$defaultpasswordhash', -- You'll need to set a default password
  true,
  c."createdAt",
  c."updatedAt"
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = c.email
);

-- The tickets already reference the correct IDs, so no update needed
```

### 3. Apply the migration
```bash
npx prisma migrate deploy
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

## What This Fixes
✅ No more data duplication between `users` and `customers`
✅ Customer, Assignee, and Creator all use the same `User` model
✅ Consistent data across the system
✅ Simpler schema and easier to maintain

## Schema Changes Summary
- `Ticket.customer` now points to `User` (relation: "TicketCustomer")
- `Ticket.assignedUser` points to `User` (relation: "AssignedTickets")  
- `Ticket.creator` points to `User` (relation: "CreatedTickets")
- `TicketFeedback.customer` now points to `User`
- Added indexes for `customerId` and `assignedTo` in Ticket table
