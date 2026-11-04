import { test,expect } from '@playwright/test';
test('explique le blocage quand le manifeste est absent',async({page})=>{
 await page.route('**/assets/manifest.json',route=>route.fulfill({status:404,body:'Absent'}));
 await page.goto('/');
 await expect(page.getByText('Assets requis',{exact:true})).toBeVisible();
 await expect(page.getByText(/Manifeste absent/)).toBeVisible();
 await expect(page.locator('canvas')).toHaveCount(0);
});
