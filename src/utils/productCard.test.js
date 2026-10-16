import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductCardData, formatProductPrice } from './productCard.js';

test('keeps actual price precision and only shows a genuine higher original price', () => {
  const card = getProductCardData({ salePrice: '24143.01', mrp: 25000 });
  assert.equal(card.price, 24143.01);
  assert.equal(card.originalPrice, 25000);
  assert.equal(formatProductPrice(card.price), '₹24,143.01');
  assert.equal(getProductCardData({ price: 100, mrp: 90 }).originalPrice, null);
  assert.equal(getProductCardData({}).price, null);
});

test('excludes videos and internal ERP media and deduplicates images', () => {
  const card = getProductCardData({ images: [
    { url: 'https://cdn.test/video', mediaType: 'video' },
    'https://cdn.test/movie.mp4', 'https://ftp.test/image.jpg',
    'https://cdn.test/ring.webp', { url: 'https://cdn.test/ring.webp' },
  ] });
  assert.deepEqual(card.images, ['https://cdn.test/ring.webp']);
});

test('uses real colour metadata and associated images without exposing raw IDs', () => {
  const card = getProductCardData({
    metalColors: ['507f1f77bcf86cd799439011', { name: 'Rose Gold', hex: '#cc9999' }, null],
    colorImages: [{ metalColorId: { name: 'Rose Gold', hex: '#cc9999' }, images: [{ url: 'rose.webp' }] }, { metalColor: null }],
  });
  assert.deepEqual(card.colors, [{ name: 'Rose Gold', hex: '#cc9999', image: 'rose.webp' }]);
  assert.deepEqual(getProductCardData({}).colors, []);
});
