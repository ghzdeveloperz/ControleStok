// aqui é dois links pra google play, um quando tiver em mobile e outro quando estiver em desktop
export function getAppLink() {
  if (typeof window === "undefined") {
    return "https://play.google.com/store/apps/details?id=com.ghz.mystoreday_app"
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    window.navigator.userAgent
  )

  return isMobile
    ? "https://play.google.com/store/apps/details?id=com.ghz.mystoreday_app"
    : "https://play.google.com/apps/testing/com.ghz.mystoreday_app"
}
