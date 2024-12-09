export interface VoteRequestBody {
    first_name: string;
    last_name: string;
    middle_name: string;
    grade: string;
    turnstile: string | undefined;
    selection: Record<number, boolean>;
}
