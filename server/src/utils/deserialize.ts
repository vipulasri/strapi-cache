export const deserialize = (str: string) => {
  if (!str) {
    return null;
  }
  return JSON.parse(str).data;
};
