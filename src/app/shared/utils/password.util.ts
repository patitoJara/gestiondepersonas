export function generarPassword(length: number = 10): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%*_-';

  const getRandom = (chars: string) =>
    chars[Math.floor(Math.random() * chars.length)];

  let password = '';

  password += getRandom(uppercase);
  password += getRandom(lowercase);
  password += getRandom(numbers);
  password += getRandom(special);

  const all = uppercase + lowercase + numbers + special;

  for (let i = password.length; i < length; i++) {
    password += getRandom(all);
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}