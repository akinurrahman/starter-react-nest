import { render, screen } from '@testing-library/react';
import { App } from './app';

describe('App', () => {
  it('renders the page heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Starter' }),
    ).toBeInTheDocument();
  });
});
