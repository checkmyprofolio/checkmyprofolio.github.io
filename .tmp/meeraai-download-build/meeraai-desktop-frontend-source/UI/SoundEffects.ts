let lastSoundAt = 0;

export function playSound(type: "action" | "response") {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastSoundAt < 45) {
    return;
  }
  lastSoundAt = now;
  const sounds = {
    action: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=", // short click
    response: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=", // short blip
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.15;
  audio.play();
}
