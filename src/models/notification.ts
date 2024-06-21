export interface Notification {
    id: number;
    userId: number;
    category: string;
    message: string;
    status: string;
    createdAt: Date;
}
