import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Brain, ArrowRight, Bell, Shield, Activity, Clock, TrendingUp,
  Award, Lock, Search, FileText, Check, Star, Mail, MapPin, Phone,
  MessageSquare, Plus, Menu, X
} from 'lucide-react';
import { BrainCanvas } from '../components/landing/BrainCanvas';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis
} from 'recharts';

// Mock data for mini charts in Section 4
const weeklyScansData = [
  { name: 'M', value: 4 },
  { name: 'T', value: 7 },
  { name: 'W', value: 5 },
  { name: 'T', value: 9 },
  { name: 'F', value: 6 },
  { name: 'S', value: 3 },
  { name: 'S', value: 2 },
];

const patientTrendsData = [
  { month: 'Jan', value: 30 },
  { month: 'Feb', value: 45 },
  { month: 'Mar', value: 38 },
  { month: 'Apr', value: 55 },
  { month: 'May', value: 48 },
  { month: 'Jun', value: 60 },
];

export function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoNotification, setShowDemoNotification] = useState(false);
  const [demoRequested, setDemoRequested] = useState(false);

  // Contact modal states
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
    }, 1200);
  };

  const closeContactModal = () => {
    setContactModalOpen(false);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 300);
  };

  const aboutSectionRef = useRef<HTMLElement>(null);

  // Track scroll progress of the about section
  const { scrollYProgress } = useScroll({
    target: aboutSectionRef,
    offset: ["start center", "end center"]
  });

  // Track window size to make translation responsive
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Determine translation values based on viewport size
  const translationX = isMobile ? 55 : isTablet ? 130 : 210;
  const brainTranslationX = isMobile ? 85 : isTablet ? 200 : 330; // shift brain more to the right

  // Transform mappings:
  // Capsule: moves from center (x: 0) to left (x: -translationX)
  const capsuleX = useTransform(scrollYProgress, [0.1, 0.45], [0, -translationX]);
  const capsuleScale = useTransform(scrollYProgress, [0.1, 0.45], [1, isMobile ? 0.70 : 0.85]);
  const capsuleRotate = useTransform(scrollYProgress, [0.1, 0.45], [0, -8]);

  // Brain: pops up (scale: 0 -> 1.3, opacity: 0 -> 1) and moves to right (x: 0 -> brainTranslationX)
  const brainX = useTransform(scrollYProgress, [0.35, 0.7], [0, brainTranslationX]);
  const brainScale = useTransform(scrollYProgress, [0.35, 0.7], [0, isMobile ? 0.85 : 1.3]); // increased size
  const brainOpacity = useTransform(scrollYProgress, [0.35, 0.7], [0, 1]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRequestDemo = () => {
    setDemoRequested(true);
    setTimeout(() => {
      setDemoRequested(false);
      setShowDemoNotification(true);
      setTimeout(() => setShowDemoNotification(false), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f0f3f6] text-slate-800 font-sans selection:bg-medical-500 selection:text-white antialiased">

      {/* Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'py-4 bg-[#fafbfc]/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm'
          : 'py-6 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md bg-white p-0.5 border border-slate-200">
              <img src="/images/efcd965e-9531-4d5a-be6a-9e7247020349.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              NEUROSCAN<span className="text-teal-500 font-black">+</span>
            </span>
          </div>

          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-500">
            <a href="#home" className="hover:text-slate-900 transition-colors">Home</a>
            <a href="#about" className="hover:text-slate-900 transition-colors">About Us</a>
            <a href="#services" className="hover:text-slate-900 transition-colors">Services</a>
            <a href="#doctors" className="hover:text-slate-900 transition-colors">Doctors</a>
            <a href="#dashboard-preview" className="hover:text-slate-900 transition-colors">Appointments</a>
            <a href="#footer" className="hover:text-slate-900 transition-colors">Blog</a>
          </nav>

          {/* CTA Right */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setContactModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-850 rounded-full font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
            >
              Contact Us
            </button>
            <button
              onClick={handleRequestDemo}
              disabled={demoRequested}
              className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-sm"
              title="Request Demo"
            >
              <Bell size={16} className={demoRequested ? 'animate-bounce' : ''} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={handleRequestDemo}
              disabled={demoRequested}
              className="w-8.5 h-8.5 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Bell size={14} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-slate-200 bg-[#fafbfc]/95 backdrop-blur-md px-6 py-4 space-y-3"
            >
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600 hover:text-slate-900 py-1">Home</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600 hover:text-slate-900 py-1">About Us</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600 hover:text-slate-900 py-1">Services</a>
              <a href="#doctors" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600 hover:text-slate-900 py-1">Doctors</a>
              <a href="#dashboard-preview" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600 hover:text-slate-900 py-1">Appointments</a>
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setContactModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 text-white rounded-full text-xs font-bold text-center"
                >
                  Contact Us
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen pt-28 flex items-center overflow-hidden bg-[#fafbfc]">

        {/* Soft Iridescent Radial Gradients in Background (Vibrant Orange, Pink, Purple, Blue) */}
        <div className="absolute right-0 top-0 w-full lg:w-[60%] h-full pointer-events-none select-none z-0">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 85% 20%, rgba(251, 146, 60, 0.28) 0%, transparent 50%),
              radial-gradient(circle at 95% 45%, rgba(244, 63, 94, 0.32) 0%, transparent 45%),
              radial-gradient(circle at 85% 75%, rgba(147, 51, 234, 0.25) 0%, transparent 45%),
              radial-gradient(circle at 65% 90%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)
            `
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 w-full z-10">

          {/* Top Row: Heading on Left, Paragraph & Buttons on Right */}
          <div className="grid lg:grid-cols-12 gap-8 items-start mb-12">
            <div className="lg:col-span-7 space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl xl:text-[56px] font-black leading-[1.05] tracking-tight text-slate-900 font-sans"
              >
                Automated Brain MRI <br />
                Analysis & 24-Month <br />
                Conversion Prediction
              </motion.h1>
            </div>

            <div className="lg:col-span-5 lg:pt-12 space-y-6">
              <p className="text-sm text-slate-500 leading-relaxed font-semibold max-w-md">
                Explainable Clinical Decision Support (CDSS) for early neurodegenerative tracking. Leveraging state-of-the-art predictive analytics to map progression and quantify brain health gaps.
              </p>
              <div className="flex flex-wrap items-center gap-4.5">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs transition-all uppercase tracking-wider shadow"
                >
                  Launch Console
                </button>
                <a
                  href="#services"
                  className="inline-flex items-center gap-1 text-xs font-black text-slate-800 hover:text-slate-900 transition-colors uppercase tracking-wider border-b-2 border-slate-900 pb-0.5"
                >
                  Clinical Workflows
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Row: Large Image on Left, Floating Card on Right */}
          <div className="grid lg:grid-cols-12 gap-8 items-center pt-4">
            <div className="lg:col-span-7">
              <div className="relative rounded-[32px] overflow-hidden border border-slate-100 shadow-xl bg-slate-50 aspect-[16/9] w-full">
                <img
                  src="/images/hero_doctor.png"
                  alt="Doctor consulting patient"
                  className="w-full h-full object-cover grayscale brightness-95 contrast-105"
                />
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              {/* Doctor Avatar Card Floating on Right */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-[340px] rounded-[32px] p-5 bg-white/75 backdrop-blur-xl border border-white/90 shadow-2xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2">
                  {/* Doctor Avatars */}
                  <div className="flex -space-x-2.5 overflow-hidden">
                    <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white object-cover" src="/images/doctor_sarah.png" alt="Doctor Sarah" />
                    <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white object-cover" src="/images/doctor_waseem.png" alt="Doctor Waseem" />
                    <div className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">25+</div>
                  </div>

                  {/* Share button */}
                  <button className="w-8.5 h-8.5 rounded-full bg-slate-950 flex items-center justify-center text-white shadow hover:bg-slate-800 transition-colors">
                    <ArrowRight size={13} className="-rotate-45" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Explainable CDSS Support</h3>
                  <p className="text-[11px] text-slate-400 font-bold leading-normal">Empowering clinical decisions with evidence-based intelligence.</p>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 2: Democratizing Advanced Neuroimaging */}
      <section id="about" ref={aboutSectionRef} className="py-24 bg-[#fafbfc] border-t border-slate-200/50 overflow-hidden relative">
        {/* Ghost background Watermark */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-0">
          <span className="text-[12vw] font-black text-slate-100/60 tracking-[0.15em] uppercase">NEURO CDSS</span>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">

          {/* Top Row: Left Badge, Right Welcome Text */}
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5">
            </div>
            <div className="md:col-span-7">
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl md:ml-auto">
                Welcome to the future of neurological diagnostics. NeuroScan AI+ is dedicated to providing high-fidelity, explainable decision support, bridging the gap between raw DICOM scans and actionable progression models to empower physicians and enhance patient outcomes.
              </p>
            </div>
          </div>

          {/* Middle Row: Animated Capsule & 3D Brain */}
          <div className="relative w-full h-[360px] md:h-[480px] flex items-center justify-center my-6 overflow-visible">
            {/* The Capsule Image */}
            <motion.div
              style={{ x: capsuleX, scale: capsuleScale, rotate: capsuleRotate }}
              className="absolute z-20 flex items-center justify-center pointer-events-none"
            >
              <img
                src="/images/capsule_3d-removebg-preview.png"
                alt="Metallic medical capsule"
                className="w-auto h-[240px] md:h-[360px] object-contain drop-shadow-[0_25px_60px_rgba(79,70,229,0.2)]"
              />
            </motion.div>

            {/* The 3D Brain Model */}
            <motion.div
              style={{ x: brainX, scale: brainScale, opacity: brainOpacity }}
              className="absolute z-10 w-[300px] h-[300px] md:w-[460px] md:h-[460px] flex items-center justify-center"
            >
              <BrainCanvas />
            </motion.div>
          </div>

          {/* Bottom Row: Left Heading/Description, Right Button */}
          <div className="grid md:grid-cols-12 gap-8 items-end pt-4">
            <div className="md:col-span-8 space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                Democratizing Advanced Neuroimaging
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed max-w-2xl">
                Democratizing specialized neuro-imaging workflows at a target of ₹200–300 per scan across India, bringing state-of-the-art predictive support to hospital networks nationwide.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <button className="px-7 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow">
                Clinical Workflow
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Section 3: Advanced AI & CDSS Capabilities */}
      <section id="services" className="py-24 bg-[#f0f3f6] border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 space-y-12">

          {/* Title and Right-Side Subheading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
            <div className="space-y-2 max-w-lg">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Explore Our Core AI <br />
                Platform Capabilities
              </h2>
            </div>
            <div className="max-w-md">
              <p className="text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">
                <span className="text-indigo-500 font-bold">Discover quantitative neuroimaging solutions</span> tailored to clinical workflows, providing explainable diagnostics, brain health tracking, and patient conversion projections.
              </p>
            </div>
          </div>

          {/* Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">

            {/* Card 1: Dementia Severity Staging */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[390px] group">
              <div>
                <div className="w-full aspect-[16/10] rounded-[24px] overflow-hidden bg-slate-100 mb-4.5">
                  <img
                    src="/images/mental_health.png"
                    alt="Dementia Severity Staging"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Dementia Severity Staging</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  EfficientNet-B3 Dementia Staging: 4-class diagnostic severity tracking calibrated to a 97% test baseline.
                </p>
              </div>

              <a
                href="https://www.alz.org/alzheimers-dementia/stages"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 w-full cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-slate-900">Learn More</span>
                <div className="w-8.5 h-8.5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-800">
                  <ArrowRight size={13} className="-rotate-45" />
                </div>
              </a>
            </div>

            {/* Card 2: Brain Age Gap Tracking */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[390px] group">
              <div>
                <div className="w-full aspect-[16/10] rounded-[24px] overflow-hidden bg-slate-100 mb-4.5">
                  <img
                    src="/images/counseling.png"
                    alt="Brain Age Gap Tracking"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Brain Age Gap Tracking</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Brain Age Gap Biomarker: Tracking accelerated neurodegeneration via automated regional volumetric deviations.
                </p>
              </div>

              <a
                href="https://brainagecheckup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 w-full cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-slate-900">Learn More</span>
                <div className="w-8.5 h-8.5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-800">
                  <ArrowRight size={13} className="-rotate-45" />
                </div>
              </a>
            </div>

            {/* Card 3: Dual Explainable AI (XAI) */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[390px] group">
              <div>
                <div className="w-full aspect-[16/10] rounded-[24px] overflow-hidden bg-slate-100 mb-4.5">
                  <img
                    src="/images/doctor_sarah.png"
                    alt="Dual Explainable AI"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Dual Explainable AI (XAI)</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Dual Explainable AI (XAI): Combining localized Grad-CAM cortical overlays with patient-specific SHAP feature importance curves.
                </p>
              </div>

              <a
                href="https://ceur-ws.org/Vol-4017/paper_46.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4 w-full cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-slate-900">Learn More</span>
                <div className="w-8.5 h-8.5 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-800">
                  <ArrowRight size={13} className="-rotate-45" />
                </div>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: Key Healthcare Services Grid */}
      <section id="doctors" className="py-24 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">

          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Clinical Decision <br />
              Platform Metrics
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-sm">
              Quantitative baseline analytics and real-time processing indicators designed for hospital networks.
            </p>
          </div>

          {/* Grid Layout matching the screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Card A: Wide Blue/Indigo Gradient (6 Columns) */}
            <div className="md:col-span-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-[32px] p-6 text-white flex flex-col justify-between min-h-[260px] relative overflow-hidden shadow-lg shadow-indigo-500/10">
              <div className="space-y-2 max-w-[60%] relative z-10">
                <p className="text-[10px] font-black text-white/75 uppercase tracking-wide">PACS INTEGRATED WORKFLOW</p>
                <h3 className="text-xl font-black leading-tight">Continuous Disease Staging</h3>
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-white text-indigo-650 rounded-full font-bold text-[10px] uppercase transition-all mt-3 shadow-md hover:bg-slate-50"
                >
                  Analyze Scan
                </button>
              </div>

              {/* 3D Model Overlay on Right */}
              <div className="absolute right-[-10px] bottom-[-10px] w-[50%] h-[110%] flex items-center justify-center z-0">
                <img
                  src="/images/brain_3d.png"
                  alt="3D Human Brain"
                  className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                />
              </div>
            </div>

            {/* Card B: Red/Pink Risk Info Grid Card (3 Columns) */}
            <div className="md:col-span-3 bg-rose-500 rounded-[32px] p-5 text-white flex flex-col justify-between min-h-[260px] relative overflow-hidden shadow-lg shadow-rose-500/10">
              {/* Subtle background grid pattern */}
              <div className="absolute inset-0 opacity-[0.08]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)',
                backgroundSize: '16px 16px',
              }} />

              <div className="relative z-10">
                <div className="w-9.5 h-9.5 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                  <Activity size={16} />
                </div>
                <h4 className="text-base font-black">MCI Conversion Risk</h4>
                <p className="text-[11px] text-rose-50/90 font-semibold leading-relaxed mt-1.5">
                  Evaluate 24-month progression risk using combined cognitive assessments (MMSE/CDR), APOE4 genetics, and regional sub-cortical structures.
                </p>
              </div>

              <div className="relative z-10 pt-2 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center" onClick={() => navigate('/login')}>
                  <ArrowRight size={13} className="-rotate-45" />
                </div>
              </div>
            </div>

            {/* Card C: White Line Graph Card (3 Columns) */}
            <div className="md:col-span-3 bg-white rounded-[32px] p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Dement Staging Trends</span>
                  <div className="flex items-center gap-1.5">
                    <img className="h-5.5 w-5.5 rounded-full object-cover border border-slate-100" src="/images/doctor_sarah.png" alt="Sarah" />
                    <span className="text-[9px] font-bold text-slate-700 font-sans">Neurology</span>
                  </div>
                </div>

                {/* Mini Line Chart */}
                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientTrendsData}>
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Growth Rate</p>
                  <p className="text-sm font-black text-slate-900">+18.5%</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">Weekly</span>
              </div>
            </div>

            {/* Card D: Processing Throughput (3 Columns) */}
            <div className="md:col-span-3 bg-white rounded-[32px] p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Processing Throughput</span>

                {/* Mini Bar Chart */}
                <div className="h-28 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyScansData}>
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50">
                <span>Calibrations</span>
                <span className="text-slate-800 font-extrabold">254/wk</span>
              </div>
            </div>

            {/* Card E: Doctor Profile Card (6 Columns) */}
            <div className="md:col-span-6 bg-gradient-to-tr from-[#818cf8] via-[#6366f1] to-[#4f46e5] rounded-[32px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 min-h-[260px] shadow-lg shadow-indigo-500/10 relative overflow-hidden">
              {/* Doctor Details */}
              <div className="space-y-4 md:max-w-[55%] relative z-10">
                <div>
                  <h4 className="text-lg font-black leading-tight">Dr. Sarah Johnson</h4>
                  <p className="text-[10px] text-indigo-150 font-bold uppercase tracking-wide mt-0.5">Neuroradiology Lead</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-indigo-50/90 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-indigo-200 block text-[9px] uppercase font-bold">Role</span>
                    <span className="font-extrabold">Lead Investigator</span>
                  </div>
                  <div>
                    <span className="text-indigo-200 block text-[9px] uppercase font-bold">Rating</span>
                    <span className="font-extrabold flex items-center gap-1">5.0 <Star size={8} fill="currentColor" /></span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-white text-indigo-650 hover:bg-slate-50 rounded-full font-bold text-xs transition-all uppercase tracking-wider shadow"
                >
                  Launch Console
                </button>
              </div>

              {/* Full portrait cropped on right */}
              <div className="w-full md:w-[45%] h-full flex justify-center md:justify-end items-end relative z-10 mt-4 md:mt-0">
                <img
                  src="/images/doctor_sarah.png"
                  alt="Dr. Sarah Johnson"
                  className="max-h-[220px] object-contain rounded-2xl border-2 border-white/20 shadow-md"
                />
              </div>
            </div>

            {/* Card F: Stat Pill Gradient Card (3 Columns) */}
            <div className="md:col-span-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[32px] p-5 text-white flex flex-col justify-between min-h-[260px] shadow-lg shadow-pink-500/10">
              <div className="w-9.5 h-9.5 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                <Check size={16} />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black tracking-tight leading-none">97.0% Accuracy</h4>
                <p className="text-[10px] text-pink-50/95 font-semibold leading-relaxed">
                  Validated test classification accuracy across multiple ADNI-style cohorts for structural T1-weighted MRI staging.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center" onClick={() => navigate('/login')}>
                  <ArrowRight size={13} className="-rotate-45" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 5: Advanced Technology Showcase (Tablet) */}
      <section id="dashboard-preview" className="py-24 bg-[#f0f3f6] border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">

          {/* Gradient Container block behind mockup */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[48px] border border-slate-800/80 p-8 md:p-14 grid lg:grid-cols-12 gap-12 items-center relative overflow-hidden shadow-2xl">

            {/* Ambient gradients matching the screenshot style */}
            <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full opacity-60 pointer-events-none" />
            <div className="absolute left-[-10%] bottom-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-rose-500/5 to-amber-500/5 blur-3xl rounded-full opacity-40 pointer-events-none" />

            {/* Left Tablet Graphic */}
            <div className="lg:col-span-7 flex justify-center relative z-10 order-2 lg:order-1">
              <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/70 bg-slate-950 flex items-center justify-center">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/009/009/096/non_2x/diagnosis-of-diseases-of-the-brain-in-a-doctor-looking-at-magnetic-resonance-imaging-vector.jpg"
                  alt="Diagnosis of diseases of the brain in a doctor looking at magnetic resonance imaging"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-5 space-y-6 text-white relative z-10 order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Quantifying neuro-decline <br />
                with precision CDSS
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
                Harnessing deep learning and explainable AI to deliver evidence-based clinical decision support, helping teams detect pathological changes years before clinical onset.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-white text-slate-950 rounded-full font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider shadow"
                >
                  explore Clinic/hospital package for SaaS
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 space-y-16">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Footer Column 1: Brand Info */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8.5 h-8.5 rounded-lg bg-white flex items-center justify-center text-slate-955 shadow-md">
                  <Brain size={18} />
                </div>
                <span className="text-base font-extrabold text-white">NEUROSCAN+</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-semibold">
                Quantified neurological intelligence and progression modeling for active decision support. Compatible with hospital PACS networks.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-4 text-slate-500">
                <a href="#" className="hover:text-white transition-colors" title="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="Twitter">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="Instagram">
                  <svg className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors" title="LinkedIn">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Footer Column 2: Address */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Office Address</h4>
              <ul className="space-y-2.5 text-xs text-slate-500 font-semibold">
                <li className="flex items-start gap-2.5">
                  <MapPin size={14} className="text-slate-600 mt-0.5 shrink-0" />
                  <span>
                    Neuroscan Medical Solutions,<br />
                    House #12, Road #15,<br />
                    Gulshan-2, Dhaka-1212,<br />
                    Bangladesh
                  </span>
                </li>
              </ul>
            </div>

            {/* Footer Column 3: Quick Links */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-xs text-slate-500 font-semibold">
                <li><a href="#home" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#doctors" className="hover:text-white transition-colors">Doctors</a></li>
                <li><a href="#dashboard-preview" className="hover:text-white transition-colors">Appointments</a></li>
                <li><a href="#footer" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Footer Column 4: Contact */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3.5 text-xs text-slate-500 font-semibold">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-650" />
                  <a href="mailto:info@feelmind.com" className="hover:text-white transition-colors">info@feelmind.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-650" />
                  <a href="tel:2395550109" className="hover:text-white transition-colors">(239) 555-0109</a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left space-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                © 2026 NeuroScan AI. All rights reserved. FDA Cleared / HIPAA Compliant Support Only.
              </p>
              <p className="text-[10px] text-slate-600 font-medium">
                Validated baseline: 97% Test Accuracy | 0.9994 Macro AUROC | Fully aligned with ABDM/ABHA digital health standards.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-650">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms & Condition</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
            </div>
          </div>

        </div>
      </footer>

      {/* Demo success toast notifications */}
      <AnimatePresence>
        {showDemoNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white py-3.5 px-6 rounded-full shadow-2xl flex items-center gap-2.5"
          >
            <Shield className="text-teal-400" size={16} />
            <div className="text-xs font-semibold">
              <p className="font-bold">Enterprise Demo Requested</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Our medical support team will reach out shortly.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Us / Send us a message Modal */}
      <AnimatePresence>
        {contactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeContactModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl overflow-hidden z-10"
            >
              {/* Background Glows */}
              <div className="absolute right-[-10%] top-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
              <div className="absolute left-[-10%] bottom-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-2xl rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={closeContactModal}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              {!contactSuccess ? (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md">
                      <MessageSquare size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Send us a message</h2>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Have a question about our CDSS platform or enterprise SaaS pricing? Fill out the form below and we'll be in touch.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Subject</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Demo Request">Enterprise Demo Request</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Pricing">SaaS Pricing / Billing</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Your Message</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="How can we help you?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled={isSubmittingContact}
                    type="submit"
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmittingContact ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Submit Message'
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-6">
                  {/* Success State */}
                  <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-500 mx-auto shadow-sm">
                    <Check size={28} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">Message Sent Successfully</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
                      Thank you for reaching out! A NeuroScan team representative will review your message and respond to <strong>{contactForm.email}</strong> within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={closeContactModal}
                    className="px-8 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors shadow"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
