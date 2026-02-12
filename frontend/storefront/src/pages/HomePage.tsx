import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Transform Your Photos into Custom Products
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload your photos, apply AI cartoonification, and get them printed on custom products
              delivered to your door.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/products">
                <Button size="lg">Browse Products</Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Product</h3>
              <p className="text-muted-foreground">
                Select from our range of customizable products including t-shirts, mugs, and posters.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload & Customize</h3>
              <p className="text-muted-foreground">
                Upload your photo and apply AI cartoonification to create a unique design.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Receive Your Order</h3>
              <p className="text-muted-foreground">
                We print and ship your custom product directly to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Create your first custom product today
          </p>
          <Link to="/products">
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
