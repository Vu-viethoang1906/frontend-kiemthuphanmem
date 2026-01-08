import { setupServer } from "msw/node";
import { makeSwimlaneHandlers } from "./msw.swimlane.handlers";

const server = setupServer(...makeSwimlaneHandlers());

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("msw swimlane handlers", () => {
  it("reorders swimlanes for a board", async () => {
    const res = await fetch("http://localhost:3005/api/swimlanes/board/board-9/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swimlane_ids: ["s1", "s2", "s3"] }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: { boardId: "board-9", ids: ["s1", "s2", "s3"] } });
  });

  it("returns 400 for bad payload", async () => {
    const res = await fetch("http://localhost:3005/api/swimlanes/board/board-9/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
