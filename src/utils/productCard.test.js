import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductCardData, formatProductPrice } from './productCard.js';

test('keeps actual price precision and only shows a genuine higher original price', () => {
  const card = getProductCardData({ salePrice: '24143.01', mrp: 25000 });
  assert.equal(card.price, 24143.01);
  assert.equal(card.originalPrice, 25000);
  assert.equal(formatProductPrice(card.price), '₹24,143.01');
  assert.equal(getProductCardData({ price: 100, mrp: 90 }).originalPrice, null);
  assert.equal(getProductCardData({ productType: 'gold', salePrice: 50000, mrp: 60000 }).originalPrice, null);
  assert.equal(getProductCardData({ title: 'Gold Ring', salePrice: 50000, mrp: 60000 }).originalPrice, null);
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
    colorImages: [{ metalColorId: { name: 'Rose Gold', hex: '#cc9999' }, images: [{ url: 'rose.webp' }] }, { metalColorId: null }],
  });
  assert.deepEqual(card.colors, [{ name: 'Rose Gold', hex: '#cc9999', image: 'rose.webp' }]);
  assert.deepEqual(getProductCardData({}).colors, []);
});

test('associates metalcolor-wise 1st image for each color swatch', () => {
  const card = getProductCardData({
    metalColors: [
      { name: 'Yellow Gold', colorCode: '#E5C07B', firstPhoto: 'yellow-1.webp' },
      { name: 'White Gold', colorCode: '#F3F4F6', firstPhoto: 'white-1.webp' },
      { name: 'Rose Gold', colorCode: '#E8B4B8', firstPhoto: 'rose-1.webp' },
    ],
    colorImages: [
      { metalColorId: { name: 'Yellow Gold' }, firstPhoto: 'yellow-1.webp', images: [{ url: 'yellow-1.webp' }, { url: 'yellow-2.webp' }] },
      { metalColorId: { name: 'White Gold' }, firstPhoto: 'white-1.webp', images: [{ url: 'white-1.webp' }, { url: 'white-2.webp' }] },
      { metalColorId: { name: 'Rose Gold' }, firstPhoto: 'rose-1.webp', images: [{ url: 'rose-1.webp' }, { url: 'rose-2.webp' }] },
    ],
  });
  assert.equal(card.colors.length, 3);
  assert.equal(card.colors[0].image, 'yellow-1.webp');
  assert.equal(card.colors[1].image, 'white-1.webp');
  assert.equal(card.colors[2].image, 'rose-1.webp');
});

