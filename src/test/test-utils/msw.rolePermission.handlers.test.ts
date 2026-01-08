import { setupServer } from "msw/node";
import {
  makeRolePermissionHandlers,
  __seedPermissions,
  __seedRolePermissions,
  __seedUserRoles,
} from "./msw.rolePermission.handlers";

const server = setupServer(...makeRolePermissionHandlers());

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  __seedPermissions([
    { id: "p1", name: "READ" },
    { id: "p2", name: "WRITE" },
  ]);
  __seedRolePermissions([{ roleId: "r1", permissionIds: ["p1"] }]);
  __seedUserRoles([{ user_id: "user-1", role_id: "r1" }]);
});
afterAll(() => server.close());

describe("msw rolePermission handlers", () => {
  it("returns permissions list", async () => {
    const res = await fetch("http://localhost:3005/api/permission");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { id: "p1", name: "READ" },
      { id: "p2", name: "WRITE" },
    ]);
  });

  it("updates role permissions and reflects in subsequent fetch", async () => {
    const res = await fetch("http://localhost:3005/api/RolePermission/RolePermission", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserId: "actor-1", permissions: ["p1", "p2"] }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0]).toEqual({ roleId: "r1", permissionIds: ["p1", "p2"] });
    expect(body.actor).toBe("actor-1");

    const listRes = await fetch("http://localhost:3005/api/RolePermission");
    const listBody = await listRes.json();
    expect(listBody.data[0]).toEqual({ roleId: "r1", permissionIds: ["p1", "p2"] });
  });

  it("creates and deletes user roles", async () => {
    const postRes = await fetch("http://localhost:3005/api/userRole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "u2", role_id: "r2" }),
    });
    const postBody = await postRes.json();
    expect(postBody.data).toEqual({ user_id: "u2", role_id: "r2" });

    const byUserRes = await fetch("http://localhost:3005/api/userRole/user/u2");
    const byUserBody = await byUserRes.json();
    expect(byUserBody.data).toEqual([{ user_id: "u2", role_id: "r2" }]);

    const deleteRes = await fetch("http://localhost:3005/api/userRole/user/u2", { method: "DELETE" });
    expect(deleteRes.status).toBe(200);

    const afterDelete = await fetch("http://localhost:3005/api/userRole/user/u2");
    const afterDeleteBody = await afterDelete.json();
    expect(afterDeleteBody.data).toEqual([]);
  });
});
