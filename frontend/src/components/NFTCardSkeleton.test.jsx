import { render, screen } from '@testing-library/react';
import NFTCardSkeleton from './NFTCardSkeleton';

describe('NFTCardSkeleton', () => {
  it('renders skeleton cards with default count of 3', () => {
    render(<NFTCardSkeleton />);
    const cards = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'div' && 
             element.getAttribute('style')?.includes('border: 1px solid #334155');
    });
    expect(cards).toHaveLength(3);
  });

  it('renders skeleton cards with custom count', () => {
    render(<NFTCardSkeleton count={5} />);
    const cards = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'div' && 
             element.getAttribute('style')?.includes('border: 1px solid #334155');
    });
    expect(cards).toHaveLength(5);
  });

  it('renders skeleton cards with count of 1', () => {
    render(<NFTCardSkeleton count={1} />);
    const cards = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'div' && 
             element.getAttribute('style')?.includes('border: 1px solid #334155');
    });
    expect(cards).toHaveLength(1);
  });

  it('renders skeleton with zero count', () => {
    render(<NFTCardSkeleton count={0} />);
    const cards = screen.queryAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'div' && 
             element.getAttribute('style')?.includes('border: 1px solid #334155');
    });
    expect(cards).toHaveLength(0);
  });
});