import { PrismaClient } from "@prisma/client";

// Singleton para evitar múltiplas conexões ao banco
const prisma = new PrismaClient();

export default prisma;
