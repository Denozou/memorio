import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('renders with default primary variant', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      // Check that the style attribute contains the expected values
      expect(button.style.background).toBe('rgb(37, 99, 235)');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.style.background).toBe('rgb(243, 244, 246)');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.style.background).toBe('transparent');
    });

    it('renders full width when full prop is true', () => {
      render(<Button full>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ width: '100%' });
    });
  });

  describe('Loading state', () => {
    it('shows ellipsis when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('…');
    });

    it('is disabled when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has reduced opacity when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ opacity: '0.6' });
    });

    it('has not-allowed cursor when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('Disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has reduced opacity when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ opacity: '0.6' });
    });

    it('has not-allowed cursor when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  describe('Click handling', () => {
    it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={onClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={onClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<Button loading onClick={onClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Mouse interactions', () => {
    it('scales down on mouse down', () => {
      render(<Button>Press</Button>);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      expect(button).toHaveStyle({ transform: 'scale(0.98)' });
    });

    it('scales back up on mouse up', () => {
      render(<Button>Press</Button>);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);
      expect(button).toHaveStyle({ transform: 'scale(1)' });
    });

    it('calls custom onMouseDown handler', () => {
      const onMouseDown = vi.fn();
      render(<Button onMouseDown={onMouseDown}>Press</Button>);

      fireEvent.mouseDown(screen.getByRole('button'));
      expect(onMouseDown).toHaveBeenCalled();
    });

    it('calls custom onMouseUp handler', () => {
      const onMouseUp = vi.fn();
      render(<Button onMouseUp={onMouseUp}>Press</Button>);

      fireEvent.mouseUp(screen.getByRole('button'));
      expect(onMouseUp).toHaveBeenCalled();
    });
  });

  describe('Custom styles', () => {
    it('merges custom styles with default styles', () => {
      render(<Button style={{ marginTop: '20px' }}>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ marginTop: '20px' });
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional HTML attributes', () => {
      render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
