import { describe, expect, it } from "vitest";
import { coffeePayerSchema, isValidCpf } from "../src";

const payer = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "(11) 99999-9999",
  cpf: "529.982.247-25",
};

describe("coffeePayerSchema", () => {
  it("normalizes a Brazilian phone and CPF to the digits the provider expects", () => {
    expect(coffeePayerSchema.parse(payer)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "5511999999999",
      cpf: "52998224725",
    });
  });

  it("keeps an international phone as typed", () => {
    expect(coffeePayerSchema.parse({ ...payer, phone: "+1 415 555 0100" }).phone).toBe("14155550100");
  });

  it("lets a payer outside Brazil leave the CPF empty", () => {
    expect(coffeePayerSchema.parse({ ...payer, cpf: "" }).cpf).toBeUndefined();
  });

  it("rejects a CPF with wrong check digits", () => {
    expect(coffeePayerSchema.safeParse({ ...payer, cpf: "529.982.247-24" }).success).toBe(false);
  });
});

describe("isValidCpf", () => {
  it("rejects repeated digits even though their check digits add up", () => {
    expect(isValidCpf("11111111111")).toBe(false);
  });
});
