export interface Chapter {
  time: number; // in seconds
  title: string;
}

/**
 * Parse timestamps from a video description to extract chapter markers.
 * Supports formats: "0:00 Intro", "1:23:45 Section Title", "01:30 - Title"
 * Chapters must start at 0:00 and be in ascending order.
 */
export function parseChapters(description: string | null | undefined): Chapter[] {
  if (!description) return [];

  const lines = description.split('\n');
  const chapters: Chapter[] = [];

  // Match patterns like "0:00 Title", "1:23:45 Title", "00:30 - Title"
  const timestampRegex = /^(\d{1,2}:)?(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(timestampRegex);
    if (!match) continue;

    const hours = match[1] ? parseInt(match[1].replace(':', ''), 10) : 0;
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const title = match[4].trim();

    if (!title) continue;

    const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
    chapters.push({ time: timeInSeconds, title });
  }

  // Must have at least 2 chapters and first must start at 0:00
  if (chapters.length < 2) return [];
  if (chapters[0].time !== 0) return [];

  // Verify ascending order
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].time <= chapters[i - 1].time) return [];
  }

  return chapters;
}

/**
 * Get the current chapter based on playback time.
 */
export function getCurrentChapter(chapters: Chapter[], currentTime: number): Chapter | null {
  if (chapters.length === 0) return null;
  
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].time) {
      return chapters[i];
    }
  }
  
  return chapters[0];
}
