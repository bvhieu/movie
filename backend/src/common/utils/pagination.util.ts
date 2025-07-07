export function paginate(page = 1, limit = 10) {
  const take = limit > 100 ? 100 : limit;
  const skip = (page - 1) * take;
  return { take, skip };
}
