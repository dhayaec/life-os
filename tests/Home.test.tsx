import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders the starter heading', () => {
    render(<Home />);
    expect(screen.getByText(/To get started, edit the page\.tsx file\./i)).toBeInTheDocument();
  });
});
