import { z } from "zod";

import { auth } from "@/auth";
import {
  canManageAdminTeam,
  createAdminInvite,
  revokeAdminInvite,
} from "@/lib/admin-team";

const InviteSchema = z.object({
  email: z.email().min(5).max(160),
});

const RevokeSchema = z.object({
  inviteId: z.string().min(2).max(120),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!canManageAdminTeam(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces reserve au super admin." }, { status: 403 });
  }

  const payload = InviteSchema.safeParse(await request.json());
  if (!payload.success || !session?.user?.email) {
    return Response.json(
      { error: "Email d invitation invalide." },
      { status: 400 },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const result = await createAdminInvite({
      email: payload.data.email,
      invitedByEmail: session.user.email,
      origin,
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de creer le lien d invitation admin.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!canManageAdminTeam(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces reserve au super admin." }, { status: 403 });
  }

  const payload = RevokeSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json(
      { error: "Invitation admin invalide." },
      { status: 400 },
    );
  }

  try {
    await revokeAdminInvite(payload.data.inviteId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de revoquer cette invitation.",
      },
      { status: 400 },
    );
  }
}
