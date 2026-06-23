import prisma from "../lib/prisma";

export async function logAction(
  userId: number | null,
  action: string,
  entity: string,
  entityId?: number,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details },
    });
  } catch (err) {
    // Falha de auditoria não deve derrubar a operação principal
    console.error("[AuditLog] Erro ao registrar ação:", err);
  }
}
