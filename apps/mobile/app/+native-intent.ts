export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // When the app receives a share intent, redirect to the inbox
  // which will show the ShareReceiver component
  if (path.includes("share-intent")) {
    return "/(tabs)";
  }
  return path;
}
