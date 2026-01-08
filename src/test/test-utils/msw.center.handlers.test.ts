import { server } from "./msw.server";

// Use the global server from msw.server.ts which already includes center handlers

describe("msw center handlers", () => {
  it("returns centers list", async () => {
    const res = await fetch("http://localhost:3005/centers");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { _id: "c1", name: "Center A" },
      { _id: "c2", name: "Center B" },
    ]);
  });
});
