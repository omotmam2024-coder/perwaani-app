import { render, screen } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  // jsdom has no matchMedia; the theme switch asks for it.
  window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});

beforeEach(() => localStorage.clear());

test('a visitor who is not signed in sees the sign-in screen with the company logo', () => {
  render(<App />);
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByAltText(/perwaani/i)).toHaveAttribute('src', expect.stringContaining('logo.png'));
});
