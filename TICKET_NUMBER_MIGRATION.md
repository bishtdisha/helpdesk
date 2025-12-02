# Ticket Number Migration Instructions

## What Changed
Added a new `ticketNumber` field to the Ticket model that auto-increments starting from 1.

## Migration Steps

### 1. Create and apply the migration
```bash
npx prisma migrate dev --name add_ticket_number
```

### 2. The migration will:
- Add a new `ticketNumber` column (INT, UNIQUE, AUTO_INCREMENT)
- Automatically assign sequential numbers to existing tickets (1, 2, 3, ...)
- Future tickets will auto-increment from the last number

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Restart your dev server
```bash
npm run dev
```

## Display Format

The ticket number will be displayed as:
- `#00001` - First ticket
- `#00002` - Second ticket
- `#00123` - 123rd ticket
- `#12345` - 12,345th ticket

## Technical Details

**Schema Change:**
```prisma
ticketNumber Int @unique @default(autoincrement())
```

**How it works:**
- Database automatically generates the next number
- Starts at 1 and increments by 1 for each new ticket
- Guaranteed unique across all tickets
- No gaps even if tickets are deleted (numbers are never reused)

## Benefits
✅ Human-readable ticket IDs
✅ Easy to reference in conversations ("Ticket #123")
✅ Sequential and predictable
✅ Automatic - no manual logic needed
✅ Database-level guarantee of uniqueness

## Note
- The original `id` field (CUID) is still the primary key for database relationships
- `ticketNumber` is just for display and human reference
- Both fields are unique and can be used to look up tickets
