import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders with hint text', () => {
      render(<Input hint="Must be a valid email" />);
      expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('hides hint when error is displayed', () => {
      render(<Input hint="Helpful hint" error="Error message" />);
      expect(screen.queryByText('Helpful hint')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Error styling', () => {
    it('applies error border color when error is present', () => {
      render(<Input error="Invalid" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle({ border: '1px solid #ef4444' });
    });

    it('applies default border color when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveStyle({ border: '1px solid #d1d5db' });
    });

    it('displays error in red color', () => {
      render(<Input error="Error text" />);
      const error = screen.getByRole('alert');
      expect(error).toHaveStyle({ color: '#ef4444' });
    });
  });

  describe('Password toggle', () => {
    it('renders password toggle button for password type', () => {
      render(<Input type="password" passwordToggle />);
      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    });

    it('does not render toggle button when passwordToggle is false', () => {
      render(<Input type="password" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render toggle button for non-password types', () => {
      render(<Input type="text" passwordToggle />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<Input type="password" passwordToggle />);

      const input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: 'Show password' }));
      expect(input).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(input).toHaveAttribute('type', 'password');
    });

    it('shows correct button text based on visibility state', async () => {
      const user = userEvent.setup();
      render(<Input type="password" passwordToggle />);

      expect(screen.getByText('show')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));
      expect(screen.getByText('hide')).toBeInTheDocument();
    });
  });

  describe('User input', () => {
    it('handles value changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={onChange} />);
      await user.type(screen.getByRole('textbox'), 'test');

      expect(onChange).toHaveBeenCalled();
    });

    it('displays typed value', async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.type(screen.getByRole('textbox'), 'hello');
      expect(screen.getByRole('textbox')).toHaveValue('hello');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input via htmlFor', () => {
      render(<Input label="Username" />);
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });

    it('error has alert role for accessibility', () => {
      render(<Input error="Required field" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('password toggle has appropriate aria-label', async () => {
      const user = userEvent.setup();
      render(<Input type="password" passwordToggle />);

      expect(screen.getByLabelText('Show password')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });
  });

  describe('Custom styles', () => {
    it('merges custom styles with default styles', () => {
      render(<Input style={{ marginLeft: '10px' }} />);
      const input = screen.getByRole('textbox');
      expect(input.style.marginLeft).toBe('10px');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional HTML attributes', () => {
      render(<Input data-testid="email-input" maxLength={50} />);
      const input = screen.getByTestId('email-input');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('supports disabled state', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('supports required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });
});
