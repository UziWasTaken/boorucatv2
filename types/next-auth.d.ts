import 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    username: string
    email: string
    id: string
  }

  interface Session {
    user: {
      username: string
      email: string
      id: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
    email: string
    id: string
  }
} 