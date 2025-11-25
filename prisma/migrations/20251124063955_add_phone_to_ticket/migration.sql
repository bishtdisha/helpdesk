-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ticket_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "title" TEXT,
    "content" TEXT,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_templates_createdBy_idx" ON "ticket_templates"("createdBy");

-- CreateIndex
CREATE INDEX "ticket_templates_category_idx" ON "ticket_templates"("category");

-- CreateIndex
CREATE INDEX "ticket_templates_isGlobal_idx" ON "ticket_templates"("isGlobal");

-- AddForeignKey
ALTER TABLE "ticket_templates" ADD CONSTRAINT "ticket_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
