import{defineConfig}from'@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:45_000,
  expect:{timeout:10_000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{outputFolder:'playwright-report',open:'never'}]]:'list',
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure'
  },
  projects:[
    {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
    {name:'mobile-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
  ],
  webServer:{
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/index.html',
    reuseExistingServer:!process.env.CI,
    timeout:30_000
  }
});
