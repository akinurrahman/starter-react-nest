import { Button } from '@/components/ui/button';

const VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const;

const SIZES = ['xs', 'sm', 'default', 'lg'] as const;

export function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Starter</h1>
      <p className="mt-2 text-muted-foreground">Theme check</p>

      <section className="mt-8 space-y-4">
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {variant} {size}
              </Button>
            ))}
            <Button variant={variant} disabled>
              {variant} disabled
            </Button>
          </div>
        ))}
      </section>
    </main>
  );
}
