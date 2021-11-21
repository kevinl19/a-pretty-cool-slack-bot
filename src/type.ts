import { Request } from 'express';

export interface ModifiedRequest extends Request {
    rawBody?: string,
}
