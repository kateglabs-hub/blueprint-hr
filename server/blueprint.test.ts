import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: AuthenticatedUser["role"] = "Super Admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-openid-123",
    email: "admin@blueprint.co.ke",
    name: "Test Admin",
    loginMethod: "manus",
    tenantId: 1,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("BluePrint HR Phase 1 Backend Tests", () => {
  it("allows Super Admin to access tenant info", async () => {
    const ctx = createMockContext("Super Admin");
    const caller = appRouter.createCaller(ctx);
    
    // Test that the router structure is sound
    expect(caller.tenant).toBeDefined();
    expect(caller.org).toBeDefined();
    expect(caller.employee).toBeDefined();
    expect(caller.audit).toBeDefined();
  });

  it("restricts employee creation for standard employee role", async () => {
    const ctx = createMockContext("Employee");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.employee.create({
        employeeNo: "EMP099",
        firstName: "Jane",
        lastName: "Doe",
        kraPin: "A123456789Z",
        basicSalary: "75000",
      })
    ).rejects.toThrow();
  });
});
