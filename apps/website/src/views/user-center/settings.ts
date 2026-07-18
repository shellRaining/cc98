export interface BirthdayParts {
  year: number;
  month: number;
  day: number;
}

export function splitBirthday(value: string | null | undefined): BirthdayParts {
  const match = value?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match
    ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
    : { year: 0, month: 0, day: 0 };
}

export function joinBirthday(parts: BirthdayParts): string | null {
  if (parts.year === 0) return null;
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function validateProfileSettings(input: {
  email: string;
  qq: string;
  birthday: BirthdayParts;
}): string | null {
  if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) return "请检查邮箱地址";
  if (input.qq && !/^[1-9]\d*$/.test(input.qq)) return "请检查 QQ 是否正确";
  const birthday = joinBirthday(input.birthday);
  if (birthday === "") return "请检查生日是否正确";
  if (input.birthday.year !== 0 && input.birthday.year !== 9999) {
    const date = new Date(input.birthday.year, input.birthday.month - 1, input.birthday.day);
    if (
      date.getFullYear() !== input.birthday.year ||
      date.getMonth() !== input.birthday.month - 1 ||
      date.getDate() !== input.birthday.day ||
      date.getTime() > Date.now()
    ) {
      return "请检查生日是否正确";
    }
  }
  return null;
}
