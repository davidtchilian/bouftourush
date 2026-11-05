import {defineConfig} from '@playwright/test';
import {prepareBrowserAccount,testAccountFile} from './scripts/browser-auth';
prepareBrowserAccount();
export default defineConfig({timeout:60000,testDir:'tests/browser',globalSetup:'./tests/browser-setup.ts',webServer:{command:'npm run dev -- --port 4173 --strictPort',url:'http://127.0.0.1:4173/login',reuseExistingServer:false,env:{AUTH_DATABASE_FILE:testAccountFile}},use:{baseURL:'http://127.0.0.1:4173',storageState:'.local-auth/browser-state.json',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}}});
