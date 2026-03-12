export interface User {
    id: string
    name: string
    email: string
    phone: string
    password: string
    photo_url: string
    sub: string
    verification: boolean
    role: string | null
}