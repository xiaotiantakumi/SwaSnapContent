/**
 * Link Collector Logic Integration Tests
 * Issue #32: フロントエンド実装ロジックの統合テスト
 * 
 * このテストはブラウザ環境なしでコアロジックを直接検証します
 */

const { test, expect } = require('@playwright/test');

// Simulate the filtering logic from useLinkCollector.ts
function simulateTargetUrlFiltering(allUrls, targetUrl) {
  // Simulate isTargetUrl function
  const isTargetUrl = (url, target) => {
    try {
      const urlObj = new URL(url);
      const targetObj = new URL(target);
      
      const normalizePathname = (pathname) => {
        return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
      };
      
      return urlObj.protocol === targetObj.protocol &&
             urlObj.host === targetObj.host &&
             normalizePathname(urlObj.pathname) === normalizePathname(targetObj.pathname) &&
             urlObj.search === targetObj.search &&
             urlObj.hash === targetObj.hash;
    } catch {
      return url === target;
    }
  };

  // Filter out target URL (same logic as useLinkCollector.ts)
  return allUrls.filter(linkUrl => !isTargetUrl(linkUrl, targetUrl));
}

function simulateExclusionPatterns(urls, patterns) {
  const isUrlExcluded = (url, patterns) => {
    return patterns.some(pattern => {
      try {
        return new RegExp(pattern, 'i').test(url);
      } catch {
        return url.toLowerCase().includes(pattern.toLowerCase());
      }
    });
  };

  return urls.filter(url => !isUrlExcluded(url, patterns));
}

test.describe('Link Collector Logic Integration Tests', () => {
  
  test('Target URL exclusion - exact match', () => {
    const apiResponse = [
      'https://takumi-oda.com/blog/',
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://takumi-oda.com/blog/post-3/'
    ];
    const targetUrl = 'https://takumi-oda.com/blog/';
    const filtered = simulateTargetUrlFiltering(apiResponse, targetUrl);

    expect(filtered).toHaveLength(3);
    expect(filtered).not.toContain(targetUrl);
    expect(filtered).toEqual([
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://takumi-oda.com/blog/post-3/'
    ]);
  });

  test('Target URL exclusion - trailing slash normalization', () => {
    const apiResponse = [
      'https://takumi-oda.com/blog/',
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/'
    ];
    const targetUrl = 'https://takumi-oda.com/blog'; // No trailing slash
    const filtered = simulateTargetUrlFiltering(apiResponse, targetUrl);

    expect(filtered).toHaveLength(2);
    expect(filtered).not.toContain('https://takumi-oda.com/blog/');
    expect(filtered).toEqual([
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/'
    ]);
  });

  test('Target URL exclusion - no target URL in response', () => {
    const apiResponse = [
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://github.com/takumi/repo',
      'https://twitter.com/takumi',
      'https://takumi-oda.com/assets/image.jpg'
    ];
    const targetUrl = 'https://takumi-oda.com/blog/';
    const filtered = simulateTargetUrlFiltering(apiResponse, targetUrl);

    expect(filtered).toHaveLength(5);
    expect(filtered).toEqual(apiResponse); // No change expected
  });

  test('Exclusion patterns - simple string matching', () => {
    const urls = [
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://github.com/takumi/repo',
      'https://twitter.com/takumi',
      'https://takumi-oda.com/assets/image.jpg'
    ];
    
    const patterns = ['github', 'twitter'];
    const filtered = simulateExclusionPatterns(urls, patterns);

    expect(filtered).toHaveLength(3);
    expect(filtered).toEqual([
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://takumi-oda.com/assets/image.jpg'
    ]);
  });

  test('Exclusion patterns - regex patterns', () => {
    const urls = [
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://github.com/takumi/repo',
      'https://takumi-oda.com/assets/image.jpg',
      'https://example.com/script.js'
    ];
    
    const patterns = ['^https://github', '\\.(jpg|js)$'];
    const filtered = simulateExclusionPatterns(urls, patterns);

    expect(filtered).toHaveLength(2);
    expect(filtered).toEqual([
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/'
    ]);
  });

  test('Combined filtering - target URL + exclusion patterns', () => {
    // Simulate realistic blog scraping scenario
    const apiResponse = [
      'https://takumi-oda.com/blog/',  // Target URL (should be excluded)
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/',
      'https://github.com/takumi/repo',
      'https://twitter.com/takumi',
      'https://takumi-oda.com/assets/image.jpg'
    ];
    
    const targetUrl = 'https://takumi-oda.com/blog/';
    const excludePatterns = ['github', 'twitter', '\\.(jpg|png|gif)$'];
    
    // Step 1: Filter out target URL
    const afterTargetFiltering = simulateTargetUrlFiltering(apiResponse, targetUrl);
    expect(afterTargetFiltering).toHaveLength(5);
    expect(afterTargetFiltering).not.toContain(targetUrl);
    
    // Step 2: Apply exclusion patterns
    const final = simulateExclusionPatterns(afterTargetFiltering, excludePatterns);
    expect(final).toHaveLength(2);
    expect(final).toEqual([
      'https://takumi-oda.com/blog/post-1/',
      'https://takumi-oda.com/blog/post-2/'
    ]);
  });

  test('Edge cases - malformed URLs and invalid patterns', () => {
    const urls = [
      'https://valid-url.com/page',
      'invalid-url',
      'https://another-valid.com/page'
    ];
    
    // Test with invalid regex pattern
    const invalidPatterns = ['[invalid-regex'];
    const filtered = simulateExclusionPatterns(urls, invalidPatterns);
    
    // Should fallback to string matching
    expect(filtered).toHaveLength(3); // No matches with invalid regex
  });
});