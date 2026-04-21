import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadJson, saveJson, removeItem } from "../utils/storage";

// __mocks__/async-storage.ts 사용

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  (AsyncStorage.removeItem as jest.Mock).mockReset();
});

describe("loadJson", () => {
  it("키 없으면 fallback 반환", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await loadJson("@test/key", { default: true });
    expect(result).toEqual({ default: true });
  });

  it("유효한 JSON 파싱", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"name":"맑음"}');
    const result = await loadJson("@test/key", {});
    expect(result).toEqual({ name: "맑음" });
  });

  it("JSON.parse 에러 시 fallback 반환", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid json{");
    const result = await loadJson("@test/key", { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it("null 파싱 결과 → fallback", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("null");
    const result = await loadJson("@test/key", "default");
    expect(result).toBe("default");
  });

  it("AsyncStorage 에러 시 fallback 반환", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error("disk error"));
    const result = await loadJson("@test/key", []);
    expect(result).toEqual([]);
  });
});

describe("saveJson", () => {
  it("JSON 직렬화 후 저장", async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    await saveJson("@test/key", { temp: 20 });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("@test/key", '{"temp":20}');
  });

  it("저장 실패해도 에러 throw 안 함", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error("write error"));
    await expect(saveJson("@test/key", "data")).resolves.toBeUndefined();
  });
});

describe("removeItem", () => {
  it("키 삭제", async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    await removeItem("@test/key");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@test/key");
  });

  it("삭제 실패해도 에러 throw 안 함", async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error("remove error"));
    await expect(removeItem("@test/key")).resolves.toBeUndefined();
  });
});
