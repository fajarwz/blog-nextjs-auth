export class EmailNotVerifiedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EmailNotVerifiedError";
    }
}