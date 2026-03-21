import { z } from "zod";

import { auth } from "@/auth";
import { revokeAdminMember } from "@/lib/admin-team";
import { canRevokeAdmins } from "@/lib/roles";

const RevokeMemberSchema = z.object({
  email: z.email().min(5).max(160),
});

export async function DELETE(request: Request) {
  const session = await auth();

  if (!canRevokeAdmins(session?.user?.role ?? "guest")) {
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
