import { motion } from 'framer-motion';
import {
  Brain, Activity, Clock, TrendingUp, Search, FileText, Monitor, Shield,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'MRI Disease Classification',
    description: 'Multi-class dementia staging from structural MRI using deep CNNs with 94.2% accuracy.',
    benefit: 'Detect dementia stages earlier and more consistently.',
    color: '#1a5fa8',
  },
  {
    icon: Activity,
    title: 'MCI Conversion Prediction',
    description: '24-month Alzheimer\'s conversion risk using multimodal biomarkers and ML ensembles.',
    benefit: 'Enable early intervention to delay progression by 12-18 months.',
    color: '#0d9488',
  },
  {
    icon: Clock,
    title: 'Brain Age Estimation',
    description: 'NeuroScore™ quantifies brain-predicted age to detect pathological aging before symptoms.',
    benefit: 'Detect accelerated aging 3-5 years before clinical onset.',
    color: '#14b8a6',
  },
  {
    icon: TrendingUp,
    title: 'Longitudinal Monitoring',
    description: 'Automated tracking of cognitive scores, brain volumes, and risk trajectories over time.',
    benefit: 'Reduce follow-up workload by 60% with quantitative metrics.',
    color: '#22c55e',
  },
  {
    icon: Search,
    title: 'Explainable AI',
    description: 'SHAP & Grad-CAM highlight brain regions and biomarkers driving every prediction.',
    benefit: 'Build clinician trust with neurology-aligned explanations.',
    color: '#f59e0b',
  },
  {
    icon: FileText,
    title: 'Clinical Reporting',
    description: 'Auto-generated RSNA/IHE-compliant reports with findings, recommendations, and visualizations.',
    benefit: 'Reduce reporting time by 70% with consistent documentation.',
    color: '#f97316',
  },
  {
    icon: Monitor,
    title: 'PACS / DICOM Integration',
    description: 'Seamless integration with existing hospital PACS, DICOM, FHIR, and HL7 workflows.',
    benefit: 'Deploy within existing infrastructure — no additional hardware.',
    color: '#8b5cf6',
  },
  {
    icon: Shield,
    title: 'Audit & Compliance',
    description: 'Comprehensive audit trails with HIPAA/GDPR compliance for regulatory requirements.',
    benefit: 'Satisfy FDA, CE, and CDSCO regulatory standards.',
    color: '#ec4899',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">
            Enterprise-Grade Clinical Intelligence
          </h2>
          <p className="text-text-secondary mt-4 max-w-2xl mx-auto text-lg">
            Every feature is built for real clinical deployment — from radiologist workflows to regulatory compliance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="medical-card p-6 group cursor-default"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:scale-110 transition-transform duration-200"
                style={{ background: `${feature.color}10` }}
              >
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">{feature.description}</p>
              <div className="text-xs font-semibold" style={{ color: feature.color }}>
                {feature.benefit}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
