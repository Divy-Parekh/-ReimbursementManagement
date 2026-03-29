const { PrismaClient } = require('@prisma/client');

// Singleton Prisma Client to avoid connection pool exhaustion
const prisma = new PrismaClient();

module.exports = prisma;
