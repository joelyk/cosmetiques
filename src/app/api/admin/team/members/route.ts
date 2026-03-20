import { z } from "zod";

import { auth } from "@/auth";
import { canManageAdminTeam, revokeAdminMember } from "@/lib/admin-team";

const RevokeMemberSchema = z.object({
  email: z.email().min(5).max(160),
});

export async function DELETE(request: Request) {
  const session = await auth();

  if (!canManageAdminTeam(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces reserve au super admin." }, { status: 403 });
  }

  const payload = RevokeMemberSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json({ error: "Email admin invalide." }, { status: 400 });
  }

  try {
    await revokeAdminMember(payload.data.email);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de retirer cet admin.",
      },
      { status: 400 },
    );
  }
}

