# GEMINI.md

## Project Overview

This is a Next.js project bootstrapped with `create-next-app`. It uses Firebase for backend services and Tailwind CSS for styling. The project is set up with TypeScript and includes basic linting with ESLint.

**Key Technologies:**

*   Next.js 15.5.0 (with Turbopack)
*   React 19.1.0
*   Firebase 12.1.0
*   Tailwind CSS 4
*   TypeScript
*   ESLint

## Building and Running

### Prerequisites

*   Node.js
*   npm, yarn, pnpm, or bun

### Environment Variables

The Firebase configuration in `src/lib/firebase.ts` relies on environment variables. Create a `.env.local` file in the root of the project and add the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Commands

*   **Development:** To run the development server, use one of the following commands:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

*   **Building:** To build the application for production, run:
    ```bash
    npm run build
    ```

*   **Starting the server:** To start the production server, run:
    ```bash
    npm run start
    ```

*   **Linting:** To lint the code, run:
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Styling:** The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS.
*   **Firebase:** Firebase is initialized in `src/lib/firebase.ts`. All Firebase-related code should be kept in the `src/lib` directory.
*   **Components:** Components are located in the `src/app` directory. The main page is `src/app/page.tsx`.
*   **Linting:** The project uses ESLint for code quality. It is recommended to run the linter before committing any changes.
