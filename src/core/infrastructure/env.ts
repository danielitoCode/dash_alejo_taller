export const ENV = {
    appwriteEndpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    appwriteProjectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    adminFunctionUsers: import.meta.env.VITE_APPWRITE_USERS_FUNCTION,
    storageBucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    googleAuthUrl: import.meta.env.VITE_GOOGLE_AUTH_URL,
    passwordResetUrl: import.meta.env.VITE_PASSWORD_RESET_URL,
    infraStatusUrl: import.meta.env.VITE_INFRA_STATUS_URL,
    appwriteConsoleUrl: import.meta.env.VITE_APPWRITE_CONSOLE_URL,
    renderConsoleUrl: import.meta.env.VITE_RENDER_CONSOLE_URL,
    cloudflareConsoleUrl: import.meta.env.VITE_CLOUDFLARE_CONSOLE_URL,
    pulseBaseUrl: import.meta.env.VITE_ALSET_PULSE_BASE_URL,
    pulseApiKey: import.meta.env.VITE_ALSET_PULSE_API_KEY,
    pulseSupportMessagesPath: import.meta.env.VITE_ALSET_PULSE_SUPPORT_MESSAGES_PATH,
    pusherAppId: import.meta.env.VITE_PUSHER_APP_ID,
    pusherSecrets: import.meta.env.VITE_PUSHER_SECRETS,
    pusherKey: import.meta.env.VITE_PUSHER_KEY,
    pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER,
    pusherSupportChannel: import.meta.env.VITE_PUSHER_SUPPORT_CHANNEL,
    pusherStockChannel: import.meta.env.VITE_PUSHER_STOCK_CHANNEL,
    pusherSalesChannel: import.meta.env.VITE_PUSHER_SALES_CHANNEL,
    pusherPromoChannel: import.meta.env.VITE_PUSHER_PROMO_CHANNEL,
    pusherNotificationChannel: import.meta.env.VITE_PUSHER_NOTIFICATION_CHANNEL,
    pusherIaChannel: import.meta.env.VITE_PUSHER_IA_CHANNEL,
    directorioCubanoApiUrl:
        import.meta.env.VITE_DIRECTORIO_CUBANO_API_URL ||
        "https://widgets.directoriocubano.info/api/tasas",

    authProvider: import.meta.env.VITE_AUTH_PROVIDER as string | undefined,

    /** Clerk — único IdP del panel Core6 */
    clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined,

    /** appwrite | turso */
    dataProvider: import.meta.env.VITE_DATA_PROVIDER as string | undefined,
    tursoUrl: import.meta.env.VITE_TURSO_URL as string | undefined,
    tursoAuthToken: import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined,

    filesProvider: import.meta.env.VITE_FILES_PROVIDER as string | undefined,
    cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
    cloudinaryPresetProducts: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PRODUCTS as
        | string
        | undefined,
    cloudinaryPresetAvatars: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS as
        | string
        | undefined,

    adminSubjects: import.meta.env.VITE_ADMIN_SUBJECTS as string | undefined,
    adminEmails: import.meta.env.VITE_ADMIN_EMAILS as string | undefined,
};

export function parseCsvEnv(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}
