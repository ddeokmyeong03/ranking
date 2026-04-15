type ClassValue = string | number | boolean | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}
