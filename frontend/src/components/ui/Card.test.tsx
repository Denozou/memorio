import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent } from './Card';

describe('Card', () => {
  describe('Card component', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Card>
          <span data-testid="content">Content</span>
        </Card>
      );
      const card = screen.getByTestId('content').parentElement;
      expect(card).toHaveStyle({
        borderRadius: '16px',
        padding: '16px',
        background: 'white',
      });
    });

    it('merges custom styles with default styles', () => {
      render(
        <Card style={{ marginBottom: '20px', background: 'gray' }}>
          <span data-testid="content">Content</span>
        </Card>
      );
      const card = screen.getByTestId('content').parentElement;
      expect(card).toHaveStyle({
        marginBottom: '20px',
        background: 'gray',
      });
    });
  });

  describe('CardHeader component', () => {
    it('renders title correctly', () => {
      render(<CardHeader title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders title with subtitle', () => {
      render(<CardHeader title="Main Title" subtitle="Subtitle text" />);
      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(<CardHeader title="Only Title" />);
      expect(screen.getByText('Only Title')).toBeInTheDocument();
      expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
    });

    it('applies correct font weight to title', () => {
      render(<CardHeader title="Bold Title" />);
      const title = screen.getByText('Bold Title');
      expect(title).toHaveStyle({ fontWeight: '700' });
    });

    it('applies correct color to subtitle', () => {
      render(<CardHeader title="Title" subtitle="Gray subtitle" />);
      const subtitle = screen.getByText('Gray subtitle');
      expect(subtitle).toHaveStyle({ color: '#6b7280' });
    });
  });

  describe('CardContent component', () => {
    it('renders children correctly', () => {
      render(
        <CardContent>
          <p>Inner content</p>
        </CardContent>
      );
      expect(screen.getByText('Inner content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <CardContent>
          <p>First child</p>
          <p>Second child</p>
        </CardContent>
      );
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Full Card composition', () => {
    it('renders complete card with header and content', () => {
      render(
        <Card>
          <CardHeader title="Dashboard" subtitle="Overview" />
          <CardContent>
            <p>Statistics</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });
  });
});
