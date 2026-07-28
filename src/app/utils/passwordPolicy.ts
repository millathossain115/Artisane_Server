export const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-100 characters and include at least one letter and one number';

export const isMediumPassword = (password: string) => {
  return (
    password.length >= 8 &&
    password.length <= 100 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
};
