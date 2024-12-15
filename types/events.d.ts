import type { DBRow } from "~~/supabase/utils";

export interface Cue {
    index: number; // Unique index - critical for understanding the order of cues
    dialogs?: string; // What is before moving on to the next cue
    comment?: string; // Short summary of the cue
    // When the timestamp reaches 0, a fitting message will be generated (ex. 'Event will start soon...').
    timestamp?: number; // Unix timestamp of when the cue is supposed to take effect (explusively for the purpose of generating a countdown timer)
    stageDisplay?: {
        type: "color" | "image" | "video" | "yt_video";
        content: string; // Content URL / Hex code
    };
    stageCue?: {
        yelp: string; // Text should be concise and cary critical information
    };
    livestream?: {
        overlayText: string; // Audition name
    };
    website?: {
        headline: string; // Audition name
    };
}

export type Timeline = Omit<DBRow<"timelines">, "cues"> & {
    cues: Array<Cue>;
};
