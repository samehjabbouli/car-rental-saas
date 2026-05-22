export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Car Rental SaaS</h1>
        <p className="text-muted-foreground mb-8">جاري التحويل...</p>
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(function() {
            window.location.href = '/login';
          }, 100);
        `}} />
      </div>
    </div>
  );
}