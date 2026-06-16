import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-porcelain/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-display text-xl font-semibold text-mocha mb-2">Glaze</p>
            <p className="text-sm text-mocha/60 leading-relaxed">
              Студия маникюра и педикюра.<br />Красота в каждой детали.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Услуги</p>
            <ul className="space-y-2 text-sm text-mocha/70">
              <li><Link href="/services" className="hover:text-mocha transition-colors">Маникюр</Link></li>
              <li><Link href="/services" className="hover:text-mocha transition-colors">Педикюр</Link></li>
              <li><Link href="/services" className="hover:text-mocha transition-colors">Дизайн</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Студия</p>
            <ul className="space-y-2 text-sm text-mocha/70">
              <li><Link href="/masters" className="hover:text-mocha transition-colors">Мастера</Link></li>
              <li><Link href="/booking" className="hover:text-mocha transition-colors">Запись</Link></li>
              <li><Link href="/login" className="hover:text-mocha transition-colors">Войти</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-mocha/40">© {new Date().getFullYear()} Glaze Studio</p>
          <p className="text-xs text-mocha/40">Онлайн-запись 24/7</p>
        </div>
      </div>
    </footer>
  );
}
