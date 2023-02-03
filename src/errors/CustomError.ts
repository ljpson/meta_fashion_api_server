export class CustomError extends Error{
    private readonly code : number
    constructor(code: number, message?: string) {
        super(message);
        this.code = code
    }

    public getCode() {
        return this.code
    }
}