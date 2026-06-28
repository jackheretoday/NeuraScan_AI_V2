import { Brain } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-medical-950 text-medical-300 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white p-0.5 border border-slate-200">
                <img src="/images/efcd965e-9531-4d5a-be6a-9e7247020349.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">NeuroScan AI</p>
                <p className="text-xs text-medical-400">Clinical Decision Support System v2.0</p>
              </div>
            </div>
            <p className="text-sm text-medical-400 max-w-md leading-relaxed">
              Advancing neurological care through explainable artificial intelligence. 
              Empowering clinicians with early detection, precise monitoring, and actionable insights.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Clinical Validation', 'Security', 'Pricing', 'Documentation'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-medical-400 hover:text-medical-200 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Research', 'Careers', 'Contact', 'Press Kit'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-medical-400 hover:text-medical-200 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-medical-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-medical-500">
            © 2026 NeuroScan AI. All rights reserved. Not for clinical use without supervision.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'HIPAA Notice', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="text-xs text-medical-500 hover:text-medical-300 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
