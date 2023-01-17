export default function sliceLast<T>(list: T[], count: number): T[] {
  return list.slice(list.length - count, list.length);
}
