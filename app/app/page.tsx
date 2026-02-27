"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Globe,
  ArrowRight,
  Play,
  Menu,
  X,
  Users,
  Star,
  Heart,
  Stethoscope,
  Pill,
  Video,
  MapPin,
  CheckCircle,
  ArrowUp,
  Clock,
  Send,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";
import { InteractiveGlobe } from "@/components/ui/interactive-globe";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left gap-4 group"
      >
        <span className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#004DFF] dark:group-hover:text-[#CCDBFF] transition-colors">
          {question}
        </span>
        <span className={`shrink-0 w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center transition-all duration-300 ${open ? "bg-[#004DFF] border-[#004DFF] rotate-45" : "group-hover:border-[#004DFF]"}`}>
          <ArrowRight className={`w-3 h-3 transition-colors ${open ? "text-white" : "text-slate-400 group-hover:text-[#004DFF]"}`} />
        </span>
      </button>
      {open && (
        <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed pr-10">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const navItems = [
    { label: "How it Works", href: "#how-it-works" },
    { label: "Find Doctors", href: "#find-doctors" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
  ];

  const features = [
    {
      icon: Shield,
      title: "On-chain Medical Records",
      description:
        "Your health data is stored securely on the Solana blockchain. Immutable, private, and owned entirely by you.",
    },
    {
      icon: Globe,
      title: "Global Doctor Network",
      description:
        "Instantly connect with verified medical professionals from around the world, regardless of your location.",
    },
    {
      icon: Video,
      title: "Seamless Consultations",
      description:
        "High-quality video and chat interfaces designed for low-bandwidth environments, starting with Nigeria.",
    },
    {
      icon: Pill,
      title: "Medication Delivery",
      description:
        "Get prescribed medications delivered directly to your doorstep within hours.",
    },
    {
      icon: Users,
      title: "Patient-Centric Care",
      description:
        "A platform built around the patient, removing geographical and financial barriers to expert medical advice.",
    },
    {
      icon: CheckCircle,
      title: "Decentralized Trust",
      description:
        "Verified credentials and transparent reviews ensure you receive the highest standard of care every time.",
    },
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Sign Up Easily",
      description:
        "Create your account using email or Google - no complex wallet setup required",
      icon: User,
    },
    {
      step: "02",
      title: "Find Your Doctor",
      description:
        "Browse verified doctors or use our AI assistant to find the right specialist",
      icon: Users,
    },
    {
      step: "03",
      title: "Secure Consultation",
      description:
        "Have your video consultation with end-to-end encryption and blockchain verification",
      icon: Video,
    },
    {
      step: "04",
      title: "Get Treatment",
      description:
        "Receive prescriptions and get medications delivered to your location",
      icon: Heart,
    },
  ];

  const testimonials = [
    {
      author: {
        name: "Dr. Adaora Okafor",
        handle: "Cardiologist, Lagos",
        avatar: getDiceBearAvatar("adaora"),
      },
      text: "Epoch telehealth has revolutionized how I connect with patients across Nigeria. The blockchain security gives both me and my patients peace of mind.",
    },
    {
      author: {
        name: "Amara Okonkwo",
        handle: "Patient, Abuja",
        avatar: getDiceBearAvatar("amara"),
      },
      text: "I was able to consult with a specialist in London from my home in Abuja. The medication delivery was fast and reliable.",
    },
    {
      author: {
        name: "Dr. Kemi Adebayo",
        handle: "Dermatologist, Port Harcourt",
        avatar: getDiceBearAvatar("kemi"),
      },
      text: "The platform's AI triage system helps me focus on patients who need my expertise most. It's incredibly efficient.",
    },
    {
      author: {
        name: "Chidi Eze",
        handle: "Patient, Enugu",
        avatar: getDiceBearAvatar("chidi"),
      },
      text: "Living in a rural area, access to specialists was nearly impossible. Epoch telehealth changed that completely for my family.",
    },
    {
      author: {
        name: "Dr. Fatima Bello",
        handle: "Psychiatrist, Kano",
        avatar: getDiceBearAvatar("fatima"),
      },
      text: "The platform respects patient privacy like no other. Having records on the blockchain means my patients trust the process entirely.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl z-50 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                {/* Short logo for small screens */}
                <Image
                  src="/telehealthlogo.svg"
                  alt="Epoch telehealth"
                  width={40}
                  height={40}
                  className="h-8 w-auto md:hidden"
                />
                {/* Full logo for md+ screens */}
                <Image
                  src="/telehealthlogowithtext.svg"
                  alt="Epoch telehealth logo"
                  width={150}
                  height={40}
                  className="h-8 w-auto hidden md:block"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => scrollToSection(item.href.slice(1))}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {item.label}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/signin">
                    <Button className="bg-[#004DFF] hover:bg-[#003bbd] text-white">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col space-y-4 pt-4">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => scrollToSection(item.href.slice(1))}
                      className="text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link href="/signin">
                      <Button className="bg-[#004DFF] hover:bg-[#003bbd] text-white w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CCDBFF]/30 blur-[120px] rounded-full dark:opacity-20" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#004DFF]/10 blur-[120px] rounded-full dark:opacity-20" />
        </div>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1] mb-6 font-heading">
                Quality <br />
                Healthcare, <br />
                <span className="text-[#004DFF]">Anywhere, Anytime.</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Connect with world-class doctors from anywhere. Secure your
                medical records on blockchain. Get medications delivered to your
                doorstep.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12">
                <Link href="/signin">
                  <Button
                    size="lg"
                    className="bg-[#004DFF] hover:bg-[#003bbd] text-white px-8 py-4 text-lg"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-brand-primary" />
                  Blockchain Secured
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Verified Doctors
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-purple-600" />
                  Global Access
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <iframe
                  src="/online-doctor-animate.svg"
                  className="w-full h-auto max-w-lg mx-auto"
                  style={{ minHeight: "500px" }}
                  title="Online Doctor Consultation"
                  frameBorder="0"
                />
              </div>
              <div className="absolute inset-0 bg-[#004DFF]/10 rounded-full blur-3xl"></div>
            </motion.div>

            {/* Verified Doctors Indicator */}
            <motion.div
              className="mt-12 flex items-center gap-6 justify-center lg:justify-start lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=doctor${i}`}
                    className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 object-cover bg-slate-100"
                    alt="Doctor"
                  />
                ))}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">500+ Verified Doctors</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Available 24/7 for consultations</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-[#004DFF] font-bold text-sm uppercase tracking-widest mb-4">The Process</h2>
            <p className="text-4xl font-bold text-slate-900 dark:text-white font-heading">How it Works</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-black text-slate-200 dark:text-slate-700 mb-4 font-heading">{step.step}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                {idx < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-slate-200 dark:bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find Doctors Section */}
      <section
        id="find-doctors"
        className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-brand-primary to-brand-pale rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#CCDBFF]/40 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-brand-pale to-brand-primary rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              Find Your Perfect Doctor
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect with verified healthcare professionals from around the
              world, specialized in your specific needs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Verified Professionals
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      All our doctors are licensed, verified, and have extensive
                      experience in their specialties
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-brand-pale/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      24/7 Availability
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Access healthcare whenever you need it with doctors
                      available around the clock
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Global Network
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Connect with specialists from leading medical institutions
                      worldwide
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  size="lg"
                  onClick={() => scrollToSection("cta")}
                  className="bg-[#004DFF] hover:bg-[#003bbd] text-white"
                >
                  Explore Doctors
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-brand-pale/30 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#004DFF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Meet Our Doctors
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Dr. Sarah Johnson",
                      specialty: "Cardiologist",
                      rating: 4.9,
                      location: "London, UK",
                    },
                    {
                      name: "Dr. Ahmed Hassan",
                      specialty: "Pediatrician",
                      rating: 4.8,
                      location: "Cairo, Egypt",
                    },
                    {
                      name: "Dr. Maria Santos",
                      specialty: "Dermatologist",
                      rating: 4.9,
                      location: "São Paulo, Brazil",
                    },
                  ].map((doctor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              getDiceBearAvatar(doctor.name.toLowerCase()) ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {doctor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {doctor.specialty}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">
                              {doctor.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {doctor.location}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Epoch telehealth Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-[#004DFF] font-bold text-sm uppercase tracking-widest mb-4">Why Epoch telehealth?</h2>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-6 font-heading">
              Revolutionizing Healthcare through Decentralized Trust
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              We leverage Solana blockchain technology to solve the dual crises of inaccessible care and fragmented medical data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xl hover:border-transparent transition-all group h-full">
                  <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-[#004DFF] shadow-sm mb-6 group-hover:bg-[#004DFF] group-hover:text-white transition-colors">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section id="mission" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[#CCDBFF] font-bold text-sm uppercase tracking-widest mb-4">Our Mission</h2>
              <p className="text-4xl lg:text-5xl font-bold mb-8 leading-tight font-heading">
                Democratizing Access to <br />
                <span className="text-[#CCDBFF]">Quality Healthcare.</span>
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 text-[#CCDBFF]"><CheckCircle size={24} /></div>
                  <p className="text-slate-300 text-lg">Connecting patients in underserved regions to global medical expertise.</p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-[#CCDBFF]"><CheckCircle size={24} /></div>
                  <p className="text-slate-300 text-lg">Giving users full ownership and control over their medical data.</p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-[#CCDBFF]"><CheckCircle size={24} /></div>
                  <p className="text-slate-300 text-lg">Upholding the highest standards of integrity and security in digital health.</p>
                </div>
              </div>
              <Link href="/signin">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-[#CCDBFF] px-8 py-4 text-lg h-auto mt-8">
                  Join the Movement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative hidden lg:flex items-center justify-center min-h-[420px]">
              <InteractiveGlobe size={420} />
            </div>
          </div>
        </div>
      </section>

      {/* Regulations & Security Section */}
      <section
        id="security-regulations"
        className="py-20 bg-slate-50 dark:bg-slate-800 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="mb-8">
                <div className="inline-block px-4 py-2 bg-[#CCDBFF]/30 text-[#004DFF] rounded-full text-sm font-semibold mb-4">
                  Security First
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
                  Bank-Grade Security & <br /> Regulatory Compliance
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Your health data is your most private information. We exceed global telemedicine regulations to ensure your peace of mind.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#CCDBFF]/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-[#004DFF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      End-to-End Encryption
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      All video consultations and chat messages use state-of-the-art WebRTC encryption ensuring zero eavesdropping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-[#004DFF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      HIPAA & GDPR Compliant
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Our systems are designed to exceed global healthcare data protection standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Patient-Owned EHR
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Leveraging blockchain to ensure you have immutable, sovereign control over your Electronic Health Records.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-[#004DFF] rounded-3xl p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[1.4rem] p-8 md:p-12 h-full w-full">
                  <div className="flex justify-center mb-8">
                    <Shield className="w-24 h-24 text-[#004DFF] stroke-[1.5]" />
                  </div>
                  <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    Your Privacy is our Priority
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    We do not sell your data. We do not share it without your explicit cryptographic consent. You hold the keys to your health journey.
                  </p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#CCDBFF] rounded-full blur-2xl opacity-50"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#004DFF] rounded-full blur-3xl opacity-20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection
        title="What Our Community Says"
        description="Hear from doctors and patients who are transforming healthcare with Epoch telehealth"
        testimonials={testimonials}
      />

      {/* About Section */}
      <section
        id="about"
        className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-r from-brand-pale to-brand-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-16 right-16 w-40 h-40 bg-[#004DFF]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-24 h-24 bg-gradient-to-r from-purple-400 to-green-400 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              About Epoch telehealth
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Revolutionizing healthcare access in developing nations through
              blockchain technology
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Global Healthcare Access
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    We&apos;re bridging the healthcare gap in developing nations
                    by connecting patients with world-class doctors through
                    blockchain technology.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-brand-pale/50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Secure & Transparent
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your medical records are encrypted and stored on the Solana
                    blockchain, ensuring privacy and security while maintaining
                    accessibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Our Mission
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    To make quality healthcare accessible to everyone,
                    everywhere, by leveraging blockchain technology and
                    connecting patients with the best medical professionals.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-brand-pale/30 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Global Reach
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        45+ Countries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Expert Doctors
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        2,500+ Verified Professionals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Medication Delivery
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Fast & Reliable Service
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-[#004DFF] font-bold text-sm uppercase tracking-widest mb-4">FAQ</h2>
            <p className="text-4xl font-bold text-slate-900 dark:text-white font-heading">
              Frequently Asked Questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-slate-200 dark:divide-slate-700">
            {[
              {
                q: "How do I consult a doctor on Epoch telehealth?",
                a: "Simply sign up, browse our network of verified specialists, and book a video or chat consultation. Your session is encrypted end-to-end and can be done from anywhere using your phone or computer.",
              },
              {
                q: "Are the doctors on the platform verified?",
                a: "Yes. Every doctor undergoes a rigorous credential verification process before being listed. Medical licences and qualifications are validated and stored transparently on the Solana blockchain.",
              },
              {
                q: "Is my medical data secure?",
                a: "Absolutely. Your health records are encrypted and stored on the Solana blockchain, meaning you — and only you — control who can access your data. No third party can view or sell it.",
              },
              {
                q: "Can I get medication delivered after a consultation?",
                a: "Yes. If your doctor prescribes medication, our integrated delivery service will deliver it directly to your location, currently available in select Nigerian cities with more regions coming soon.",
              },
              {
                q: "Is Epoch telehealth available in my country?",
                a: "We are currently focused on Nigeria and expanding across Africa, with consultations available globally. No matter where you are, you can connect with a verified specialist.",
              },
              {
                q: "How much does a consultation cost?",
                a: "Consultation fees vary by doctor and specialty. You can view each doctor's pricing on their profile before booking. We're committed to keeping care affordable and accessible.",
              },
            ].map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="bg-[#004DFF] rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 relative z-10 font-heading">
              Ready to consult a <br /> verified specialist?
            </h2>
            <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto relative z-10">
              Join thousands of patients who are already taking control of their health with Epoch telehealth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/signin">
                <Button size="lg" className="bg-white text-[#004DFF] hover:bg-[#CCDBFF] px-8 py-4 text-lg h-auto">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/doctors">
                <Button size="lg" className="bg-white/20 text-white border border-white/30 hover:bg-white/30 px-8 py-4 text-lg h-auto">
                  View Doctors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/telehealthlogowithtext.svg"
                  alt="Epoch telehealth logo"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Revolutionizing healthcare access through blockchain technology,
                connecting patients with world-class doctors across borders.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://x.com/epochTeleHealth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/+AyXlku_fTwA2ZGJk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Find Doctors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Book Consultation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medical Records
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medication Delivery
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col space-y-2">
              <p className="text-gray-400 text-sm">
                © {currentYear} Epoch telehealth. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                Illustration by{" "}
                <a
                  href="https://storyset.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  Storyset
                </a>
              </p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Powered by</span>
              <div className="flex items-center">
                <Image
                  src="/solanaLogo.png"
                  width={16}
                  height={16}
                  alt="Solana"
                  className="w-16 h-16"
                />
                <span className="text-sm font-semibold">Solana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-[#004DFF] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
