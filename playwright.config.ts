import { defineConfig } from '@playwright/test';
export default defineConfig({timeout:60000,testDir:'tests/browser',webServer:{command:'npm run dev -- --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},use:{baseURL:'http://127.0.0.1:4173'}});
