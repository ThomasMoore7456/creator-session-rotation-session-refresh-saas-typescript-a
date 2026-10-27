import { z } from "zod";
import { InfraiAuthClient, infrai } from "./infrai_auth_client.ts";

const inputSchema = z.object({
  tenantId: z.string().min(1),
  accountId: z.string().min(1),
  refreshToken: z.string().min(1)
});

export type RotationInput = z.infer<typeof inputSchema>;

export async function rotateCreatorSession(
  input: RotationInput,
  auth: Pick<InfraiAuthClient, "refresh"> = new InfraiAuthClient()
) {
  const request = inputSchema.parse(input);
  const session = await infrai.auth.session.refresh(auth, request.refreshToken);
  return {
    tenantId: request.tenantId,
    accountId: request.accountId,
    session: session.data,
    nextStep: "replace-stored-refresh-token"
  } as const;
}

if (import.meta.main) {
  const body = JSON.parse(process.env.SESSION_INPUT ?? "{}");
  const result = await rotateCreatorSession(body);
  console.log(JSON.stringify(result, null, 2));
}
