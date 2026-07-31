import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders the landing heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /LifeOS/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open dashboard/i })).toBeInTheDocument();
  });
});
