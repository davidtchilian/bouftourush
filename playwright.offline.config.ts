import {defineConfig} from '@playwright/test';
import {prepareBrowserAccount,testAccountFile} from './scripts/browser-auth';
prepareBrowserAccount();
export default defineConfig({testDir:'tests/offline',timeout:60000,globalSetup:'./tests/browser-setup.ts',use:{baseURL:'http://127.0.0.1:4174',storageState:'.local-auth/browser-state.json',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}},webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',url:'http://127.0.0.1:4174/login',reuseExistingServer:false,env:{AUTH_DATABASE_FILE:testAccountFile}}});
