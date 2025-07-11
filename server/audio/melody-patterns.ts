export type MelodyPattern = {
  pattern: Array<{ time: string; note: string; duration: string }>;
};

const sunnyPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "16n" },
    { time: "0:0:1", note: "E5", duration: "16n" },
    { time: "0:0:2", note: "G5", duration: "16n" },
    { time: "0:0:3", note: "A5", duration: "16n" },
    { time: "0:1:0", note: "E5", duration: "16n" },
    { time: "0:1:1", note: "C5", duration: "16n" },
    { time: "0:1:2", note: "G5", duration: "8n" }
  ]
};

const rainyPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "16n" },
    { time: "0:0:1", note: "Eb5", duration: "16n" },
    { time: "0:0:2", note: "F5", duration: "16n" },
    { time: "0:0:3", note: "G5", duration: "16n" },
    { time: "0:1:0", note: "Ab5", duration: "16n" },
    { time: "0:1:1", note: "F5", duration: "16n" },
    { time: "0:1:2", note: "C5", duration: "8n" }
  ]
};

const snowyPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "16n" },
    { time: "0:0:1", note: "D5", duration: "16n" },
    { time: "0:0:2", note: "F5", duration: "16n" },
    { time: "0:0:3", note: "A5", duration: "16n" },
    { time: "0:1:0", note: "D5", duration: "16n" },
    { time: "0:1:1", note: "F5", duration: "16n" },
    { time: "0:1:2", note: "C5", duration: "8n" }
  ]
};

const windyPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "32n" },
    { time: "0:0:0.5", note: "D5", duration: "32n" },
    { time: "0:0:1", note: "E5", duration: "32n" },
    { time: "0:0:1.5", note: "F#5", duration: "32n" },
    { time: "0:0:2", note: "G#5", duration: "32n" },
    { time: "0:0:2.5", note: "A#5", duration: "32n" },
    { time: "0:0:3", note: "C5", duration: "16n" },
    { time: "0:1:0", note: "D5", duration: "16n" },
    { time: "0:1:2", note: "E5", duration: "8n" }
  ]
};

const overcastPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "16n" },
    { time: "0:0:1", note: "D5", duration: "16n" },
    { time: "0:0:2", note: "Eb5", duration: "16n" },
    { time: "0:0:3", note: "G5", duration: "16n" },
    { time: "0:1:0", note: "Ab5", duration: "16n" },
    { time: "0:1:1", note: "C5", duration: "16n" },
    { time: "0:1:2", note: "D5", duration: "8n" }
  ]
};

const cloudyPattern: MelodyPattern = {
  pattern: [
    { time: "0:0:0", note: "C5", duration: "16n" },
    { time: "0:0:1", note: "Eb5", duration: "16n" },
    { time: "0:0:2", note: "F5", duration: "16n" },
    { time: "0:0:3", note: "Bb5", duration: "16n" },
    { time: "0:1:0", note: "C5", duration: "16n" },
    { time: "0:1:1", note: "Eb5", duration: "16n" },
    { time: "0:1:2", note: "F5", duration: "8n" }
  ]
};

export function getMelodyPattern(condition: string): MelodyPattern {
  switch (condition) {
    case "sunny":
      return sunnyPattern;
    case "rainy":
      return rainyPattern;
    case "snowy":
      return snowyPattern;
    case "windy":
      return windyPattern;
    case "overcast":
      return overcastPattern;
    case "cloudy":
      return cloudyPattern;
    default:
      return sunnyPattern;
  }
}
