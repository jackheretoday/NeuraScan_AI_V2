import { motion } from 'framer-motion';
import { Users, Stethoscope, AlertTriangle, Search } from 'lucide-react';

const problems = [
  {
    icon: Users,
    value: '55M+',
    label: 'Global Dementia Burden',
    description: 'Over 55 million people worldwide live with dementia, with 10 million new cases annually.',
    color: '#1a5fa8',
  },
  {
    icon: Stethoscope,
    value: '1:10,000',
    label: 'India Neurologist Ratio',
    description: 'India has only 1 neurologist per 10,000 patients, creating a massive diagnostic gap.',
    color: '#0d9488',
  },
  {
    icon: AlertTriangle,
    value: '75%',
    label: 'Late Diagnosis Rate',
    description: 'Three-quarters of dementia cases go undiagnosed until moderate or severe stages.',
    color: '#f59e0b',
  },
  {
    icon: Search,
    value: '8.5M',
    label: 'AI-Interpretable Scans',
    description: 'Millions of MRI scans annually could benefit from AI-assisted interpretation to accelerate diagnosis.',
    color: '#14b8a6',
  },
];

export function ProblemSection() {
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
            The Neurological Care Crisis
          </h2>
          <p className="text-text-secondary mt-4 max-w-2xl mx-auto text-lg">
            Healthcare systems worldwide face an unprecedented challenge in diagnosing and managing neurological disorders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-border hover:border-medical-200 transition-colors bg-white"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${problem.color}10` }}
              >
                <problem.icon size={24} style={{ color: problem.color }} />
              </div>
              <p className="text-3xl font-extrabold text-text-primary mb-1">{problem.value}</p>
              <p className="text-sm font-semibold text-text-secondary mb-2">{problem.label}</p>
              <p className="text-xs text-text-tertiary leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
