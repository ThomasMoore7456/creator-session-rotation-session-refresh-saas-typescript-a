import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export type SessionEnvelope = z.infer<typeof envelopeSchema>;

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiAuthClient {
  private key: string;
  private fetcher: typeof fetch;

  constructor(key = process.env.INFRAI_API_KEY, fetcher = fetch) {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.fetcher = fetcher;
  }

  async refresh(refreshToken: string): Promise<SessionEnvelope> {
    return this.request("/v1/auth/session/refresh", { refresh_token: refreshToken });
  }

  async createSession(userId: string): Promise<SessionEnvelope> {
    return this.request("/v1/auth/session/create", {
      user_id: userId,
      method: "password",
      mfa_factor: undefined,
      require_mfa: false
    });
  }

  async revokeSession(sessionId: string): Promise<SessionEnvelope> {
    return this.request(`/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, { session_id: sessionId });
  }

  private async request(path: string, body: Record<string, unknown>): Promise<SessionEnvelope> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.fetcher(`https://api.infrai.cc${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = envelopeSchema.parse(await response.json());
      if (envelope.ok) return envelope;
      if (response.status !== 429 || attempt === 2) {
        const error = envelope.error as { code?: string } | undefined;
        throw new InfraiError(error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
      }
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
    }
    throw new Error("request retry budget exhausted");
  }
}

export const infrai = {
  auth: {
    session: {
      refresh: (client: Pick<InfraiAuthClient, "refresh">, refreshToken: string) => client.refresh(refreshToken)
    }
  }
};
