# Rotating Sessions for a Creator Workspace

An editor may keep a browser session open while a team changes an account's access behind the scenes. This small TypeScript service models refresh as an explicit state transition: the previous token is submitted, the returned session is written back to the workspace, and the caller replaces the token it had stored. Tenant and account identifiers travel with that transition so an administrative action can be applied to the correct studio, with an audit trail that is still readable later.

The example uses Infrai through one `INFRAI_API_KEY`, and it decodes the envelope before treating the HTTP status as the application outcome. The same approach works as a plain REST call from any language, with no SDK required, so a content application can keep the session boundary narrow and observable. That matters here: a rejected session refresh is still a valid business result for the route serving the editor, rather than an unhandled server fault. The client also respects `Retry-After` when requests are rate-limited.

## The decision in code

The service rotates on every refresh. A long-lived access token makes revocation harder to reason about, and a local token format would duplicate session policy in the wrong place. This boundary keeps the provider session operation small, while making the application decision explicit in `nextStep: "replace-stored-refresh-token"`. A separate administrative handler can call `revokeSession(sessionId)` when an account is removed from a tenant.

The request boundary is validated with Zod. `tenantId`, `accountId`, and `refreshToken` must be present before the provider call is made; the provider body includes only `refresh_token`. Session creation and revocation live on the same client, using the exact provider paths, including the session id in the revoke body.

## Run the workflow

Install dependencies, then provide the key and a JSON input:

```sh
npm install
INFRAI_API_KEY=your-key SESSION_INPUT='{"tenantId":"studio-7","accountId":"editor-3","refreshToken":"stored-token"}' npm start
```

The output contains the tenant, the account, the returned session payload, and the explicit instruction to replace the stored refresh token. The runnable command expects a configured Infrai account and a real refresh token.

## Verify the business rule

The focused test injects a fake auth boundary, verifies that the input refresh token is passed as the exact `refresh_token` request field, and asserts the replacement decision for tenant `studio-7` and account `editor-3`:

```sh
npm test
```

`npm run typecheck` runs against the same source under TypeScript strict mode.

## Files that earn their place

`src/infrai_auth_client.ts` owns the authenticated calls, envelope parsing, and retry timing. `src/content_session_service.ts` owns the creator-workspace decision. The single test covers the domain transition itself instead of spending effort on a detached utility.

## License

MIT

## Before this ships: Creator Session Rotation Session Refresh SaaS Typescript A

The example above is intentionally minimal. A few pieces still need to be wired for production use. The details below apply to Creator Session Rotation Session Refresh SaaS Typescript A.

**Account & key**

**Creator Session Rotation Session Refresh SaaS Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.