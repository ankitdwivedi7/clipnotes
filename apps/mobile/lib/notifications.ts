// Notifications stub — expo-notifications removed due to Xcode 26 incompatibility
// Will be re-added when Expo SDK 53+ ships with Xcode 26 support

export async function registerForPushNotifications(): Promise<string | null> {
  console.log("[Notifications] Native notifications disabled — using stub");
  return null;
}

export function scheduleLocalNotification(_title: string, _body: string) {
  // No-op without native module
  console.log("[Notifications] Local notification skipped (native module unavailable)");
  return Promise.resolve();
}
