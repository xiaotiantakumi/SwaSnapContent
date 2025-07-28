/**
 * URLパターンマッチング用ユーティリティ関数のテスト
 * Issue #32: 除外パターン適用時のチェック状態管理問題とターゲットURL自動除外機能
 */

import { test, expect } from '@playwright/test';
import { 
  isUrlExcluded, 
  isTargetUrl, 
  getExcludedUrls, 
  normalizeUrl 
} from '../../app/utils/url-pattern-matching';

test.describe('URL Pattern Matching Utilities', () => {
  test.describe('isUrlExcluded', () => {
    test('should return false for empty patterns', () => {
      expect(isUrlExcluded('https://example.com/page', [])).toBe(false);
    });

    test('should match simple string patterns', () => {
      const patterns = ['github', 'twitter'];
      expect(isUrlExcluded('https://github.com/user/repo', patterns)).toBe(true);
      expect(isUrlExcluded('https://twitter.com/user', patterns)).toBe(true);
      expect(isUrlExcluded('https://example.com/page', patterns)).toBe(false);
    });

    test('should match regex patterns', () => {
      const patterns = ['^https://github\\.com', '\\.pdf$'];
      expect(isUrlExcluded('https://github.com/user/repo', patterns)).toBe(true);
      expect(isUrlExcluded('https://example.com/doc.pdf', patterns)).toBe(true);
      expect(isUrlExcluded('https://gitlab.com/user/repo', patterns)).toBe(false);
    });

    test('should handle invalid regex gracefully', () => {
      const patterns = ['[invalid regex'];
      // 無効な正規表現は文字列マッチングにフォールバック
      expect(isUrlExcluded('https://example.com/[invalid regex', patterns)).toBe(true);
      expect(isUrlExcluded('https://example.com/valid', patterns)).toBe(false);
    });

    test('should be case insensitive for string matching', () => {
      const patterns = ['GitHub'];
      expect(isUrlExcluded('https://github.com/user/repo', patterns)).toBe(true);
      expect(isUrlExcluded('https://GITHUB.com/user/repo', patterns)).toBe(true);
    });

    test('should handle multiple patterns', () => {
      const patterns = ['github', '\\.js$', '^https://api'];
      expect(isUrlExcluded('https://github.com/user/repo', patterns)).toBe(true);
      expect(isUrlExcluded('https://example.com/script.js', patterns)).toBe(true);
      expect(isUrlExcluded('https://api.example.com/data', patterns)).toBe(true);
      expect(isUrlExcluded('https://example.com/page.html', patterns)).toBe(false);
    });
  });

  test.describe('isTargetUrl', () => {
    test('should match identical URLs', () => {
      const url = 'https://example.com/page';
      expect(isTargetUrl(url, url)).toBe(true);
    });

    test('should normalize URLs for comparison', () => {
      expect(isTargetUrl('https://example.com/page/', 'https://example.com/page')).toBe(true);
      expect(isTargetUrl('https://example.com/page', 'https://example.com/page/')).toBe(true);
    });

    test('should handle different protocols', () => {
      expect(isTargetUrl('http://example.com/page', 'https://example.com/page')).toBe(false);
    });

    test('should handle invalid URLs gracefully', () => {
      expect(isTargetUrl('invalid-url', 'https://example.com')).toBe(false);
      expect(isTargetUrl('https://example.com', 'invalid-url')).toBe(false);
      expect(isTargetUrl('invalid-url', 'invalid-url')).toBe(true);
    });

    test('should handle URLs with different query parameters', () => {
      expect(isTargetUrl('https://example.com/page?a=1', 'https://example.com/page?b=2')).toBe(false);
      expect(isTargetUrl('https://example.com/page?a=1', 'https://example.com/page?a=1')).toBe(true);
    });

    test('should handle URLs with fragments', () => {
      expect(isTargetUrl('https://example.com/page#section1', 'https://example.com/page#section2')).toBe(false);
      expect(isTargetUrl('https://example.com/page#section', 'https://example.com/page#section')).toBe(true);
    });
  });

  test.describe('getExcludedUrls', () => {
    test('should return empty array for no matches', () => {
      const urls = ['https://example.com/page1', 'https://example.com/page2'];
      const patterns = ['github'];
      expect(getExcludedUrls(urls, patterns)).toEqual([]);
    });

    test('should return matching URLs', () => {
      const urls = [
        'https://github.com/user/repo',
        'https://example.com/page.pdf',
        'https://example.com/page.html'
      ];
      const patterns = ['github', '\\.pdf$'];
      const excluded = getExcludedUrls(urls, patterns);
      expect(excluded).toEqual([
        'https://github.com/user/repo',
        'https://example.com/page.pdf'
      ]);
    });

    test('should handle empty inputs', () => {
      expect(getExcludedUrls([], ['pattern'])).toEqual([]);
      expect(getExcludedUrls(['https://example.com'], [])).toEqual([]);
    });
  });

  test.describe('normalizeUrl', () => {
    test('should normalize valid URLs', () => {
      expect(normalizeUrl('https://example.com/page/')).toBe('https://example.com/page/');
      expect(normalizeUrl('https://example.com/page')).toBe('https://example.com/page');
    });

    test('should return original string for invalid URLs', () => {
      const invalidUrl = 'invalid-url';
      expect(normalizeUrl(invalidUrl)).toBe(invalidUrl);
    });

    test('should handle relative URLs by returning original', () => {
      const relativeUrl = '/path/to/page';
      expect(normalizeUrl(relativeUrl)).toBe(relativeUrl);
    });
  });

  test.describe('Real-world scenarios', () => {
    test('should handle typical blog link filtering', () => {
      const urls = [
        'https://takumi-oda.com/blog/',  // ターゲットURL
        'https://takumi-oda.com/blog/post-1',
        'https://takumi-oda.com/blog/post-2',
        'https://github.com/takumi/repo',
        'https://twitter.com/takumi',
        'https://takumi-oda.com/assets/image.jpg'
      ];
      
      const targetUrl = 'https://takumi-oda.com/blog/';
      const excludePatterns = ['github', 'twitter', '\\.(jpg|png|gif)$'];
      
      // ターゲットURL除外
      const filtered = urls.filter(url => !isTargetUrl(url, targetUrl));
      expect(filtered).toEqual([
        'https://takumi-oda.com/blog/post-1',
        'https://takumi-oda.com/blog/post-2',
        'https://github.com/takumi/repo',
        'https://twitter.com/takumi',
        'https://takumi-oda.com/assets/image.jpg'
      ]);
      
      // 除外パターン適用
      const excluded = getExcludedUrls(filtered, excludePatterns);
      expect(excluded).toEqual([
        'https://github.com/takumi/repo',
        'https://twitter.com/takumi',
        'https://takumi-oda.com/assets/image.jpg'
      ]);
      
      // 最終結果
      const final = filtered.filter(url => !isUrlExcluded(url, excludePatterns));
      expect(final).toEqual([
        'https://takumi-oda.com/blog/post-1',
        'https://takumi-oda.com/blog/post-2'
      ]);
    });
  });
});