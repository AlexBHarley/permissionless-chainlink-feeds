export function classNames(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
