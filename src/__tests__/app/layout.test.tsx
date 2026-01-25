import { metadata } from '@/app/layout';

describe('Root Layout Metadata', () => {
  it('has the correct app title', () => {
    expect(metadata.title).toBe('Mr Chef');
  });

  it('has a relevant description', () => {
    expect(metadata.description).toBe('Restaurant management system for Mr Chef');
  });
});
