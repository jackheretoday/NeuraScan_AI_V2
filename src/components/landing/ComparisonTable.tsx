import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { competitorComparison } from '@/data/mockData';

export function ComparisonTable() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
            Why NeuroScan AI?
          </h2>
          <p className="text-text-secondary mt-4 max-w-2xl mx-auto text-lg">
            Comprehensive comparison with leading neurological AI platforms.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-text-primary">Feature</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-medical-600 bg-medical-50 rounded-tl-xl rounded-tr-xl">NeuroScan AI</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-text-secondary">Qynapse</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-text-secondary">icobrain</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-text-secondary">NeuroShield</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-text-secondary">SyMRI</th>
              </tr>
            </thead>
            <tbody>
              {competitorComparison.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-border-light ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="py-3.5 px-4 text-sm font-medium text-text-primary">{row.feature}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-medical-700 bg-medical-50 px-3 py-1 rounded-full">
                      <Check size={14} className="text-medical-500" />
                      {typeof row.neuroscan === 'string' && row.neuroscan.replace('✓ ', '')}
                    </span>
                  </td>
                  {[row.qynapse, row.icobrain, row.neuroshield, row.symri].map((val, j) => (
                    <td key={j} className="py-3.5 px-4 text-center">
                      {val === '✗' ? (
                        <X size={16} className="text-red-400 mx-auto" />
                      ) : val === '✓' ? (
                        <Check size={16} className="text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-text-tertiary font-medium">{val}</span>
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
