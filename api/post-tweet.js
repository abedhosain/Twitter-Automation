import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

export const dynamic = "force-dynamic";

const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";

let browser;

async function getBrowser() {
  if (browser) return browser;

  if (process.env.VERCEL_ENV === "production") {
    browser = await puppeteerCore.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(remoteExecutablePath),
      headless: true,
    });
  } else {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
  }
  return browser;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function loginAndTweet(username, password, tweetText) {
  console.log('🎬 Starting Twitter (X) Automation');
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Hide automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  try {
    console.log('🚀 Starting Twitter automation...');

    // Navigate to Twitter login page
    console.log('🐦 Navigating to X (Twitter) login page...');
    await page.goto('https://x.com/i/flow/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await delay(3000);

    // Find username input
    console.log('⏳ Waiting for username/email input field...');
    const usernameSelectors = [
      'input[name="text"]',
      'input[autocomplete="username"]',
      'input[data-testid="ocfEnterTextTextInput"]',
      'input[type="text"]'
    ];

    let usernameInput = null;
    for (const selector of usernameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        usernameInput = selector;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!usernameInput) {
      throw new Error('Could not find username input field');
    }

    console.log('✍️ Entering username/email...');
    await page.type(usernameInput, username, { delay: 100 });

    console.log('🖱️ Clicking "Next"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
      const nextButton = buttons.find(btn => 
        btn.innerText && btn.innerText.trim().toLowerCase() === 'next'
      );
      if (nextButton) {
        nextButton.click();
        return true;
      }
      return false;
    });

    await delay(2000);

    // Handle potential username confirmation
    console.log('⏳ Waiting for password input field...');
    try {
      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    } catch (e) {
      console.log('🤔 Twitter might be asking for username confirmation...');
      
      const confirmationSelectors = [
        'input[data-testid="ocfEnterTextTextInput"]',
        'input[placeholder*="username"]',
        'input[placeholder*="phone"]',
        'input[placeholder*="email"]'
      ];

      for (const selector of confirmationSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.type(selector, username, { delay: 50 });
          
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
            const nextButton = buttons.find(btn => 
              btn.innerText && btn.innerText.trim().toLowerCase() === 'next'
            );
            if (nextButton) nextButton.click();
          });
          
          await delay(2000);
          break;
        } catch (error) {
          continue;
        }
      }

      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    }

    console.log('✍️ Entering password...');
    await page.type('input[name="password"]', password, { delay: 100 });

    console.log('🔐 Clicking "Log in"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
      const loginButton = buttons.find(btn => 
        btn.innerText && (
          btn.innerText.trim().toLowerCase() === 'log in' ||
          btn.innerText.trim().toLowerCase() === 'sign in' ||
          btn.innerText.trim().toLowerCase() === 'login'
        )
      );
      if (loginButton) {
        loginButton.click();
        return true;
      }
      return false;
    });

    console.log('⏳ Waiting for login to complete...');
    
    // Wait for home page
    const homeSelectors = [
      '[data-testid="tweetTextarea_0"]',
      '[data-testid="tweetButton"]',
      '[aria-label="Post text"]',
      'div[role="textbox"]'
    ];

    let homeLoaded = false;
    for (const selector of homeSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 20000 });
        homeLoaded = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!homeLoaded) {
      throw new Error('Could not confirm home page loaded');
    }

    console.log('✅ Login successful!');
    await delay(2000);

    // Compose tweet
    console.log('✍️ Starting tweet composition...');
    
    const tweetSelectors = [
      '[data-testid="tweetTextarea_0"]',
      '[aria-label="Post text"]',
      'div[role="textbox"]'
    ];

    let tweetInputSelector = null;
    for (const selector of tweetSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        tweetInputSelector = selector;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!tweetInputSelector) {
      throw new Error('Could not find tweet input field');
    }

    await page.click(tweetInputSelector);
    await delay(500);

    // Clear existing content
    await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      if (input) {
        input.textContent = '';
        input.innerHTML = '';
        input.focus();
      }
    }, tweetInputSelector);
    
    await delay(500);
    
    // Type tweet text
    console.log('✍️ Typing tweet text...');
    for (let i = 0; i < tweetText.length; i++) {
      await page.keyboard.type(tweetText[i], { delay: 50 });
      
      if (i % 10 === 0) {
        await page.evaluate((selector) => {
          const input = document.querySelector(selector);
          if (input) {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, tweetInputSelector);
      }
    }
    
    console.log('✅ Tweet text typed successfully');
    await delay(2000);

    // Click Post button
    console.log('🖱️ Looking for Post button...');
    
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('[data-testid="tweetButton"]');
      for (const button of buttons) {
        const style = getComputedStyle(button);
        const bgColor = style.backgroundColor;
        if (bgColor.includes('29, 155, 240') || bgColor.includes('15, 20, 25')) {
          return true;
        }
      }
      return false;
    }, { timeout: 10000 });

    const postButtonClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('[data-testid="tweetButton"]');
      for (const button of buttons) {
        const style = getComputedStyle(button);
        const bgColor = style.backgroundColor;
        if (bgColor.includes('29, 155, 240') || bgColor.includes('15, 20, 25')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    if (!postButtonClicked) {
      throw new Error('Could not find enabled Post button');
    }

    console.log('✅ Post button clicked!');
    await delay(3000);

    // Wait for confirmation
    try {
      await Promise.race([
        page.waitForSelector('div[data-testid="toast"]', { timeout: 10000 }),
        page.waitForFunction(() => {
          const tweetArea = document.querySelector('[data-testid="tweetTextarea_0"]');
          return !tweetArea || tweetArea.textContent === '';
        }, { timeout: 10000 })
      ]);
      
      console.log('✅ Tweet posted successfully!');
    } catch (error) {
      console.log('⚠️ Could not confirm tweet posting, but likely successful');
    }

    await delay(2000);
    
    return {
      success: true,
      message: 'Tweet posted successfully',
      tweetUrl: page.url()
    };

  } catch (error) {
    console.error('❌ Twitter posting failed:', error);
    return res.status(500).json({ 
      error: 'Failed to post tweet: ' + error.message,
      success: false 
    });
  }
}
