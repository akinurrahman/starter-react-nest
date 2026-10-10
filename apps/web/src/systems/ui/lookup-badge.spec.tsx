import { render, screen } from '@testing-library/react';
import { Check } from 'lucide-react';
import { createLookup } from '@/lib/lookup/create-lookup';
import { LookupBadge } from './lookup-badge';

const statusLookup = createLookup(
  {
    active: { label: 'Active', badgeVariant: 'success', icon: Check },
    draft: { label: 'Draft' },
  },
  'Status',
);

describe('LookupBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the label with the variant and icon', () => {
    render(<LookupBadge lookup={statusLookup} value="active" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveClass('bg-success/15', 'text-success');
    expect(badge.querySelector('svg')).not.toBeNull();
  });

  it('leaves the icon out when showIcon is false', () => {
    render(
      <LookupBadge lookup={statusLookup} value="active" showIcon={false} />,
    );

    expect(screen.getByText('Active').querySelector('svg')).toBeNull();
  });

  it('uses the default variant when the entry has none', () => {
    render(<LookupBadge lookup={statusLookup} value="draft" />);

    expect(screen.getByText('Draft')).toHaveClass('bg-primary');
  });

  it.each([null, undefined, ''])('renders nothing for %o', (value) => {
    const { container } = render(
      <LookupBadge lookup={statusLookup} value={value} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unknown value', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <LookupBadge lookup={statusLookup} value="deleted" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
