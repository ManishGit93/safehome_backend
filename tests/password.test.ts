import { hashPassword, verifyPassword } from "../utils/password";

describe("password utils", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("strong-password");
    expect(hash).not.toEqual("strong-password");
    await expect(verifyPassword("strong-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});


