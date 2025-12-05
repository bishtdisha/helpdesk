const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTickets() {
  console.log('🔍 Checking all tickets in database...\n');

  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        assignedUser: { select: { name: true, email: true } },