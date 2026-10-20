type Formatter = (digits: string) => string;

export const formatCpf: Formatter = (digits) =>
  digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");

export const formatBrazilianPhone: Formatter = (digits) => {
  const local = digits.slice(0, 11);
  if (local.length <= 2) return local.length ? `(${local}` : "";
  const area = local.slice(0, 2);
  const number = local.slice(2);
  const split = number.length > 8 ? 5 : 4;
  const tail = number.slice(split);
  return `(${area}) ${number.slice(0, split)}${tail ? `-${tail}` : ""}`;
};

export const formatCardNumber: Formatter = (digits) => digits.slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

export const formatCardExpiry: Formatter = (digits) => {
  const value = digits.slice(0, 4);
  return value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
};

const formatPhone = (value: string): string | null =>
  value.trimStart().startsWith("+") ? null : formatBrazilianPhone(value.replace(/\D/g, ""));

const maskedFields: Record<string, (value: string) => string | null> = {
  cpf: (value) => formatCpf(value.replace(/\D/g, "")),
  phone: formatPhone,
  cardNumber: (value) => formatCardNumber(value.replace(/\D/g, "")),
  cardExpiry: (value) => formatCardExpiry(value.replace(/\D/g, "")),
};

export function applyInputMasks(form: HTMLFormElement): void {
  form.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const format = maskedFields[input.name];
    if (format === undefined) return;

    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
    const formatted = format(input.value);
    if (formatted === null || formatted === input.value) return;

    input.value = formatted;
    const position = caretAfterDigits(formatted, digitsBeforeCaret);
    input.setSelectionRange(position, position);
  });
}

function caretAfterDigits(value: string, digits: number): number {
  if (digits === 0) return value.match(/^\D*/)?.[0].length ?? 0;
  let seen = 0;
  for (let index = 0; index < value.length; index++) {
    if (/\d/.test(value[index] ?? "")) seen++;
    if (seen === digits) return index + 1;
  }
  return value.length;
}
